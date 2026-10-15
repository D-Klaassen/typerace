import {
  advanceClock,
  backToLobby,
  castVote,
  createRoom,
  generateText,
  getVoteCounts,
  joinRoom,
  leaveRoom,
  roomLeaderboardRecords,
  roomTextSource,
  setDisplay,
  startCountdown,
  TEXT_LENGTH_CHARACTERS,
  typeInRoom,
  updateSettings,
  type Room,
} from "@typerace/game";
import {
  LEADERBOARD_PATH,
  parseClientMessage,
  toRoomView,
  type RoomError,
  type ServerMessage,
} from "@typerace/protocol";
import { routePartykitRequest, Server, type Connection } from "partyserver";
import { leaderboardOf, leaderboardResponse } from "./leaderboard";

export { Leaderboard } from "./leaderboard";

/** How often a running Room checks its clock (countdown end, grace period). */
const CLOCK_TICK_MS = 250;

/**
 * One Durable Object per Room (see docs/adr/0001). It owns the Room's state
 * and applies every change through the rules in @typerace/game.
 */
export class Rooms extends Server<Env> {
  private room: Room = createRoom();
  /** Set by the first "create" join; a "join" into an uncreated Room fails. */
  private created = false;
  private clock: ReturnType<typeof setInterval> | null = null;

  onMessage(connection: Connection, raw: string | ArrayBuffer) {
    if (typeof raw !== "string") {
      return;
    }
    const message = parseClientMessage(raw);
    if (!message) {
      return;
    }

    const isPlayer = this.room.players.some(
      (player) => player.id === connection.id,
    );

    switch (message.type) {
      case "join": {
        if (isPlayer) {
          return;
        }
        if (message.intent === "join" && !this.created) {
          this.sendError(connection, "roomNotFound");
          return;
        }
        const result = joinRoom(this.room, {
          id: connection.id,
          nickname: message.nickname,
        });
        if (result.error) {
          this.sendError(connection, result.error);
          return;
        }
        this.created = true;
        this.setRoom(result.room);
        return;
      }

      case "updateSettings":
        this.setRoom(updateSettings(this.room, connection.id, message.changes));
        return;

      case "vote":
        this.setRoom(castVote(this.room, connection.id, message.vote));
        return;

      case "start": {
        const { textLength } = this.room.settings;
        const seed = Math.floor(Math.random() * 2 ** 31);
        const text = generateText(roomTextSource(this.room), {
          seed,
          minLength: TEXT_LENGTH_CHARACTERS[textLength],
        });
        this.setRoom(
          startCountdown(this.room, connection.id, {
            text,
            seed,
            nowMs: Date.now(),
          }),
        );
        return;
      }

      case "key":
        // Keystrokes are timed on the Room's clock (see docs/spec.md).
        this.setRoom(
          typeInRoom(this.room, connection.id, message.key, Date.now()),
        );
        return;

      case "display":
        this.setRoom(setDisplay(this.room, connection.id, message.display));
        return;

      case "backToLobby":
        this.setRoom(backToLobby(this.room, connection.id));
        return;
    }
  }

  onClose(connection: Connection) {
    // partysocket reuses its id when it reconnects; if the new socket is
    // already here, the Player hasn't left.
    const reconnected = [...this.getConnections()].some(
      (other) => other.id === connection.id && other !== connection,
    );
    if (reconnected) {
      return;
    }

    this.setRoom(leaveRoom(this.room, connection.id));
    // The Room disappears when its last Player leaves.
    if (this.room.players.length === 0) {
      this.room = createRoom();
      this.created = false;
      this.runClockWhileNeeded();
    }
  }

  private setRoom(room: Room) {
    if (room === this.room) {
      return;
    }
    const finished = room.phase === "results" && this.room.phase !== "results";
    this.room = room;
    this.runClockWhileNeeded();
    if (finished) {
      this.recordOnLeaderboard();
    }

    const view = toRoomView(room);
    const voteCounts = getVoteCounts(room);
    const serverNowMs = Date.now();
    for (const player of room.players) {
      this.getConnection(player.id)?.send(
        serialize({
          type: "state",
          room: view,
          voteCounts,
          you: player.id,
          serverNowMs,
        }),
      );
    }
  }

  /** The countdown and the race's grace period need the clock to move on. */
  private runClockWhileNeeded() {
    const needsClock =
      this.room.phase === "countdown" || this.room.phase === "racing";

    if (needsClock && !this.clock) {
      this.clock = setInterval(
        () => this.setRoom(advanceClock(this.room, Date.now())),
        CLOCK_TICK_MS,
      );
    } else if (!needsClock && this.clock) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }

  /** A finished Time Trial's best Times go on the Leaderboard. */
  private recordOnLeaderboard() {
    const finished = roomLeaderboardRecords(this.room);
    if (finished && finished.records.length > 0) {
      this.ctx.waitUntil(
        leaderboardOf(this.env).record(finished.textSource, finished.records),
      );
    }
  }

  private sendError(connection: Connection, reason: RoomError) {
    connection.send(serialize({ type: "error", reason }));
  }
}

function serialize(message: ServerMessage): string {
  return JSON.stringify(message);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === LEADERBOARD_PATH) {
      return leaderboardResponse(request, env);
    }

    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
