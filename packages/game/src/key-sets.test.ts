import { describe, expect, it } from "vitest";
import {
  KEY_SET_PRESETS,
  LESSONS,
  resolveKeySet,
  TYPABLE_KEYS,
} from "./key-sets";

describe("Key Set presets", () => {
  it("has the 76-lesson ladder in eight stages", () => {
    expect(LESSONS).toHaveLength(76);
    expect(new Set(LESSONS.map((lesson) => lesson.stage))).toEqual(
      new Set([1, 2, 3, 4, 5, 6, 7, 8]),
    );
    expect(LESSONS[0]).toMatchObject({ number: 1, stage: 1, keys: "fj" });
    expect(LESSONS[13]).toMatchObject({ number: 14, stage: 2, keys: "qp" });
    expect(LESSONS[66]?.keys).toBe("1234567890");
  });

  it("only uses typable keys, at least two per preset", () => {
    for (const preset of KEY_SET_PRESETS) {
      expect(preset.keys.length, preset.id).toBeGreaterThanOrEqual(2);
      for (const key of preset.keys) {
        expect(TYPABLE_KEYS, `${preset.id}: ${key}`).toContain(key);
      }
    }
  });

  it("gives every preset a unique id", () => {
    const ids = KEY_SET_PRESETS.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("resolveKeySet", () => {
  it("turns a preset into its keys, with Capitals as chosen", () => {
    expect(resolveKeySet({ preset: "classic-easy" }, false)).toEqual({
      keys: "asdfghjkl;",
      capitals: false,
    });
    expect(resolveKeySet({ preset: "row-top" }, true)).toEqual({
      keys: "qwertyuiop",
      capitals: true,
    });
  });

  it("always uses Capitals for the Hard preset", () => {
    expect(resolveKeySet({ preset: "classic-hard" }, false).capitals).toBe(
      true,
    );
  });

  it("cleans up a custom set: known keys only, each once, in keyboard order", () => {
    expect(resolveKeySet({ custom: "jfAj!f" }, false)).toEqual({
      keys: "fj",
      capitals: false,
    });
  });

  it("falls back to all letters for an unknown preset or a too small custom set", () => {
    const allLetters = resolveKeySet({ preset: "classic-medium" }, false);

    expect(resolveKeySet({ preset: "nope" }, false)).toEqual(allLetters);
    expect(resolveKeySet({ custom: "f" }, false)).toEqual(allLetters);
  });
});
