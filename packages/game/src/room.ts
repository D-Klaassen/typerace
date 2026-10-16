import {
  DEFAULT_KEY_SET_CHOICE,
  resolveKeySet,
  type KeySetChoice,
} from "./key-sets";
import { hotSeatRecords, type LeaderboardRecord } from "./leaderboard";
import {
  resolveTextSource,
  type Language,
  type TextSource,
  type TextSourceKind,
} from "./text-source";
import { validateNicknames, type NicknameProblem } from "./nicknames";
import {
  crazyDartsText,
  dropFromDarts,
  startCrazyDarts,
  typeInDarts,
  type CrazyDarts,
} from "./crazy-darts";
import {
  advanceHotSeat,
  dropFromHotSeat,
  startOnlineHotSeat,
  typeInHotSeat,
  type OnlineHotSeat,
} from "./online-hot-seat";
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
export const ONLINE_MODES: readonly Mode[] = [
  "classicRace",
  "crazyDarts",
  "hotSeat",
];

export type Mode = "classicRace" | "crazyDarts" | "hotSeat";

export type TextLength = "short" | "medium" | "long";

export interface RoomSettings {
  mode: Mode;
  /** Gibberish, Words or Sentences. */
  textSource: TextSourceKind;
  /** Words and Sentences only. */
  language: Language;
  /** Gibberish only: which keys it may contain. */
  keySet: KeySetChoice;
  /** Letters may start with a capital, to practise Shift. */
  capitals: boolean;
  /** Classic Race. */
  textLength: TextLength;
  /** Hot Seat. */
  timeBankMs: number;
  /** Crazy Darts. */
  startingHp: number;
  /** Crazy Darts: damage per character of a completed word. */
  dartDamagePerCharacter: number;
  /** Crazy Darts: HP a Player loses per Typo. */
  typoHp: number;
}

/** Characters per Classic Race text (see docs/spec.md). */
export const TEXT_LENGTH_CHARACTERS: Record<TextLength, number> = {
  short: 50,
  medium: 100,
  long: 200,
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  mode: "classicRace",
  textSource: "gibberish",
  language: "en",
  keySet: DEFAULT_KEY_SET_CHOICE,
  capitals: false,
  textLength: "medium",
  timeBankMs: 120_000,
  startingHp: 100,
  dartDamagePerCharacter: 1,
  typoHp: 2,
};

/** Which typing aids a Player sees (see CONTEXT.md: Display). */
export interface Display {
  fingerGuide: boolean;
  keyboard: boolean;
}

/** Until a Player says otherwise: the Finger Guide on, the keyboard off. */
export const DEFAULT_DISPLAY: Display = { fingerGuide: true, keyboard: false };

export interface RoomPlayer {
  /** Stable for one connection; a reconnect is a new Player. */
  id: string;
  nickname: string;
  /** Joined during a Match; plays from the next one. */
  spectator: boolean;
  /** The aids this Player currently has on. */
  display: Display;
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
  /** The current or last Classic Race; null in the lobby. */
  readonly race: OnlineRace | null;
  /** The current or last Hot Seat; null in the lobby. */
  readonly hotSeat: OnlineHotSeat | null;
  /** The current or last Crazy Darts; null in the lobby. */
  readonly darts: CrazyDarts | null;
  /** Each Player's aids as they were when the Match started. */
  readonly matchDisplays: Readonly<Record<string, Display>>;
  /** Seeds the Match's text where it isn't generated up front (Hot Seat, Crazy Darts). */
  readonly seed: number;
}

export interface PlayerVotes {
  mode?: Mode;
  /** A preset id; custom Key Sets can't be voted for. */
  keySet?: string;
}

export type Vote = { mode: Mode } | { keySet: string };

export interface VoteCounts {
  mode: Record<Mode, number>;
  /** Only presets that have Votes appear. */
  keySet: Record<string, number>;
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
    hotSeat: null,
    darts: null,
    matchDisplays: {},
    seed: 0,
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
          display: DEFAULT_DISPLAY,
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

  if (left.phase !== "racing") {
    return left;
  }
  if (left.darts) {
    return finishIfOver(
      { ...left, darts: dropFromDarts(left.darts, playerId) },
      -Infinity,
    );
  }
  if (left.hotSeat) {
    return finishIfOver(
      { ...left, hotSeat: dropFromHotSeat(left.hotSeat, playerId) },
      -Infinity,
    );
  }
  if (!left.race) {
    return left;
  }

  // Their progress freezes; the race may now be over without them.
  return finishIfOver(
    { ...left, race: dropFromRace(left.race, playerId) },
    -Infinity,
  );
}

/** Only the Host can change settings, and only in the lobby. */
export function updateSettings(
  room: Room,
  byId: string,
  changes: Partial<RoomSettings>,
): Room {
  if (byId !== room.hostId || room.phase !== "lobby") {
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
    mode: { classicRace: 0, crazyDarts: 0, hotSeat: 0 },
    keySet: {},
  };

  for (const player of room.players) {
    const votes = room.votes[player.id];
    if (!votes || player.id === room.hostId) {
      continue;
    }
    if (votes.mode) {
      counts.mode[votes.mode] += 1;
    }
    if (votes.keySet) {
      counts.keySet[votes.keySet] = (counts.keySet[votes.keySet] ?? 0) + 1;
    }
  }

  return counts;
}

/** The Host starts the 3-2-1 for a Match on `text`. */
export function startCountdown(
  room: Room,
  byId: string,
  { text, seed, nowMs }: { text: string; seed: number; nowMs: number },
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
    seed,
  };
}

/** Moves the Room along with time: the countdown ending, or a race running out. */
export function advanceClock(room: Room, nowMs: number): Room {
  if (
    room.phase === "countdown" &&
    room.countdownEndsAtMs !== null &&
    nowMs >= room.countdownEndsAtMs
  ) {
    const players = room.players
      .filter((player) => !player.spectator)
      .map((player) => player.id);
    const started = {
      ...room,
      phase: "racing",
      countdownEndsAtMs: null,
      matchDisplays: Object.fromEntries(
        room.players
          .filter((player) => !player.spectator)
          .map((player) => [player.id, player.display]),
      ),
    } as const;

    if (room.settings.mode === "crazyDarts") {
      const { startingHp, dartDamagePerCharacter, typoHp } = room.settings;

      return {
        ...started,
        darts: startCrazyDarts({
          players,
          text: crazyDartsText(room.seed, roomTextSource(room)),
          startingHp,
          dartDamagePerCharacter,
          typoHp,
        }),
      };
    }

    return room.settings.mode === "hotSeat"
      ? {
          ...started,
          hotSeat: startOnlineHotSeat({
            players,
            timeBankMs: room.settings.timeBankMs,
            textSource: roomTextSource(room),
            seed: room.seed,
          }),
        }
      : {
          ...started,
          race: startOnlineRace({
            players,
            text: room.text ?? "",
            startedAtMs: room.countdownEndsAtMs,
          }),
        };
  }

  if (room.phase === "racing" && room.hotSeat) {
    return finishIfOver(
      { ...room, hotSeat: advanceHotSeat(room.hotSeat, nowMs) },
      nowMs,
    );
  }

  return finishIfOver(room, nowMs);
}

/**
 * A Player's keystroke during a Match, timed on the Room's clock. `random`
 * breaks ties when a Crazy Darts Dart picks its target.
 */
export function typeInRoom(
  room: Room,
  playerId: string,
  key: string,
  atMs: number,
  random: () => number = Math.random,
): Room {
  if (room.phase !== "racing") {
    return room;
  }
  if (room.darts) {
    const darts = typeInDarts(room.darts, playerId, key, atMs, random);

    return darts === room.darts ? room : finishIfOver({ ...room, darts }, atMs);
  }
  if (room.hotSeat) {
    const hotSeat = typeInHotSeat(room.hotSeat, playerId, key, atMs);

    return hotSeat === room.hotSeat
      ? room
      : finishIfOver({ ...room, hotSeat }, atMs);
  }
  if (!room.race) {
    return room;
  }

  const race = typeInRace(room.race, playerId, key, atMs);
  if (race === room.race) {
    return room;
  }

  return finishIfOver({ ...room, race }, atMs);
}

/** A Player switches their aids; they count from the next Match. */
export function setDisplay(
  room: Room,
  playerId: string,
  display: Display,
): Room {
  if (!room.players.some((player) => player.id === playerId)) {
    return room;
  }

  return {
    ...room,
    players: room.players.map((player) =>
      player.id === playerId ? { ...player, display } : player,
    ),
  };
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
    hotSeat: null,
    darts: null,
    players: room.players.map((player) => ({ ...player, spectator: false })),
  };
}

/** Ends a running race once it's over; Votes reset after every Match. */
function finishIfOver(room: Room, nowMs: number): Room {
  const over = room.darts
    ? room.darts.winner !== null
    : room.hotSeat
      ? room.hotSeat.seat.winner !== null
      : room.race !== null && isRaceOver(room.race, nowMs);
  if (room.phase !== "racing" || !over) {
    return room;
  }

  return { ...room, phase: "results", votes: {} };
}

/** The keys and Capitals the Room's settings stand for. */
export function roomKeySet(room: Room) {
  return resolveKeySet(room.settings.keySet, room.settings.capitals);
}

/** Where the Room's text comes from, as its settings stand. */
export function roomTextSource(room: Room): TextSource {
  return resolveTextSource(room.settings);
}

/**
 * The best Times of a finished Online Hot Seat Match, for the Leaderboard. Only
 * Players still in the Room are on it: the Room no longer knows who left.
 */
export function roomLeaderboardRecords(
  room: Room,
): { textSource: TextSource; records: LeaderboardRecord[] } | null {
  if (room.phase !== "results" || !room.hotSeat) {
    return null;
  }

  return {
    textSource: room.hotSeat.textSource,
    records: hotSeatRecords(
      room.hotSeat.seat,
      (id) => room.players.find((player) => player.id === id)?.nickname,
    ),
  };
}
