import {
  MAX_NICKNAME_LENGTH,
  MAX_ROOM_PLAYERS,
  MIN_CUSTOM_KEYS,
  normalizeKeys,
  TYPABLE_KEYS,
  type KeySet,
  type LeaderboardEntry,
  type LeaderboardRecord,
} from "@typerace/game";
import { z } from "zod";

/** Where the Rooms server serves the Leaderboard over HTTP. */
export const LEADERBOARD_PATH = "/leaderboard";

/**
 * Bounds on a submitted Time. A Turn of about 150 characters can't take less
 * than a few seconds, and no Time Bank is longer than 10 minutes.
 */
export const MIN_LEADERBOARD_TIME_MS = 5_000;
export const MAX_LEADERBOARD_TIME_MS = 600_000;

const keySet = z
  .object({
    keys: z
      .string()
      .max(TYPABLE_KEYS.length * 2)
      .refine((keys) => normalizeKeys(keys).length >= MIN_CUSTOM_KEYS),
    capitals: z.boolean(),
  })
  .strict();

const submission = z
  .object({
    keySet,
    records: z
      .array(
        z
          .object({
            nickname: z.string().trim().min(1).max(MAX_NICKNAME_LENGTH),
            timeMs: z
              .number()
              .int()
              .min(MIN_LEADERBOARD_TIME_MS)
              .max(MAX_LEADERBOARD_TIME_MS),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_ROOM_PLAYERS),
  })
  .strict();

/** A Shared Keyboard's finished Time Trial, sent by the browser. */
export interface LeaderboardSubmission {
  keySet: KeySet;
  records: LeaderboardRecord[];
}

/** Returns null for anything that isn't a valid submission. */
export function parseLeaderboardSubmission(
  body: unknown,
): LeaderboardSubmission | null {
  const result = submission.safeParse(body);

  return result.success ? result.data : null;
}

/** The search part of a request for a Key Set's board. */
export function leaderboardSearch({ keys, capitals }: KeySet): string {
  return new URLSearchParams({
    keys: normalizeKeys(keys),
    capitals: String(capitals),
  }).toString();
}

/** The Key Set a request asks for; null when it doesn't name a valid one. */
export function parseLeaderboardSearch(params: URLSearchParams): KeySet | null {
  const result = keySet.safeParse({
    keys: params.get("keys") ?? "",
    capitals: params.get("capitals") === "true",
  });

  return result.success ? result.data : null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}
