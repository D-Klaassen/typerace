import { describe, expect, it } from "vitest";
import { getKeyGuide } from "./finger-guide";
import {
  generateText,
  LANGUAGES,
  resolveTextSource,
  type TextSource,
} from "./text-source";
import { DUTCH_SENTENCES, DUTCH_WORDS } from "./texts/dutch";
import { ENGLISH_SENTENCES, ENGLISH_WORDS } from "./texts/english";

const SEEDS = [1, 2, 3, 42, 1234, 99999];
const REAL_SOURCES: TextSource[] = LANGUAGES.flatMap((language) => [
  { kind: "words", language },
  { kind: "sentences", language },
]);

describe("resolveTextSource", () => {
  const choice = {
    language: "nl",
    keySet: { preset: "row-home" },
    capitals: true,
  } as const;

  it("uses the Key Set for Gibberish", () => {
    expect(resolveTextSource({ ...choice, textSource: "gibberish" })).toEqual({
      kind: "gibberish",
      keySet: { keys: "asdfghjkl;", capitals: true },
    });
  });

  it("uses the Language, not the Key Set, for Words and Sentences", () => {
    expect(resolveTextSource({ ...choice, textSource: "words" })).toEqual({
      kind: "words",
      language: "nl",
    });
    expect(resolveTextSource({ ...choice, textSource: "sentences" })).toEqual({
      kind: "sentences",
      language: "nl",
    });
  });
});

describe("generateText", () => {
  it("produces the same text for the same seed, and other text for others", () => {
    for (const source of REAL_SOURCES) {
      const a = generateText(source, { seed: 1, minLength: 100 });

      expect(generateText(source, { seed: 1, minLength: 100 })).toBe(a);
      expect(generateText(source, { seed: 2, minLength: 100 })).not.toBe(a);
    }
  });

  it("strings whole words and sentences together with single spaces", () => {
    for (const seed of SEEDS) {
      const en = generateText(
        { kind: "words", language: "en" },
        { seed, minLength: 150 },
      );
      for (const word of en.split(" ")) {
        expect(ENGLISH_WORDS).toContain(word);
      }

      const nl = generateText(
        { kind: "sentences", language: "nl" },
        { seed, minLength: 150 },
      );
      expect(nl).not.toMatch(/ {2}/);
      expect(
        nl.split(/(?<=[.?!]) /).every((s) => DUTCH_SENTENCES.includes(s)),
      ).toBe(true);
    }
  });

  it("stops at the first boundary at or after the minimum length", () => {
    for (const source of REAL_SOURCES) {
      for (const seed of SEEDS) {
        const text = generateText(source, { seed, minLength: 50 });
        const separator = source.kind === "words" ? " " : /(?<=[.?!]) /;
        const pieces = text.split(separator);

        expect(text.length).toBeGreaterThanOrEqual(50);
        expect(pieces.slice(0, -1).join(" ").length).toBeLessThan(50);
      }
    }
  });

  it("never repeats a word or sentence right after itself", () => {
    for (const seed of SEEDS) {
      const words = generateText(
        { kind: "words", language: "en" },
        { seed, minLength: 2_000 },
      ).split(" ");

      expect(words.some((word, i) => word === words[i - 1])).toBe(false);
    }
  });

  it("generates Gibberish from the Key Set", () => {
    const text = generateText(
      { kind: "gibberish", keySet: { keys: "fj", capitals: false } },
      { seed: 1, minLength: 50 },
    );

    expect(text).toMatch(/^[fj ]+$/);
  });
});

describe("word and sentence lists", () => {
  const all = [
    ...ENGLISH_WORDS,
    ...ENGLISH_SENTENCES,
    ...DUTCH_WORDS,
    ...DUTCH_SENTENCES,
  ];

  it("only use characters on the keyboard, so every key has a guide", () => {
    for (const text of all) {
      for (const char of text) {
        expect(getKeyGuide(char), `${char} in "${text}"`).not.toBeNull();
      }
    }
  });

  it("have no duplicates and no stray spaces", () => {
    for (const list of [
      ENGLISH_WORDS,
      ENGLISH_SENTENCES,
      DUTCH_WORDS,
      DUTCH_SENTENCES,
    ]) {
      expect(new Set(list).size).toBe(list.length);
    }
    for (const text of all) {
      expect(text).toBe(text.trim());
      expect(text).not.toMatch(/ {2}/);
    }
  });

  it("keep words lowercase and single", () => {
    for (const word of [...ENGLISH_WORDS, ...DUTCH_WORDS]) {
      expect(word).toMatch(/^[a-z]+$/);
    }
  });
});
