import {
  LANGUAGES,
  MAX_NICKNAME_LENGTH,
  MAX_ROOM_PLAYERS,
  REAL_TEXT_KINDS,
  type Language,
  type LeaderboardEntry,
  type LeaderboardRecord,
  type RealTextKind,
  type RealTextSource,
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

/** A board is a Text Source's and Language's; Gibberish has none. */
const realText = z
  .object({
    source: z.enum(REAL_TEXT_KINDS),
    language: z.enum(LANGUAGES),
  })
  .strict();

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

const submission = realText.extend({ records }).strict();

/** A Shared Keyboard's finished Hot Seat Match, sent by the browser. */
export interface LeaderboardSubmission {
  textSource: RealTextSource;
  records: LeaderboardRecord[];
}

/** What the browser sends: the board's Text Source and Language. */
export interface LeaderboardSubmissionBody {
  source: RealTextKind;
  language: Language;
  records: LeaderboardRecord[];
}

export function leaderboardSubmissionBody({
  textSource,
  records,
}: LeaderboardSubmission): LeaderboardSubmissionBody {
  return { source: textSource.kind, language: textSource.language, records };
}

/** Returns null for anything that isn't a valid submission. */
export function parseLeaderboardSubmission(
  body: unknown,
): LeaderboardSubmission | null {
  const result = submission.safeParse(body);
  if (!result.success) {
    return null;
  }
  const { source, language, records } = result.data;

  return { textSource: { kind: source, language }, records };
}

/** The search part of a request for a Text Source's board. */
export function leaderboardSearch({ kind, language }: RealTextSource): string {
  return new URLSearchParams({ source: kind, language }).toString();
}

/** The board a request asks for; null when it doesn't name a valid one. */
export function parseLeaderboardSearch(
  params: URLSearchParams,
): RealTextSource | null {
  const result = realText.safeParse({
    source: params.get("source"),
    language: params.get("language"),
  });

  return result.success
    ? { kind: result.data.source, language: result.data.language }
    : null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}
