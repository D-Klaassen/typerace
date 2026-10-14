import type { JoinError, Room, VoteCounts } from "@typerace/game";
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

const mode = z.enum(["classicRace", "crazyDarts", "timeTrial"]);
const difficulty = z.enum(["easy", "medium", "hard"]);

const settingsChanges = z
  .object({
    mode,
    difficulty,
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
  z.object({
    type: z.literal("vote"),
    vote: z.union([
      z.object({ mode }).strict(),
      z.object({ difficulty }).strict(),
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

export type ServerMessage =
  | {
      type: "state";
      room: Room;
      voteCounts: VoteCounts;
      /** The receiving Player's id. */
      you: string;
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
