import {
  LANGUAGES,
  MAX_NICKNAME_LENGTH,
  MAX_ROOM_PLAYERS,
  REAL_TEXT_KINDS,
  TEXT_LENGTH_CHARACTERS,
  TEXT_LENGTHS,
  type Language,
  type LeaderboardBoard,
  type LeaderboardEntry,
  type LeaderboardRecord,
  type RealTextKind,
  type TextLength,
} from "@typerace/game";
import { z } from "zod";

/** Where the Rooms server serves the Leaderboard over HTTP. */
export const LEADERBOARD_PATH = "/leaderboard";

/**
 * Bounds on a submitted Time. Nobody types a character in under 50 ms, so a
 * Medium text of 100 characters can't take less than 5 seconds, and no Time
 * Bank is longer than 10 minutes.
 */
export const MIN_LEADERBOARD_MS_PER_CHARACTER = 50;
export const MAX_LEADERBOARD_TIME_MS = 600_000;

/** The fastest Time a board takes, for the length of its text. */
export function minLeaderboardTimeMs(textLength: TextLength): number {
  return MIN_LEADERBOARD_MS_PER_CHARACTER * TEXT_LENGTH_CHARACTERS[textLength];
}

/**
 * A board is a Text Source's, Language's and Text Length's; Gibberish has
 * none. Without a Text Length it's the Medium board, the only one before
 * boards had a Text Length, so older links and pages keep working.
 */
const board = z
  .object({
    source: z.enum(REAL_TEXT_KINDS),
    language: z.enum(LANGUAGES),
    length: z.enum(TEXT_LENGTHS).default("medium"),
  })
  .strict();

const records = z
  .array(
    z
      .object({
        nickname: z.string().trim().min(1).max(MAX_NICKNAME_LENGTH),
        timeMs: z.number().int().max(MAX_LEADERBOARD_TIME_MS),
      })
      .strict(),
  )
  .min(1)
  .max(MAX_ROOM_PLAYERS);

const submission = board
  .extend({ records })
  .strict()
  .refine(({ length, records }) =>
    records.every(({ timeMs }) => timeMs >= minLeaderboardTimeMs(length)),
  );

/** A Shared Keyboard's finished Hot Seat Match or solo race, sent by the browser. */
export interface LeaderboardSubmission {
  board: LeaderboardBoard;
  records: LeaderboardRecord[];
}

/** What the browser sends: the board's Text Source, Language and Text Length. */
export interface LeaderboardSubmissionBody {
  source: RealTextKind;
  language: Language;
  length: TextLength;
  records: LeaderboardRecord[];
}

export function leaderboardSubmissionBody({
  board,
  records,
}: LeaderboardSubmission): LeaderboardSubmissionBody {
  return {
    source: board.kind,
    language: board.language,
    length: board.textLength,
    records,
  };
}

/** Returns null for anything that isn't a valid submission. */
export function parseLeaderboardSubmission(
  body: unknown,
): LeaderboardSubmission | null {
  const result = submission.safeParse(body);
  if (!result.success) {
    return null;
  }
  const { source, language, length, records } = result.data;

  return { board: { kind: source, language, textLength: length }, records };
}

/** The search part of a request for a board. */
export function leaderboardSearch({
  kind,
  language,
  textLength,
}: LeaderboardBoard): string {
  return new URLSearchParams({
    source: kind,
    language,
    length: textLength,
  }).toString();
}

/** The board a request asks for; null when it doesn't name a valid one. */
export function parseLeaderboardSearch(
  params: URLSearchParams,
): LeaderboardBoard | null {
  const result = board.safeParse({
    source: params.get("source"),
    language: params.get("language"),
    length: params.get("length") ?? undefined,
  });

  return result.success
    ? {
        kind: result.data.source,
        language: result.data.language,
        textLength: result.data.length,
      }
    : null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}
