import { describe, expect, it } from "vitest";
import { getKeyGuide } from "./finger-guide";
import { generateGibberish } from "./gibberish";

describe("getKeyGuide", () => {
  it("guides home-row letters to their own finger without Shift", () => {
    expect(getKeyGuide("f")).toEqual({
      key: "f",
      finger: "left-index",
      shift: null,
    });
    expect(getKeyGuide("k")).toEqual({
      key: "k",
      finger: "right-middle",
      shift: null,
    });
  });

  it.each([
    ["q", "left-pinky"],
    ["w", "left-ring"],
    ["e", "left-middle"],
    ["t", "left-index"],
    ["y", "right-index"],
    ["i", "right-middle"],
    ["o", "right-ring"],
    ["p", "right-pinky"],
    [" ", "thumbs"],
  ])("presses %j with the %s", (char, finger) => {
    expect(getKeyGuide(char)).toMatchObject({ key: char, finger, shift: null });
  });
});

describe("getKeyGuide with Shift", () => {
  it.each([
    ["A", "a", "left-pinky", "right-shift"],
    ["P", "p", "right-pinky", "left-shift"],
    ["!", "1", "left-pinky", "right-shift"],
    [":", ";", "right-pinky", "left-shift"],
    ["?", "/", "right-pinky", "left-shift"],
    ['"', "'", "right-pinky", "left-shift"],
  ])("types %j as %j with the %s and the %s", (char, key, finger, shift) => {
    expect(getKeyGuide(char)).toEqual({ key, finger, shift });
  });

  it("types a backslash without Shift", () => {
    expect(getKeyGuide("\\")).toEqual({
      key: "\\",
      finger: "right-pinky",
      shift: null,
    });
  });
});

describe("getKeyGuide coverage", () => {
  it("guides every character that Gibberish can produce", () => {
    const text = ["easy", "medium", "hard"]
      .map((difficulty) =>
        generateGibberish({
          seed: 3,
          difficulty: difficulty as "easy" | "medium" | "hard",
          minLength: 5000,
        }),
      )
      .join(" ");

    const unguided = [...new Set(text)].filter((char) => !getKeyGuide(char));

    expect(unguided).toEqual([]);
  });
});
