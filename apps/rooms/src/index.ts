import {
  castVote,
  createRoom,
  getVoteCounts,
  joinRoom,
  leaveRoom,
  updateSettings,
  type Room,
} from "@typerace/game";
import {
  parseClientMessage,
  type RoomError,
  type ServerMessage,
} from "@typerace/protocol";
import { routePartykitRequest, Server, type Connection } from "partyserver";

/**
 * One Durable Object per Room (see docs/adr/0001). It owns the Room's state
 * and applies every change through the rules in @typerace/game.
 */
export class Rooms extends Server<Env> {
  private room: Room = createRoom();
  /** Set by the first "create" join; a "join" into an uncreated Room fails. */
  private created = false;

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
    }
  }

  private setRoom(room: Room) {
    if (room === this.room) {
      return;
    }
    this.room = room;

    const voteCounts = getVoteCounts(room);
    for (const player of room.players) {
      this.getConnection(player.id)?.send(
        serialize({ type: "state", room, voteCounts, you: player.id }),
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
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
