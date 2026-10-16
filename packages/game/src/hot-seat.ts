import type { TypingStats } from "./typing";

export interface HotSeatPlayer {
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

export interface HotSeat {
  readonly players: readonly HotSeatPlayer[];
  /** Nickname of the Player whose Turn it is; null once the Hot Seat Match is over. */
  readonly currentPlayer: string | null;
  /** The last Player left; null while the Hot Seat Match is running. */
  readonly winner: string | null;
  readonly turnsTaken: number;
  /** Nicknames in the order they were eliminated. */
  readonly eliminated: readonly string[];
}

export interface HotSeatOptions {
  /** Nicknames in Turn order for the opening round. */
  players: readonly string[];
  timeBankMs: number;
}

export interface HotSeatResult {
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

export function startHotSeat({ players, timeBankMs }: HotSeatOptions): HotSeat {
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
export function completeTurn(seat: HotSeat, stats: TypingStats): HotSeat {
  const current = currentPlayerOf(seat);
  if (!current) {
    return seat;
  }
  if (stats.timeMs >= current.timeBankMs) {
    return runOutOfTime(seat, stats);
  }

  const isNewBest =
    current.bestTimeMs === null || stats.timeMs < current.bestTimeMs;

  return afterTurn(seat, {
    ...recordTurn(current, stats),
    timeBankMs: current.timeBankMs - stats.timeMs,
    ...(isNewBest && {
      bestTimeMs: stats.timeMs,
      bestSetOnTurn: seat.turnsTaken,
    }),
  });
}

/** The current Player's Time Bank hit zero before they finished their text. */
export function runOutOfTime(seat: HotSeat, stats: TypingStats): HotSeat {
  const current = currentPlayerOf(seat);
  if (!current) {
    return seat;
  }

  return afterTurn(seat, {
    ...recordTurn(current, stats),
    timeBankMs: 0,
    eliminated: true,
  });
}

/** Takes a Player out without a Turn, e.g. because they left. */
export function eliminatePlayer(seat: HotSeat, name: string): HotSeat {
  const player = seat.players.find((p) => p.name === name);
  if (!player || player.eliminated || seat.winner !== null) {
    return seat;
  }

  return settle(seat, { ...player, timeBankMs: 0, eliminated: true }, false);
}

/** Ranking: the winner first, then everyone else in reverse order of elimination. */
export function getHotSeatResults(seat: HotSeat): HotSeatResult[] {
  const ranked = [
    ...seat.players.filter((player) => !player.eliminated),
    ...[...seat.eliminated]
      .reverse()
      .map((name) => seat.players.find((player) => player.name === name)!),
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

function currentPlayerOf(seat: HotSeat): HotSeatPlayer | undefined {
  return seat.players.find((player) => player.name === seat.currentPlayer);
}

function recordTurn(player: HotSeatPlayer, stats: TypingStats): HotSeatPlayer {
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

function afterTurn(seat: HotSeat, updated: HotSeatPlayer): HotSeat {
  return settle(seat, updated, true);
}

/** Applies a changed Player and decides who goes next, or who won. */
function settle(
  seat: HotSeat,
  updated: HotSeatPlayer,
  tookTurn: boolean,
): HotSeat {
  const players = seat.players.map((player) =>
    player.name === updated.name ? updated : player,
  );
  const eliminated = updated.eliminated
    ? [...seat.eliminated, updated.name]
    : seat.eliminated;
  const remaining = players.filter((player) => !player.eliminated);
  const winner = remaining.length === 1 ? remaining[0]!.name : null;

  return {
    players,
    eliminated,
    winner,
    turnsTaken: seat.turnsTaken + (tookTurn ? 1 : 0),
    currentPlayer: winner === null ? nextPlayer(remaining) : null,
  };
}

function nextPlayer(remaining: readonly HotSeatPlayer[]): string | null {
  const waitingForOpeningTurn = remaining.find(
    (player) => player.bestTimeMs === null,
  );
  if (waitingForOpeningTurn) {
    return waitingForOpeningTurn.name;
  }

  return slowest(remaining)?.name ?? null;
}

function slowest(players: readonly HotSeatPlayer[]): HotSeatPlayer | undefined {
  return players.reduce<HotSeatPlayer | undefined>((slowestSoFar, player) => {
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
