import {
  LANGUAGES,
  MAX_NICKNAME_LENGTH,
  MAX_ROOM_PLAYERS,
  MIN_CUSTOM_KEYS,
  normalizeKeys,
  REAL_TEXT_KINDS,
  TYPABLE_KEYS,
  type KeySet,
  type Language,
  type LeaderboardEntry,
  type LeaderboardRecord,
  type RealTextKind,
  type TextSource,
} from "@typerace/game";
import { z } from "zod";

/** Where the Rooms server serves the Leaderboard over HTTP. */
export const LEADERBOARD_PATH = "/leaderboard";

/**
 * Bounds on a submitted Time. A Turn of about 100 characters can't take less
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

/** A board is a Key Set's for Gibberish, else a Text Source and Language. */
const realText = {
  source: z.enum(REAL_TEXT_KINDS),
  language: z.enum(LANGUAGES),
};

const records = z
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
  .max(MAX_ROOM_PLAYERS);

const submission = z.union([
  z.object({ keySet, records }).strict(),
  z.object({ ...realText, records }).strict(),
]);

/** A Shared Keyboard's finished Hot Seat Match, sent by the browser. */
export interface LeaderboardSubmission {
  textSource: TextSource;
  records: LeaderboardRecord[];
}

/** What the browser sends: the board's Key Set, or its Text Source and Language. */
export type LeaderboardSubmissionBody =
  | { keySet: KeySet; records: LeaderboardRecord[] }
  | { source: RealTextKind; language: Language; records: LeaderboardRecord[] };

export function leaderboardSubmissionBody({
  textSource,
  records,
}: LeaderboardSubmission): LeaderboardSubmissionBody {
  return textSource.kind === "gibberish"
    ? { keySet: textSource.keySet, records }
    : { source: textSource.kind, language: textSource.language, records };
}

/** Returns null for anything that isn't a valid submission. */
export function parseLeaderboardSubmission(
  body: unknown,
): LeaderboardSubmission | null {
  const result = submission.safeParse(body);
  if (!result.success) {
    return null;
  }
  const { records } = result.data;

  return "keySet" in result.data
    ? {
        textSource: { kind: "gibberish", keySet: result.data.keySet },
        records,
      }
    : {
        textSource: {
          kind: result.data.source,
          language: result.data.language,
        },
        records,
      };
}

/** The search part of a request for a Text Source's board. */
export function leaderboardSearch(textSource: TextSource): string {
  if (textSource.kind !== "gibberish") {
    return new URLSearchParams({
      source: textSource.kind,
      language: textSource.language,
    }).toString();
  }
  const { keys, capitals } = textSource.keySet;

  return new URLSearchParams({
    keys: normalizeKeys(keys),
    capitals: String(capitals),
  }).toString();
}

/** The board a request asks for; null when it doesn't name a valid one. */
export function parseLeaderboardSearch(
  params: URLSearchParams,
): TextSource | null {
  if (params.has("source")) {
    const result = z.object(realText).safeParse({
      source: params.get("source"),
      language: params.get("language"),
    });

    return result.success
      ? { kind: result.data.source, language: result.data.language }
      : null;
  }
  const result = keySet.safeParse({
    keys: params.get("keys") ?? "",
    capitals: params.get("capitals") === "true",
  });

  return result.success ? { kind: "gibberish", keySet: result.data } : null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}
