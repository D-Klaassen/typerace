import { generateText, type TextSource } from "./text-source";
import {
  completeTurn,
  eliminatePlayer,
  runOutOfTime,
  startHotSeat,
  type HotSeat,
} from "./hot-seat";
import { getStats, startTyping, typeKey, type TypingSession } from "./typing";

/** Characters per Hot Seat Turn (see docs/spec.md). */
export const HOT_SEAT_TURN_LENGTH = 100;

/**
 * A Hot Seat played Online: the Player whose Turn it is types on their own
 * device while the others watch. Players are identified by id.
 */
export interface OnlineHotSeat {
  readonly seat: HotSeat;
  readonly textSource: TextSource;
  readonly seed: number;
  /** The current Turn's typing; null once there is a winner. */
  readonly turn: TypingSession | null;
}

export function startOnlineHotSeat({
  players,
  timeBankMs,
  textSource,
  seed,
}: {
  players: readonly string[];
  timeBankMs: number;
  textSource: TextSource;
  seed: number;
}): OnlineHotSeat {
  return withTurn({
    seat: startHotSeat({ players, timeBankMs }),
    textSource,
    seed,
    turn: null,
  });
}

export function typeInHotSeat(
  match: OnlineHotSeat,
  playerId: string,
  key: string,
  atMs: number,
): OnlineHotSeat {
  if (!match.turn || playerId !== match.seat.currentPlayer) {
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
    seat: completeTurn(match.seat, getStats(turn)),
  });
}

/** Eliminates the current Player once their Time Bank has run dry. */
export function advanceHotSeat(
  match: OnlineHotSeat,
  nowMs: number,
): OnlineHotSeat {
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
    seat: runOutOfTime(match.seat, {
      ...getStats(match.turn),
      timeMs: bankMs,
    }),
  });
}

/** Leaving the Room eliminates a Player, whether it's their Turn or not. */
export function dropFromHotSeat(
  match: OnlineHotSeat,
  playerId: string,
): OnlineHotSeat {
  const wasCurrent = playerId === match.seat.currentPlayer;
  const seat = eliminatePlayer(match.seat, playerId);
  if (seat === match.seat) {
    return match;
  }

  return wasCurrent ? withTurn({ ...match, seat }) : { ...match, seat };
}

/** What was left of the current Player's Time Bank when their Turn began. */
export function currentTimeBankMs(match: OnlineHotSeat): number | null {
  const current = match.seat.players.find(
    (player) => player.name === match.seat.currentPlayer,
  );

  return current?.timeBankMs ?? null;
}

/** Sets up fresh text for whoever goes next, or nothing once there's a winner. */
function withTurn(match: OnlineHotSeat): OnlineHotSeat {
  if (match.seat.currentPlayer === null) {
    return { ...match, turn: null };
  }

  return {
    ...match,
    turn: startTyping(
      generateText(match.textSource, {
        // An elimination without a Turn (someone left) still needs new text.
        seed:
          match.seed +
          match.seat.turnsTaken +
          match.seat.eliminated.length * 1_000,
        minLength: HOT_SEAT_TURN_LENGTH,
      }),
    ),
  };
}
