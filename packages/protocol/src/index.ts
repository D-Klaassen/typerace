import {
  currentTimeBankMs,
  findPreset,
  LANGUAGES,
  roomTextSource,
  TEXT_SOURCE_KINDS,
  TYPABLE_KEYS,
  getCrazyDartsResults,
  getOnlineRaceResults,
  getHotSeatResults,
  type CrazyDartsResult,
  type Dart,
  type JoinError,
  type OnlineRaceResult,
  type Room,
  type HotSeat,
  type TextSource,
  type HotSeatResult,
  type VoteCounts,
} from "@typerace/game";
import { z } from "zod";

// Letters only, without I and O so codes are easy to read aloud and type.
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));

  return Array.from(
    bytes,
    (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length],
  ).join("");
}

export function isRoomCode(value: string): boolean {
  return new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`).test(
    value,
  );
}

/** The PartyServer party that hosts Rooms (binding `Rooms`). */
export const ROOMS_PARTY = "rooms";

const mode = z.enum(["classicRace", "crazyDarts", "hotSeat"]);
const presetId = z
  .string()
  .max(32)
  .refine((id) => findPreset(id) !== undefined, "Unknown Key Set preset");
const keySetChoice = z.union([
  z.object({ preset: presetId }).strict(),
  z.object({ custom: z.string().max(TYPABLE_KEYS.length * 2) }).strict(),
]);

const settingsChanges = z
  .object({
    mode,
    textSource: z.enum(TEXT_SOURCE_KINDS),
    language: z.enum(LANGUAGES),
    keySet: keySetChoice,
    capitals: z.boolean(),
    textLength: z.enum(["short", "medium", "long"]),
    timeBankMs: z.number().int().min(60_000).max(600_000),
    startingHp: z.number().int().min(10).max(500),
    dartDamagePerCharacter: z.number().int().min(1).max(10),
    typoHp: z.number().int().min(0).max(20),
  })
  .partial()
  .strict();

const clientMessage = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    nickname: z.string().max(64),
    /** "create" may start a new Room; "join" only enters an existing one. */
    intent: z.enum(["create", "join"]),
  }),
  z.object({ type: z.literal("updateSettings"), changes: settingsChanges }),
  z.object({ type: z.literal("start") }),
  z.object({
    type: z.literal("display"),
    display: z
      .object({ fingerGuide: z.boolean(), keyboard: z.boolean() })
      .strict(),
  }),
  z.object({ type: z.literal("key"), key: z.string().length(1) }),
  z.object({ type: z.literal("backToLobby") }),
  z.object({
    type: z.literal("vote"),
    vote: z.union([
      z.object({ mode }).strict(),
      z.object({ keySet: presetId }).strict(),
    ]),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessage>;

/** Returns null for anything that isn't a valid message. */
export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const result = clientMessage.safeParse(JSON.parse(raw));

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export type RoomError = JoinError | "roomNotFound";

/** One racer's progress as the clients see it. */
export interface RacerView {
  playerId: string;
  position: number;
  typos: number;
  finished: boolean;
  dropped: boolean;
}

/** A Hot Seat as the clients see it; Player names are Player ids. */
export interface HotSeatView {
  seat: HotSeat;
  /** The current Turn, so the others can watch it fill in. */
  turn: {
    text: string;
    position: number;
    inError: boolean;
    /** On the Room's clock; null until the first keystroke. */
    firstKeyAtMs: number | null;
    /** What was left of the Time Bank when the Turn began. */
    timeBankMs: number;
  } | null;
}

/** How many recent Darts the clients get, to show who hit whom. */
const RECENT_DARTS = 8;

/** Crazy Darts as the clients see it. */
export interface DartsView {
  /**
   * The browser rebuilds the long text from this seed rather than receiving
   * it with every update; everyone sees the same text anyway.
   */
  textSeed: number;
  textSource: TextSource;
  players: {
    playerId: string;
    position: number;
    hp: number;
    out: boolean;
  }[];
  /** The latest Darts, oldest first. */
  recentDarts: Dart[];
}

export type RoomResults =
  | { mode: "classicRace"; ranking: OnlineRaceResult[] }
  | { mode: "crazyDarts"; ranking: CrazyDartsResult[] }
  | { mode: "hotSeat"; ranking: HotSeatResult[] };

/** The Room as sent to clients: no per-racer copies of the text. */
export type RoomView = Omit<Room, "race" | "hotSeat" | "darts" | "seed"> & {
  race: { text: string; startedAtMs: number; racers: RacerView[] } | null;
  hotSeat: HotSeatView | null;
  darts: DartsView | null;
  /** The ranking once a Match is over; null before that. */
  results: RoomResults | null;
};

export function toRoomView(room: Room): RoomView {
  const { race, hotSeat, darts, seed, ...rest } = room;

  return {
    ...rest,
    darts: darts && {
      textSeed: seed,
      textSource: roomTextSource(room),
      players: darts.players.map(({ playerId, session, hp, out }) => ({
        playerId,
        position: session.position,
        hp,
        out,
      })),
      recentDarts: darts.darts.slice(-RECENT_DARTS),
    },
    hotSeat: hotSeat && {
      seat: hotSeat.seat,
      turn: hotSeat.turn && {
        text: hotSeat.turn.text,
        position: hotSeat.turn.position,
        inError: hotSeat.turn.inError,
        firstKeyAtMs: hotSeat.turn.firstKeyAtMs,
        timeBankMs: currentTimeBankMs(hotSeat) ?? 0,
      },
    },
    race: race && {
      text: race.text,
      startedAtMs: race.startedAtMs,
      racers: race.entries.map(({ playerId, session, dropped }) => ({
        playerId,
        position: session.position,
        typos: session.typos,
        finished: session.finished,
        dropped,
      })),
    },
    results: resultsOf(room),
  };
}

function resultsOf(room: Room): RoomResults | null {
  if (room.phase !== "results") {
    return null;
  }
  if (room.darts) {
    return {
      mode: "crazyDarts",
      ranking: getCrazyDartsResults(room.darts),
    };
  }
  if (room.hotSeat) {
    return {
      mode: "hotSeat",
      ranking: getHotSeatResults(room.hotSeat.seat),
    };
  }

  return room.race
    ? { mode: "classicRace", ranking: getOnlineRaceResults(room.race) }
    : null;
}

export type ServerMessage =
  | {
      type: "state";
      room: RoomView;
      voteCounts: VoteCounts;
      /** The receiving Player's id. */
      you: string;
      /** The Room's clock when this was sent, to show the countdown. */
      serverNowMs: number;
    }
  | { type: "error"; reason: RoomError };

/** The Room trusts its own messages, so the client only checks the shape lightly. */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const message = JSON.parse(raw) as ServerMessage;

    return message.type === "state" || message.type === "error"
      ? message
      : null;
  } catch {
    return null;
  }
}

export {
  LEADERBOARD_PATH,
  leaderboardSearch,
  leaderboardSubmissionBody,
  MAX_LEADERBOARD_TIME_MS,
  MIN_LEADERBOARD_TIME_MS,
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
  type LeaderboardResponse,
  type LeaderboardSubmission,
  type LeaderboardSubmissionBody,
} from "./leaderboard";
