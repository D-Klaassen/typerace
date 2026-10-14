import type { TypingStats } from "./typing";

export interface TimeTrialPlayer {
  readonly name: string;
  /** What is left of this Player's Time Bank. */
  readonly timeBankMs: number;
  /** Fastest completed Turn so far; null before their first. */
  readonly bestTimeMs: number | null;
  /** The Turn number on which `bestTimeMs` was set, to break ties. */
  readonly bestSetOnTurn: number;
  readonly eliminated: boolean;
  readonly turns: number;
  /** Typing totals over all of this Player's Turns, including unfinished ones. */
  readonly totals: TurnTotals;
}

interface TurnTotals {
  readonly timeMs: number;
  readonly characters: number;
  readonly keystrokes: number;
  readonly typos: number;
}

export interface TimeTrial {
  readonly players: readonly TimeTrialPlayer[];
  /** Nickname of the Player whose Turn it is; null once the Time Trial is over. */
  readonly currentPlayer: string | null;
  /** The last Player left; null while the Time Trial is running. */
  readonly winner: string | null;
  readonly turnsTaken: number;
  /** Nicknames in the order they were eliminated. */
  readonly eliminated: readonly string[];
}

export interface TimeTrialOptions {
  /** Nicknames in Turn order for the opening round. */
  players: readonly string[];
  timeBankMs: number;
}

export interface TimeTrialResult {
  name: string;
  bestTimeMs: number | null;
  turns: number;
  timeMs: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

const CHARACTERS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

export function startTimeTrial({
  players,
  timeBankMs,
}: TimeTrialOptions): TimeTrial {
  return {
    players: players.map((name) => ({
      name,
      timeBankMs,
      bestTimeMs: null,
      bestSetOnTurn: -1,
      eliminated: false,
      turns: 0,
      totals: { timeMs: 0, characters: 0, keystrokes: 0, typos: 0 },
    })),
    currentPlayer: players[0] ?? null,
    winner: null,
    turnsTaken: 0,
    eliminated: [],
  };
}

/** The current Player typed their whole text. */
export function completeTurn(trial: TimeTrial, stats: TypingStats): TimeTrial {
  const current = currentPlayerOf(trial);
  if (!current) {
    return trial;
  }
  if (stats.timeMs >= current.timeBankMs) {
    return runOutOfTime(trial, stats);
  }

  const isNewBest =
    current.bestTimeMs === null || stats.timeMs < current.bestTimeMs;

  return afterTurn(trial, {
    ...recordTurn(current, stats),
    timeBankMs: current.timeBankMs - stats.timeMs,
    ...(isNewBest && {
      bestTimeMs: stats.timeMs,
      bestSetOnTurn: trial.turnsTaken,
    }),
  });
}

/** The current Player's Time Bank hit zero before they finished their text. */
export function runOutOfTime(trial: TimeTrial, stats: TypingStats): TimeTrial {
  const current = currentPlayerOf(trial);
  if (!current) {
    return trial;
  }

  return afterTurn(trial, {
    ...recordTurn(current, stats),
    timeBankMs: 0,
    eliminated: true,
  });
}

/** Takes a Player out without a Turn, e.g. because they left. */
export function eliminatePlayer(trial: TimeTrial, name: string): TimeTrial {
  const player = trial.players.find((p) => p.name === name);
  if (!player || player.eliminated || trial.winner !== null) {
    return trial;
  }

  return settle(trial, { ...player, timeBankMs: 0, eliminated: true }, false);
}

/** Ranking: the winner first, then everyone else in reverse order of elimination. */
export function getTimeTrialResults(trial: TimeTrial): TimeTrialResult[] {
  const ranked = [
    ...trial.players.filter((player) => !player.eliminated),
    ...[...trial.eliminated]
      .reverse()
      .map((name) => trial.players.find((player) => player.name === name)!),
  ];

  return ranked.map(({ name, bestTimeMs, turns, totals }) => ({
    name,
    bestTimeMs,
    turns,
    timeMs: totals.timeMs,
    wpm:
      totals.timeMs === 0
        ? 0
        : totals.characters /
          CHARACTERS_PER_WORD /
          (totals.timeMs / MS_PER_MINUTE),
    accuracy:
      totals.keystrokes === 0 ? 1 : totals.characters / totals.keystrokes,
    typos: totals.typos,
  }));
}

function currentPlayerOf(trial: TimeTrial): TimeTrialPlayer | undefined {
  return trial.players.find((player) => player.name === trial.currentPlayer);
}

function recordTurn(
  player: TimeTrialPlayer,
  stats: TypingStats,
): TimeTrialPlayer {
  return {
    ...player,
    turns: player.turns + 1,
    totals: {
      timeMs: player.totals.timeMs + stats.timeMs,
      characters: player.totals.characters + stats.characters,
      keystrokes: player.totals.keystrokes + stats.keystrokes,
      typos: player.totals.typos + stats.typos,
    },
  };
}

function afterTurn(trial: TimeTrial, updated: TimeTrialPlayer): TimeTrial {
  return settle(trial, updated, true);
}

/** Applies a changed Player and decides who goes next, or who won. */
function settle(
  trial: TimeTrial,
  updated: TimeTrialPlayer,
  tookTurn: boolean,
): TimeTrial {
  const players = trial.players.map((player) =>
    player.name === updated.name ? updated : player,
  );
  const eliminated = updated.eliminated
    ? [...trial.eliminated, updated.name]
    : trial.eliminated;
  const remaining = players.filter((player) => !player.eliminated);
  const winner = remaining.length === 1 ? remaining[0]!.name : null;

  return {
    players,
    eliminated,
    winner,
    turnsTaken: trial.turnsTaken + (tookTurn ? 1 : 0),
    currentPlayer: winner === null ? nextPlayer(remaining) : null,
  };
}

function nextPlayer(remaining: readonly TimeTrialPlayer[]): string | null {
  const waitingForOpeningTurn = remaining.find(
    (player) => player.bestTimeMs === null,
  );
  if (waitingForOpeningTurn) {
    return waitingForOpeningTurn.name;
  }

  return slowest(remaining)?.name ?? null;
}

function slowest(
  players: readonly TimeTrialPlayer[],
): TimeTrialPlayer | undefined {
  return players.reduce<TimeTrialPlayer | undefined>((slowestSoFar, player) => {
    if (!slowestSoFar) {
      return player;
    }

    const time = player.bestTimeMs ?? 0;
    const slowestTime = slowestSoFar.bestTimeMs ?? 0;
    const isSlower =
      time > slowestTime ||
      (time === slowestTime &&
        player.bestSetOnTurn > slowestSoFar.bestSetOnTurn);

    return isSlower ? player : slowestSoFar;
  }, undefined);
}
