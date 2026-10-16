import { describe, expect, it } from "vitest";
import { getStats, startTyping, typeKey } from "./typing";

describe("typing", () => {
  it("advances one character for each correct key", () => {
    let session = startTyping("ab cd");

    session = typeKey(session, "a", 0);
    session = typeKey(session, "b", 100);

    expect(session.position).toBe(2);
  });

  it("treats a wrong key as a Typo that blocks until the correct key", () => {
    let session = startTyping("ab");

    session = typeKey(session, "x", 0);

    expect(session.position).toBe(0);
    expect(session.inError).toBe(true);
    expect(session.typos).toBe(1);

    session = typeKey(session, "y", 50);
    session = typeKey(session, "a", 100);

    expect(session.position).toBe(1);
    expect(session.inError).toBe(false);
    expect(session.typos).toBe(2);
  });

  it("counts the Typos in a row, until the correct key", () => {
    let session = startTyping("ab");
    expect(session.typosInARow).toBe(0);

    session = typeKey(session, "x", 0);
    session = typeKey(session, "y", 50);
    session = typeKey(session, "z", 100);
    expect(session.typosInARow).toBe(3);

    session = typeKey(session, "a", 150);
    expect(session.typosInARow).toBe(0);
    expect(session.typos).toBe(3);

    session = typeKey(session, "x", 200);
    expect(session.typosInARow).toBe(1);
  });

  it("ignores keys that are not a single character", () => {
    let session = startTyping("Ab");

    for (const key of ["Shift", "Backspace", "Escape", "Tab", "Enter"]) {
      session = typeKey(session, key, 0);
    }

    expect(session).toEqual(startTyping("Ab"));
  });

  it("finishes after the last character and ignores keys from then on", () => {
    let session = startTyping("ab");

    session = typeKey(session, "a", 0);
    expect(session.finished).toBe(false);

    session = typeKey(session, "b", 100);
    expect(session.finished).toBe(true);

    const finished = session;
    session = typeKey(session, "x", 200);

    expect(session).toBe(finished);
  });

  it("reports time, WPM, Accuracy and Typos for a finished text", () => {
    // 5 correct characters (= 1 word) and 1 Typo, 12 s from first to last keystroke.
    const keys: [string, number][] = [
      ["x", 1_000],
      ["a", 2_000],
      ["b", 3_000],
      ["c", 4_000],
      ["d", 5_000],
      ["e", 13_000],
    ];
    let session = startTyping("abcde");
    for (const [key, atMs] of keys) {
      session = typeKey(session, key, atMs);
    }

    const stats = getStats(session);

    expect(stats.timeMs).toBe(12_000);
    expect(stats.wpm).toBe(5);
    expect(stats.accuracy).toBeCloseTo(5 / 6);
    expect(stats.typos).toBe(1);
    expect(stats.characters).toBe(5);
    expect(stats.keystrokes).toBe(6);
  });

  it("reports empty stats before the first keystroke", () => {
    expect(getStats(startTyping("abc"))).toEqual({
      timeMs: 0,
      wpm: 0,
      accuracy: 1,
      typos: 0,
      characters: 0,
      keystrokes: 0,
    });
  });
});
