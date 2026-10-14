import type { Difficulty } from "./gibberish";
import { validateNicknames, type NicknameProblem } from "./nicknames";

export const MAX_ROOM_PLAYERS = 6;

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
}

export interface Room {
  /** In join order, so the first is the longest present. */
  readonly players: readonly RoomPlayer[];
  readonly hostId: string | null;
  readonly settings: RoomSettings;
  /** Each Player's latest Vote per kind, keyed by Player id. */
  readonly votes: Readonly<Record<string, PlayerVotes>>;
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
  };
}

export function joinRoom(room: Room, player: RoomPlayer): JoinResult {
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
        { ...player, nickname: player.nickname.trim() },
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

  return { ...room, players, hostId, votes };
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
