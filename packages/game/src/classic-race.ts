import type { TypingStats } from "./typing";

export interface ClassicRace {
  /** Nicknames in Turn order. */
  readonly players: readonly string[];
  /** Stats of each finished Turn, in Turn order. */
  readonly turns: readonly TypingStats[];
  /** Nickname of the Player whose Turn it is; null once everyone has raced. */
  readonly currentPlayer: string | null;
  readonly finished: boolean;
}

export function startClassicRace({
  players,
}: {
  players: readonly string[];
}): ClassicRace {
  return {
    players,
    turns: [],
    currentPlayer: players[0] ?? null,
    finished: players.length === 0,
  };
}

/** The current Player typed their whole text on a Shared Keyboard. */
export function finishRaceTurn(
  race: ClassicRace,
  stats: TypingStats,
): ClassicRace {
  if (race.finished) {
    return race;
  }

  const turns = [...race.turns, stats];

  return {
    ...race,
    turns,
    currentPlayer: race.players[turns.length] ?? null,
    finished: turns.length === race.players.length,
  };
}

export interface ClassicRaceResult {
  name: string;
  timeMs: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

/** Fastest Time first; ties go to the higher Accuracy, then to who went first. */
export function getClassicRaceResults(race: ClassicRace): ClassicRaceResult[] {
  return race.turns
    .map((stats, order) => ({ name: race.players[order]!, order, stats }))
    .sort(
      (a, b) =>
        a.stats.timeMs - b.stats.timeMs ||
        b.stats.accuracy - a.stats.accuracy ||
        a.order - b.order,
    )
    .map(({ name, stats }) => ({
      name,
      timeMs: stats.timeMs,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      typos: stats.typos,
    }));
}
