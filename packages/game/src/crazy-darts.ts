import { generateGibberish } from "./gibberish";
import type { KeySet } from "./key-sets";
import { getStats, startTyping, typeKey, type TypingSession } from "./typing";

/**
 * Crazy Darts text is "endless" in practice: about 15 minutes of typing at
 * 70 WPM, generated from a seed by both the Room and the browser.
 */
export const CRAZY_DARTS_TEXT_LENGTH = 5_000;

export function crazyDartsText(seed: number, keySet: KeySet): string {
  return generateGibberish({
    seed,
    keySet,
    minLength: CRAZY_DARTS_TEXT_LENGTH,
  });
}

export interface DartsPlayer {
  readonly playerId: string;
  readonly session: TypingSession;
  readonly hp: number;
  /** Out of HP or left the Room; can't type any more. */
  readonly out: boolean;
}

export interface Dart {
  /** Sequence number within the Match, so two Darts are never confused. */
  readonly id: number;
  readonly from: string;
  readonly to: string;
  readonly damage: number;
  readonly atMs: number;
}

/** One Crazy Darts Match: words thrown as Darts until one Player has HP left. */
export interface CrazyDarts {
  readonly text: string;
  readonly dartDamagePerCharacter: number;
  readonly typoHp: number;
  readonly players: readonly DartsPlayer[];
  /** Every Dart thrown, oldest first. */
  readonly darts: readonly Dart[];
  /** Player ids in the order they went out. */
  readonly outOrder: readonly string[];
  /** The last Player with HP left; null while the Match is on. */
  readonly winner: string | null;
}

export function startCrazyDarts({
  players,
  text,
  startingHp,
  dartDamagePerCharacter,
  typoHp,
}: {
  players: readonly string[];
  text: string;
  startingHp: number;
  dartDamagePerCharacter: number;
  typoHp: number;
}): CrazyDarts {
  return {
    text,
    dartDamagePerCharacter,
    typoHp,
    players: players.map((playerId) => ({
      playerId,
      session: startTyping(text),
      hp: startingHp,
      out: false,
    })),
    darts: [],
    outOrder: [],
    winner: null,
  };
}

/**
 * A keystroke in Crazy Darts. `random` (0 ≤ n < 1) picks the target when
 * several opponents share the most HP.
 */
export function typeInDarts(
  match: CrazyDarts,
  playerId: string,
  key: string,
  atMs: number,
  random: () => number,
): CrazyDarts {
  const thrower = match.players.find((player) => player.playerId === playerId);
  if (!thrower || thrower.out || match.winner !== null) {
    return match;
  }

  const session = typeKey(thrower.session, key, atMs);
  if (session === thrower.session) {
    return match;
  }

  const isTypo = session.typos > thrower.session.typos;
  let next = updatePlayer(match, playerId, {
    session,
    hp: isTypo ? thrower.hp - match.typoHp : thrower.hp,
  });
  const wordLength = completedWordLength(session);
  if (wordLength > 0) {
    next = throwDart(next, playerId, wordLength, atMs, random);
  }

  return knockOut(next);
}

/** Players at zero HP go out; with one Player left, they win. */
function knockOut(match: CrazyDarts): CrazyDarts {
  const goingOut = match.players.filter(
    (player) => !player.out && player.hp <= 0,
  );
  if (goingOut.length === 0) {
    return match;
  }

  const players = match.players.map((player) =>
    !player.out && player.hp <= 0 ? { ...player, hp: 0, out: true } : player,
  );
  const remaining = players.filter((player) => !player.out);

  return {
    ...match,
    players,
    outOrder: [...match.outOrder, ...goingOut.map((player) => player.playerId)],
    winner: remaining.length === 1 ? remaining[0]!.playerId : null,
  };
}

/** Length of the word whose last character was just typed, else 0. */
function completedWordLength(session: TypingSession): number {
  const { text, position, inError } = session;
  const justTyped = position - 1;
  const endsWord =
    !inError &&
    justTyped >= 0 &&
    text[justTyped] !== " " &&
    (position === text.length || text[position] === " ");
  if (!endsWord) {
    return 0;
  }

  return justTyped - text.lastIndexOf(" ", justTyped);
}

function throwDart(
  match: CrazyDarts,
  from: string,
  wordLength: number,
  atMs: number,
  random: () => number,
): CrazyDarts {
  const opponents = match.players.filter(
    (player) => player.playerId !== from && !player.out,
  );
  const mostHp = Math.max(...opponents.map((player) => player.hp));
  const leaders = opponents.filter((player) => player.hp === mostHp);
  const target = leaders[Math.floor(random() * leaders.length)];
  if (!target) {
    return match;
  }

  const damage = wordLength * match.dartDamagePerCharacter;

  return {
    ...updatePlayer(match, target.playerId, { hp: target.hp - damage }),
    darts: [
      ...match.darts,
      { id: match.darts.length, from, to: target.playerId, damage, atMs },
    ],
  };
}

function updatePlayer(
  match: CrazyDarts,
  playerId: string,
  changes: Partial<DartsPlayer>,
): CrazyDarts {
  return {
    ...match,
    players: match.players.map((player) =>
      player.playerId === playerId ? { ...player, ...changes } : player,
    ),
  };
}

/** Leaving the Room puts a Player out. */
export function dropFromDarts(match: CrazyDarts, playerId: string): CrazyDarts {
  const player = match.players.find((p) => p.playerId === playerId);
  if (!player || player.out || match.winner !== null) {
    return match;
  }

  return knockOut(updatePlayer(match, playerId, { hp: 0 }));
}

export interface CrazyDartsResult {
  playerId: string;
  hp: number;
  /** Total damage of the Darts this Player threw. */
  damageDealt: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

/** The winner first, then everyone else in reverse order of going out. */
export function getCrazyDartsResults(match: CrazyDarts): CrazyDartsResult[] {
  const stillIn = match.players.filter((player) => !player.out);
  const out = [...match.outOrder]
    .reverse()
    .map((id) => match.players.find((player) => player.playerId === id)!);

  return [...stillIn, ...out].map((player) => {
    const stats = getStats(player.session);

    return {
      playerId: player.playerId,
      hp: player.hp,
      damageDealt: match.darts
        .filter((dart) => dart.from === player.playerId)
        .reduce((total, dart) => total + dart.damage, 0),
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      typos: stats.typos,
    };
  });
}
