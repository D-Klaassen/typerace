import type { Difficulty } from "./gibberish";
import { validateNicknames, type NicknameProblem } from "./nicknames";
import {
  dropFromRace,
  isRaceOver,
  startOnlineRace,
  typeInRace,
  type OnlineRace,
} from "./online-race";

export const MAX_ROOM_PLAYERS = 6;

/** The 3-2-1 before a Match starts. */
export const COUNTDOWN_MS = 3_000;

/** Modes that can already be played Online. */
const ONLINE_MODES: readonly Mode[] = ["classicRace"];

export type Mode = "classicRace" | "crazyDarts" | "timeTrial";

export type TextLength = "short" | "medium" | "long";

export interface RoomSettings {
  mode: Mode;
  difficulty: Difficulty;
  /** Classic Race. */
  textLength: TextLength;
  /** Time Trial. */
  timeBankMs: number;
  /** Crazy Darts. */
  startingHp: number;
  /** Crazy Darts: damage per character of a completed word. */
  dartDamagePerCharacter: number;
  /** Crazy Darts: HP a Player loses per Typo. */
  typoHp: number;
}

/** Characters of Gibberish per Classic Race text (see docs/spec.md). */
export const TEXT_LENGTH_CHARACTERS: Record<TextLength, number> = {
  short: 100,
  medium: 250,
  long: 500,
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  mode: "classicRace",
  difficulty: "medium",
  textLength: "medium",
  timeBankMs: 120_000,
  startingHp: 100,
  dartDamagePerCharacter: 1,
  typoHp: 2,
};

export interface RoomPlayer {
  /** Stable for one connection; a reconnect is a new Player. */
  id: string;
  nickname: string;
  /** Joined during a Match; plays from the next one. */
  spectator: boolean;
}

export type RoomPhase = "lobby" | "countdown" | "racing" | "results";

export interface Room {
  /** In join order, so the first is the longest present. */
  readonly players: readonly RoomPlayer[];
  readonly hostId: string | null;
  readonly settings: RoomSettings;
  /** Each Player's latest Vote per kind, keyed by Player id. */
  readonly votes: Readonly<Record<string, PlayerVotes>>;
  readonly phase: RoomPhase;
  /** During the countdown: when racing starts, on the Room's clock. */
  readonly countdownEndsAtMs: number | null;
  /** The text of the coming or current Match. */
  readonly text: string | null;
  /** The current or last Match's race; null in the lobby. */
  readonly race: OnlineRace | null;
}

export interface PlayerVotes {
  mode?: Mode;
  difficulty?: Difficulty;
}

export type Vote = { mode: Mode } | { difficulty: Difficulty };

export interface VoteCounts {
  mode: Record<Mode, number>;
  difficulty: Record<Difficulty, number>;
}

export type JoinError = "roomFull" | NicknameProblem;

/** On an error, `room` is returned unchanged. */
export interface JoinResult {
  room: Room;
  error: JoinError | null;
}

export function createRoom(): Room {
  return {
    players: [],
    hostId: null,
    settings: DEFAULT_ROOM_SETTINGS,
    votes: {},
    phase: "lobby",
    countdownEndsAtMs: null,
    text: null,
    race: null,
  };
}

export function joinRoom(
  room: Room,
  player: Pick<RoomPlayer, "id" | "nickname">,
): JoinResult {
  if (room.players.length >= MAX_ROOM_PLAYERS) {
    return { room, error: "roomFull" };
  }

  const problem = validateNicknames([
    ...room.players.map((other) => other.nickname),
    player.nickname,
  ]);
  if (problem) {
    return { room, error: problem };
  }

  return {
    room: {
      ...room,
      players: [
        ...room.players,
        {
          ...player,
          nickname: player.nickname.trim(),
          spectator: room.phase !== "lobby",
        },
      ],
      hostId: room.hostId ?? player.id,
    },
    error: null,
  };
}

/** If the Host leaves, the longest-present Player takes over. */
export function leaveRoom(room: Room, playerId: string): Room {
  const players = room.players.filter((player) => player.id !== playerId);
  const hostId =
    room.hostId === playerId ? (players[0]?.id ?? null) : room.hostId;
  // Neither the leaver nor a new Host keeps their Votes.
  const votes = Object.fromEntries(
    Object.entries(room.votes).filter(
      ([id]) => id !== playerId && id !== hostId,
    ),
  );
  const left = { ...room, players, hostId, votes };

  if (left.phase !== "racing" || !left.race) {
    return left;
  }

  // Their progress freezes; the race may now be over without them.
  return finishIfOver(
    { ...left, race: dropFromRace(left.race, playerId) },
    -Infinity,
  );
}

/** Only the Host can change settings; anyone else's change is ignored. */
export function updateSettings(
  room: Room,
  byId: string,
  changes: Partial<RoomSettings>,
): Room {
  if (byId !== room.hostId) {
    return room;
  }

  return { ...room, settings: { ...room.settings, ...changes } };
}

/** Votes are advisory: only non-Host Players cast them, one per kind. */
export function castVote(room: Room, byId: string, vote: Vote): Room {
  const isPlayer = room.players.some((player) => player.id === byId);
  if (!isPlayer || byId === room.hostId) {
    return room;
  }

  return {
    ...room,
    votes: { ...room.votes, [byId]: { ...room.votes[byId], ...vote } },
  };
}

/** Counts the Votes of Players who are still in the Room and not Host. */
export function getVoteCounts(room: Room): VoteCounts {
  const counts: VoteCounts = {
    mode: { classicRace: 0, crazyDarts: 0, timeTrial: 0 },
    difficulty: { easy: 0, medium: 0, hard: 0 },
  };

  for (const player of room.players) {
    const votes = room.votes[player.id];
    if (!votes || player.id === room.hostId) {
      continue;
    }
    if (votes.mode) {
      counts.mode[votes.mode] += 1;
    }
    if (votes.difficulty) {
      counts.difficulty[votes.difficulty] += 1;
    }
  }

  return counts;
}

/** The Host starts the 3-2-1 for a Match on `text`. */
export function startCountdown(
  room: Room,
  byId: string,
  { text, nowMs }: { text: string; nowMs: number },
): Room {
  const canStart =
    byId === room.hostId &&
    room.phase === "lobby" &&
    room.players.length >= 2 &&
    ONLINE_MODES.includes(room.settings.mode);
  if (!canStart) {
    return room;
  }

  return {
    ...room,
    phase: "countdown",
    countdownEndsAtMs: nowMs + COUNTDOWN_MS,
    text,
  };
}

/** Moves the Room along with time: the countdown ending, or a race running out. */
export function advanceClock(room: Room, nowMs: number): Room {
  if (
    room.phase === "countdown" &&
    room.countdownEndsAtMs !== null &&
    nowMs >= room.countdownEndsAtMs
  ) {
    return {
      ...room,
      phase: "racing",
      countdownEndsAtMs: null,
      race: startOnlineRace({
        players: room.players
          .filter((player) => !player.spectator)
          .map((player) => player.id),
        text: room.text ?? "",
        startedAtMs: room.countdownEndsAtMs,
      }),
    };
  }

  return finishIfOver(room, nowMs);
}

/** A Player's keystroke during a race, timed on the Room's clock. */
export function typeInRoom(
  room: Room,
  playerId: string,
  key: string,
  atMs: number,
): Room {
  if (room.phase !== "racing" || !room.race) {
    return room;
  }

  const race = typeInRace(room.race, playerId, key, atMs);
  if (race === room.race) {
    return room;
  }

  return finishIfOver({ ...room, race }, atMs);
}

/** After the results, the Host takes everyone back; Spectators become Players. */
export function backToLobby(room: Room, byId: string): Room {
  if (byId !== room.hostId || room.phase !== "results") {
    return room;
  }

  return {
    ...room,
    phase: "lobby",
    text: null,
    race: null,
    players: room.players.map((player) => ({ ...player, spectator: false })),
  };
}

/** Ends a running race once it's over; Votes reset after every Match. */
function finishIfOver(room: Room, nowMs: number): Room {
  if (room.phase !== "racing" || !room.race || !isRaceOver(room.race, nowMs)) {
    return room;
  }

  return { ...room, phase: "results", votes: {} };
}
