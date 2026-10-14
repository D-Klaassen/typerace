import { describe, expect, it } from "vitest";
import { generateGibberish } from "./gibberish";

const SEEDS = [1, 2, 3, 42, 1234, 99999];

describe("generateGibberish", () => {
  it("produces the same text for the same seed", () => {
    const options = { seed: 42, difficulty: "medium", minLength: 100 } as const;

    expect(generateGibberish(options)).toBe(generateGibberish(options));
  });

  it("produces different text for different seeds", () => {
    const a = generateGibberish({
      seed: 1,
      difficulty: "medium",
      minLength: 100,
    });
    const b = generateGibberish({
      seed: 2,
      difficulty: "medium",
      minLength: 100,
    });

    expect(a).not.toBe(b);
  });

  it("builds words of 2-7 characters separated by single spaces", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({
        seed,
        difficulty: "medium",
        minLength: 200,
      });

      expect(text).toMatch(/^\S{2,7}( \S{2,7})*$/);
    }
  });

  it("stops at the first word boundary at or after the minimum length", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({
        seed,
        difficulty: "medium",
        minLength: 150,
      });
      const withoutLastWord = text.slice(0, text.lastIndexOf(" "));

      expect(text.length).toBeGreaterThanOrEqual(150);
      expect(withoutLastWord.length).toBeLessThan(150);
    }
  });

  it("uses only home-row keys on Easy", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({
        seed,
        difficulty: "easy",
        minLength: 200,
      });

      expect(text).toMatch(/^[asdfghjkl; ]+$/);
    }
  });

  it("uses only lowercase letters on Medium", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({
        seed,
        difficulty: "medium",
        minLength: 200,
      });

      expect(text).toMatch(/^[a-z ]+$/);
    }
  });

  it("mixes in capitalised words, numbers and trailing punctuation on Hard", () => {
    const text = generateGibberish({
      seed: 7,
      difficulty: "hard",
      minLength: 1000,
    });
    const words = text.split(" ");

    for (const word of words) {
      expect(word).toMatch(/^([A-Za-z][a-z]*[.,;:!?'-]?|\d{2,4})$/);
      expect(word.length).toBeGreaterThanOrEqual(2);
      expect(word.length).toBeLessThanOrEqual(7);
    }
    expect(words.some((word) => /^[A-Z]/.test(word))).toBe(true);
    expect(words.some((word) => /^\d+$/.test(word))).toBe(true);
    expect(words.some((word) => /[.,;:!?'-]$/.test(word))).toBe(true);
  });
});
