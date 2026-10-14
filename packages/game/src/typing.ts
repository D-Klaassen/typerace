export interface TypingSession {
  readonly text: string;
  /** Number of correctly typed characters; the next expected one is `text[position]`. */
  readonly position: number;
  /** True after a Typo, until the expected key is pressed. */
  readonly inError: boolean;
  readonly typos: number;
  /** True once every character has been typed; later keys are ignored. */
  readonly finished: boolean;
  /** All counted keystrokes, correct ones and Typos. */
  readonly keystrokes: number;
  readonly firstKeyAtMs: number | null;
  readonly lastCorrectAtMs: number | null;
}

export interface TypingStats {
  /** From the first keystroke until the last correctly typed character. */
  timeMs: number;
  /** Correct characters ÷ 5, per minute. */
  wpm: number;
  /** Correct keystrokes ÷ all keystrokes; 1 before any keystroke. */
  accuracy: number;
  typos: number;
}

const CHARACTERS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

export function startTyping(text: string): TypingSession {
  return {
    text,
    position: 0,
    inError: false,
    typos: 0,
    finished: false,
    keystrokes: 0,
    firstKeyAtMs: null,
    lastCorrectAtMs: null,
  };
}

export function typeKey(
  session: TypingSession,
  key: string,
  atMs: number,
): TypingSession {
  // KeyboardEvent.key names like "Shift" or "Backspace" are not keystrokes.
  if (session.finished || key.length !== 1) {
    return session;
  }

  const counted = {
    ...session,
    keystrokes: session.keystrokes + 1,
    firstKeyAtMs: session.firstKeyAtMs ?? atMs,
  };

  if (key !== session.text[session.position]) {
    return { ...counted, inError: true, typos: session.typos + 1 };
  }

  const position = session.position + 1;

  return {
    ...counted,
    position,
    inError: false,
    finished: position === session.text.length,
    lastCorrectAtMs: atMs,
  };
}

export function getStats(session: TypingSession): TypingStats {
  const { firstKeyAtMs, lastCorrectAtMs, keystrokes, position, typos } =
    session;
  const timeMs =
    firstKeyAtMs === null || lastCorrectAtMs === null
      ? 0
      : lastCorrectAtMs - firstKeyAtMs;

  return {
    timeMs,
    wpm:
      timeMs === 0
        ? 0
        : position / CHARACTERS_PER_WORD / (timeMs / MS_PER_MINUTE),
    accuracy: keystrokes === 0 ? 1 : position / keystrokes,
    typos,
  };
}
