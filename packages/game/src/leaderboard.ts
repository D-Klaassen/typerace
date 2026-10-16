/**
 * The Leaderboard: the fastest Hot Seat Turns and solo Classic Races ever,
 * one board per Text Source. Times only compare fairly on the same kind of
 * text: Gibberish has a board per Key Set (the resolved keys plus Capitals,
 * however the Key Set was chosen), and Words and Sentences one per Language.
 */
import type { ClassicRace } from "./classic-race";
import { normalizeKeys } from "./key-sets";
import { HOT_SEAT_TURN_LENGTH } from "./online-hot-seat";
import type { TextSource } from "./text-source";
import type { HotSeat } from "./hot-seat";

/** How many entries a board keeps and shows. */
export const LEADERBOARD_SIZE = 20;

/** A Player's best Time from one finished Hot Seat Match. */
export interface LeaderboardRecord {
  nickname: string;
  timeMs: number;
}

export interface LeaderboardEntry extends LeaderboardRecord {
  /** When the Hot Seat Match ended, so equal times rank first come, first served. */
  recordedAtMs: number;
}

/**
 * A stable name for the board of a Text Source, to store it under. It
 * includes the Turn length, so Times from Turns of another length (150
 * characters before) stay in storage but never share a board with today's.
 */
export function leaderboardBoard(source: TextSource): string {
  if (source.kind !== "gibberish") {
    return `${HOT_SEAT_TURN_LENGTH}:${source.kind}:${source.language}`;
  }
  const { keys, capitals } = source.keySet;

  return `${HOT_SEAT_TURN_LENGTH}:${capitals ? "A" : "a"}:${normalizeKeys(keys)}`;
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
      : [{ nickname, timeMs: bestTimeMs }];
  });
}

/**
 * The Time of a solo Classic Race on a Shared Keyboard. It only counts when
 * its text was a Hot Seat Turn's length, so it shares a board fairly with
 * Turns. `textLength` is the number of characters the text was made with.
 */
export function soloRaceRecords(
  race: ClassicRace,
  textLength: number,
): LeaderboardRecord[] {
  const [nickname] = race.players;
  const [stats] = race.turns;
  if (
    race.players.length !== 1 ||
    textLength !== HOT_SEAT_TURN_LENGTH ||
    nickname === undefined ||
    stats === undefined
  ) {
    return [];
  }

  return [{ nickname, timeMs: stats.timeMs }];
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
