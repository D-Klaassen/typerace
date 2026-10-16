/**
 * The Leaderboard: the fastest Hot Seat Turns and solo Classic Races ever on
 * Words and Sentences, one board per Text Source, Language and Text Length,
 * as Times only compare fairly on the same kind and length of text.
 * Gibberish is for practising keys, so it has no board.
 */
import type { ClassicRace } from "./classic-race";
import type { RealTextSource, TextSource } from "./text-source";
import { TEXT_LENGTH_CHARACTERS, type TextLength } from "./text-length";
import type { HotSeat } from "./hot-seat";

/** How many entries a board keeps and shows. */
export const LEADERBOARD_SIZE = 20;

/** Times on one board were all typed on the same kind and length of text. */
export interface LeaderboardBoard extends RealTextSource {
  textLength: TextLength;
}

/** A Player's best Time from a finished Hot Seat Match, or a solo race's Time. */
export interface LeaderboardRecord {
  nickname: string;
  timeMs: number;
}

export interface LeaderboardEntry extends LeaderboardRecord {
  /** When the Hot Seat Match ended, so equal times rank first come, first served. */
  recordedAtMs: number;
}

/**
 * The board a Match's Times go on; null for Gibberish, which has none. A Hot
 * Seat Match's Turns are `HOT_SEAT_TEXT_LENGTH` long.
 */
export function leaderboardBoard(
  source: TextSource,
  textLength: TextLength,
): LeaderboardBoard | null {
  return source.kind === "gibberish"
    ? null
    : { kind: source.kind, language: source.language, textLength };
}

/**
 * A stable name for a board, to store it under. It starts with the text's
 * characters, so Times from texts of another length (Turns of 150 characters
 * before) stay in storage but never share a board with today's.
 */
export function leaderboardKey({
  kind,
  language,
  textLength,
}: LeaderboardBoard): string {
  return `${TEXT_LENGTH_CHARACTERS[textLength]}:${kind}:${language}`;
}

/** Times go on the board in whole milliseconds; the browser's clock has fractions. */
function record(nickname: string, timeMs: number): LeaderboardRecord {
  return { nickname, timeMs: Math.round(timeMs) };
}

/**
 * Each Player's best Time once the Hot Seat Match has a winner. Players who never
 * finished a Turn have no Time. `nicknameOf` maps the Hot Seat Match's names to
 * nicknames (Online they are Player ids); a name it doesn't know is left out.
 */
export function hotSeatRecords(
  seat: HotSeat,
  nicknameOf: (name: string) => string | undefined = (name) => name,
): LeaderboardRecord[] {
  if (seat.winner === null) {
    return [];
  }

  return seat.players.flatMap(({ name, bestTimeMs }) => {
    const nickname = nicknameOf(name);

    return bestTimeMs === null || nickname === undefined
      ? []
      : [record(nickname, bestTimeMs)];
  });
}

/**
 * The Time of a solo Classic Race on a Shared Keyboard, for the board of its
 * Text Length. A race with more Players has none.
 */
export function soloRaceRecords(race: ClassicRace): LeaderboardRecord[] {
  const [nickname] = race.players;
  const [stats] = race.turns;
  if (
    race.players.length !== 1 ||
    nickname === undefined ||
    stats === undefined
  ) {
    return [];
  }

  return [record(nickname, stats.timeMs)];
}

/** Adds new records to a board, fastest first, and keeps the top entries. */
export function addToLeaderboard(
  board: readonly LeaderboardEntry[],
  records: readonly LeaderboardRecord[],
  recordedAtMs: number,
): LeaderboardEntry[] {
  return [
    ...board,
    ...records.map(({ nickname, timeMs }) => ({
      nickname,
      timeMs,
      recordedAtMs,
    })),
  ]
    .sort((a, b) => a.timeMs - b.timeMs || a.recordedAtMs - b.recordedAtMs)
    .slice(0, LEADERBOARD_SIZE);
}
