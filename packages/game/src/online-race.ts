import { startTyping, typeKey, type TypingSession } from "./typing";

/** How long the others get after the first Player finishes (see docs/spec.md). */
export const RACE_GRACE_MS = 60_000;

export interface RaceEntry {
  readonly playerId: string;
  readonly session: TypingSession;
  /** Left the Room mid-race; their progress is frozen. */
  readonly dropped: boolean;
}

/** One Online Classic Race: everyone types the same text at once. */
export interface OnlineRace {
  readonly text: string;
  /** When the Room gave the start signal, on the Room's clock. */
  readonly startedAtMs: number;
  readonly entries: readonly RaceEntry[];
}

export function startOnlineRace({
  players,
  text,
  startedAtMs,
}: {
  players: readonly string[];
  text: string;
  startedAtMs: number;
}): OnlineRace {
  return {
    text,
    startedAtMs,
    entries: players.map((playerId) => ({
      playerId,
      session: startTyping(text),
      dropped: false,
    })),
  };
}

export function typeInRace(
  race: OnlineRace,
  playerId: string,
  key: string,
  atMs: number,
): OnlineRace {
  return {
    ...race,
    entries: race.entries.map((entry) =>
      entry.playerId === playerId && !entry.dropped
        ? { ...entry, session: typeKey(entry.session, key, atMs) }
        : entry,
    ),
  };
}

export function dropFromRace(race: OnlineRace, playerId: string): OnlineRace {
  return {
    ...race,
    entries: race.entries.map((entry) =>
      entry.playerId === playerId ? { ...entry, dropped: true } : entry,
    ),
  };
}

/** Everyone finished or dropped out, or the grace period after the first finish has passed. */
export function isRaceOver(race: OnlineRace, nowMs: number): boolean {
  if (race.entries.every((entry) => entry.session.finished || entry.dropped)) {
    return true;
  }

  const firstFinish = firstFinishAtMs(race);

  return firstFinish !== null && nowMs >= firstFinish + RACE_GRACE_MS;
}

/** When the first Player finished, or null while nobody has. */
export function firstFinishAtMs(race: OnlineRace): number | null {
  const finishes = race.entries
    .filter((entry) => entry.session.finished)
    .map((entry) => entry.session.lastCorrectAtMs!);

  return finishes.length === 0 ? null : Math.min(...finishes);
}

export interface OnlineRaceResult {
  playerId: string;
  finished: boolean;
  /** From the start signal to the last character; null if unfinished. */
  timeMs: number | null;
  /** Share of the text typed, 0–1. */
  progress: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

const CHARACTERS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

/**
 * Finishers by Time, then everyone else by progress. Ties go to the higher
 * Accuracy, then to the earlier Player in the Room.
 */
export function getOnlineRaceResults(race: OnlineRace): OnlineRaceResult[] {
  return race.entries
    .map((entry, order) => ({ order, result: resultOf(race, entry) }))
    .sort(
      (a, b) =>
        Number(b.result.finished) - Number(a.result.finished) ||
        (a.result.timeMs ?? 0) - (b.result.timeMs ?? 0) ||
        b.result.progress - a.result.progress ||
        b.result.accuracy - a.result.accuracy ||
        a.order - b.order,
    )
    .map(({ result }) => result);
}

function resultOf(race: OnlineRace, entry: RaceEntry): OnlineRaceResult {
  const { session } = entry;
  const typingMs =
    session.lastCorrectAtMs === null
      ? 0
      : session.lastCorrectAtMs - race.startedAtMs;

  return {
    playerId: entry.playerId,
    finished: session.finished,
    timeMs: session.finished ? typingMs : null,
    progress: race.text.length === 0 ? 0 : session.position / race.text.length,
    wpm:
      typingMs <= 0
        ? 0
        : session.position / CHARACTERS_PER_WORD / (typingMs / MS_PER_MINUTE),
    accuracy:
      session.keystrokes === 0 ? 1 : session.position / session.keystrokes,
    typos: session.typos,
  };
}
