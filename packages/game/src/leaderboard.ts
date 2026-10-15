/**
 * The Leaderboard: the fastest Time Trial Turns ever, one board per Key Set.
 * Times only compare fairly on the same keys, so a board is the resolved keys
 * plus Capitals, however the Key Set was chosen.
 */
import { normalizeKeys, type KeySet } from "./key-sets";
import type { TimeTrial } from "./time-trial";

/** How many entries a board keeps and shows. */
export const LEADERBOARD_SIZE = 20;

/** A Player's best Time from one finished Time Trial. */
export interface LeaderboardRecord {
  nickname: string;
  timeMs: number;
}

export interface LeaderboardEntry extends LeaderboardRecord {
  /** When the Time Trial ended, so equal times rank first come, first served. */
  recordedAtMs: number;
}

/** A stable name for the board of a Key Set, to store it under. */
export function leaderboardBoard({ keys, capitals }: KeySet): string {
  return `${capitals ? "A" : "a"}:${normalizeKeys(keys)}`;
}

/**
 * Each Player's best Time once the Time Trial has a winner. Players who never
 * finished a Turn have no Time. `nicknameOf` maps the Time Trial's names to
 * nicknames (Online they are Player ids); a name it doesn't know is left out.
 */
export function timeTrialRecords(
  trial: TimeTrial,
  nicknameOf: (name: string) => string | undefined = (name) => name,
): LeaderboardRecord[] {
  if (trial.winner === null) {
    return [];
  }

  return trial.players.flatMap(({ name, bestTimeMs }) => {
    const nickname = nicknameOf(name);

    return bestTimeMs === null || nickname === undefined
      ? []
      : [{ nickname, timeMs: bestTimeMs }];
  });
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
