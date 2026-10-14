"use client";

import {
  getStats,
  startTyping,
  typeKey,
  type TypingSession,
  type TypingStats,
} from "@typerace/game";
import { useEffect, useEffectEvent, useRef, useState } from "react";

/**
 * Feeds the window's keystrokes into a typing session for `text`.
 * Mount a fresh component (e.g. with a `key`) for every new text.
 */
export function useTyping(
  text: string,
  onFinish: (stats: TypingStats) => void,
  /** Called for every counted keystroke, correct or a Typo. */
  onKey?: (key: string) => void,
): { session: TypingSession; sessionRef: { readonly current: TypingSession } } {
  const [session, setSession] = useState(() => startTyping(text));
  const sessionRef = useRef(session);

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key.length === 1) {
      // Keep Space from scrolling and ' or / from opening quick find.
      event.preventDefault();
    }

    const before = sessionRef.current;
    const next = typeKey(before, event.key, performance.now());
    if (next === before) {
      return;
    }

    sessionRef.current = next;
    setSession(next);
    onKey?.(event.key);
    if (next.finished) {
      onFinish(getStats(next));
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { session, sessionRef };
}
