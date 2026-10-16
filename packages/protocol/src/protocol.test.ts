import { describe, expect, it } from "vitest";
import { generateRoomCode, isRoomCode, parseClientMessage } from "./index";

describe("room codes", () => {
  it("are six letters without easily confused ones", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-HJ-NP-Z]{6}$/);
      expect(isRoomCode(code)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    for (const code of ["ABCDE", "ABCDEFG", "abcdef", "ABCDEO", "ABC1EF"]) {
      expect(isRoomCode(code)).toBe(false);
    }
  });
});

describe("parseClientMessage", () => {
  it("accepts a valid join", () => {
    expect(
      parseClientMessage(
        JSON.stringify({ type: "join", nickname: "Anna", intent: "create" }),
      ),
    ).toEqual({ type: "join", nickname: "Anna", intent: "create" });
  });

  it("accepts partial settings within range", () => {
    expect(
      parseClientMessage(
        JSON.stringify({
          type: "updateSettings",
          changes: { mode: "crazyDarts", startingHp: 150 },
        }),
      ),
    ).toEqual({
      type: "updateSettings",
      changes: { mode: "crazyDarts", startingHp: 150 },
    });
  });

  it("accepts Key Sets, Capitals, preset Votes and a Player's display", () => {
    for (const message of [
      { type: "updateSettings", changes: { keySet: { preset: "lesson-14" } } },
      {
        type: "updateSettings",
        changes: { keySet: { custom: "fjdk" }, capitals: true },
      },
      { type: "vote", vote: { keySet: "row-top" } },
      { type: "display", display: { fingerGuide: false, keyboard: true } },
    ]) {
      expect(parseClientMessage(JSON.stringify(message))).toEqual(message);
    }
  });

  it("accepts a Text Source and Language, and rejects unknown ones", () => {
    const message = {
      type: "updateSettings",
      changes: { textSource: "sentences", language: "nl" },
    };
    expect(parseClientMessage(JSON.stringify(message))).toEqual(message);

    for (const changes of [{ textSource: "poems" }, { language: "de" }]) {
      expect(
        parseClientMessage(JSON.stringify({ type: "updateSettings", changes })),
      ).toBeNull();
    }
  });

  it("rejects unknown Key Set presets", () => {
    for (const message of [
      { type: "updateSettings", changes: { keySet: { preset: "lesson-999" } } },
      { type: "vote", vote: { keySet: "nope" } },
    ]) {
      expect(parseClientMessage(JSON.stringify(message))).toBeNull();
    }
  });

  it("rejects unknown types, bad values and invalid JSON", () => {
    for (const raw of [
      "not json",
      JSON.stringify({ type: "explode" }),
      JSON.stringify({ type: "vote", vote: { mode: "chess" } }),
      JSON.stringify({ type: "updateSettings", changes: { startingHp: -5 } }),
      JSON.stringify({ type: "join", nickname: 42, intent: "join" }),
    ]) {
      expect(parseClientMessage(raw)).toBeNull();
    }
  });
});
