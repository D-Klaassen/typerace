import { describe, expect, it } from "vitest";
import { generateGibberish } from "./gibberish";
import { resolveKeySet } from "./key-sets";

const SEEDS = [1, 2, 3, 42, 1234, 99999];
const LETTERS = { keys: "abcdefghijklmnopqrstuvwxyz", capitals: false };

describe("generateGibberish", () => {
  it("produces the same text for the same seed", () => {
    const options = { seed: 42, keySet: LETTERS, minLength: 100 };

    expect(generateGibberish(options)).toBe(generateGibberish(options));
  });

  it("produces different text for different seeds", () => {
    const a = generateGibberish({ seed: 1, keySet: LETTERS, minLength: 100 });
    const b = generateGibberish({ seed: 2, keySet: LETTERS, minLength: 100 });

    expect(a).not.toBe(b);
  });

  it("builds words of 2-7 characters separated by single spaces", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({ seed, keySet: LETTERS, minLength: 200 });

      expect(text).toMatch(/^\S{2,7}( \S{2,7})*$/);
    }
  });

  it("stops at the first word boundary at or after the minimum length", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({ seed, keySet: LETTERS, minLength: 150 });
      const withoutLastWord = text.slice(0, text.lastIndexOf(" "));

      expect(text.length).toBeGreaterThanOrEqual(150);
      expect(withoutLastWord.length).toBeLessThan(150);
    }
  });

  it("uses only the Key Set's keys", () => {
    for (const seed of SEEDS) {
      const text = generateGibberish({
        seed,
        keySet: { keys: "fj", capitals: false },
        minLength: 200,
      });

      expect(text).toMatch(/^[fj ]+$/);
    }
  });

  it("uses every key of the set", () => {
    const text = generateGibberish({
      seed: 5,
      keySet: { keys: "qazp;/", capitals: false },
      minLength: 500,
    });

    expect(new Set(text.replaceAll(" ", ""))).toEqual(new Set("qazp;/"));
  });

  it("starts some words with a capital when Capitals is on, never when off", () => {
    const withCapitals = generateGibberish({
      seed: 7,
      keySet: { ...LETTERS, capitals: true },
      minLength: 1000,
    });
    const without = generateGibberish({
      seed: 7,
      keySet: LETTERS,
      minLength: 1000,
    });

    expect(withCapitals.split(" ").some((word) => /^[A-Z]/.test(word))).toBe(
      true,
    );
    expect(withCapitals).toMatch(/^([A-Z]?[a-z]+ ?)+$/);
    expect(without).not.toMatch(/[A-Z]/);
  });

  it("mixes letters, digits, punctuation and capitals on Hard", () => {
    const text = generateGibberish({
      seed: 7,
      keySet: resolveKeySet({ preset: "classic-hard" }, false),
      minLength: 1000,
    });

    expect(text).toMatch(/[A-Z]/);
    expect(text).toMatch(/\d/);
    expect(text).toMatch(/[.,;'\-/]/);
  });
});
