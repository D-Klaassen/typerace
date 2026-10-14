import { generateGibberish, type Difficulty } from "./gibberish";
import {
  completeTurn,
  eliminatePlayer,
  runOutOfTime,
  startTimeTrial,
  type TimeTrial,
} from "./time-trial";
import { getStats, startTyping, typeKey, type TypingSession } from "./typing";

/** Characters of Gibberish per Time Trial Turn (see docs/spec.md). */
export const TIME_TRIAL_TURN_LENGTH = 150;

/**
 * A Time Trial played Online: the Player whose Turn it is types on their own
 * device while the others watch. Players are identified by id.
 */
export interface OnlineTimeTrial {
  readonly trial: TimeTrial;
  readonly difficulty: Difficulty;
  readonly seed: number;
  /** The current Turn's typing; null once there is a winner. */
  readonly turn: TypingSession | null;
}

export function startOnlineTimeTrial({
  players,
  timeBankMs,
  difficulty,
  seed,
}: {
  players: readonly string[];
  timeBankMs: number;
  difficulty: Difficulty;
  seed: number;
}): OnlineTimeTrial {
  return withTurn({
    trial: startTimeTrial({ players, timeBankMs }),
    difficulty,
    seed,
    turn: null,
  });
}

export function typeInTimeTrial(
  match: OnlineTimeTrial,
  playerId: string,
  key: string,
  atMs: number,
): OnlineTimeTrial {
  if (!match.turn || playerId !== match.trial.currentPlayer) {
    return match;
  }

  const turn = typeKey(match.turn, key, atMs);
  if (turn === match.turn) {
    return match;
  }
  if (!turn.finished) {
    return { ...match, turn };
  }

  return withTurn({
    ...match,
    trial: completeTurn(match.trial, getStats(turn)),
  });
}

/** Eliminates the current Player once their Time Bank has run dry. */
export function advanceTimeTrial(
  match: OnlineTimeTrial,
  nowMs: number,
): OnlineTimeTrial {
  const startedAt = match.turn?.firstKeyAtMs ?? null;
  const bankMs = currentTimeBankMs(match);
  if (!match.turn || startedAt === null || bankMs === null) {
    return match;
  }
  if (nowMs - startedAt < bankMs) {
    return match;
  }

  return withTurn({
    ...match,
    trial: runOutOfTime(match.trial, {
      ...getStats(match.turn),
      timeMs: bankMs,
    }),
  });
}

/** Leaving the Room eliminates a Player, whether it's their Turn or not. */
export function dropFromTimeTrial(
  match: OnlineTimeTrial,
  playerId: string,
): OnlineTimeTrial {
  const wasCurrent = playerId === match.trial.currentPlayer;
  const trial = eliminatePlayer(match.trial, playerId);
  if (trial === match.trial) {
    return match;
  }

  return wasCurrent ? withTurn({ ...match, trial }) : { ...match, trial };
}

/** What was left of the current Player's Time Bank when their Turn began. */
export function currentTimeBankMs(match: OnlineTimeTrial): number | null {
  const current = match.trial.players.find(
    (player) => player.name === match.trial.currentPlayer,
  );

  return current?.timeBankMs ?? null;
}

/** Sets up fresh Gibberish for whoever goes next, or nothing once there's a winner. */
function withTurn(match: OnlineTimeTrial): OnlineTimeTrial {
  if (match.trial.currentPlayer === null) {
    return { ...match, turn: null };
  }

  return {
    ...match,
    turn: startTyping(
      generateGibberish({
        // An elimination without a Turn (someone left) still needs new text.
        seed:
          match.seed +
          match.trial.turnsTaken +
          match.trial.eliminated.length * 1_000,
        difficulty: match.difficulty,
        minLength: TIME_TRIAL_TURN_LENGTH,
      }),
    ),
  };
}
