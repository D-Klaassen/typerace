import { describe, expect, it } from "vitest";
import {
  leaderboardSearch,
  leaderboardSubmissionBody,
  minLeaderboardTimeMs,
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
} from "./index";

describe("parseLeaderboardSubmission", () => {
  const valid = {
    source: "words",
    language: "en",
    length: "medium",
    records: [{ nickname: " Anna ", timeMs: 30_000 }],
  };

  it("accepts a finished Hot Seat Match and trims nicknames", () => {
    expect(parseLeaderboardSubmission(valid)).toEqual({
      board: { kind: "words", language: "en", textLength: "medium" },
      records: [{ nickname: "Anna", timeMs: 30_000 }],
    });
  });

  it("round-trips a board by Text Source, Language and Text Length", () => {
    const records = [{ nickname: "Anna", timeMs: 30_000 }];
    const body = leaderboardSubmissionBody({
      board: { kind: "sentences", language: "nl", textLength: "long" },
      records,
    });

    expect(body).toEqual({
      source: "sentences",
      language: "nl",
      length: "long",
      records,
    });
    expect(parseLeaderboardSubmission(body)).toEqual({
      board: { kind: "sentences", language: "nl", textLength: "long" },
      records,
    });
  });

  it("puts a submission without a Text Length on the Medium board", () => {
    const withoutLength = { ...valid, length: undefined };

    expect(parseLeaderboardSubmission(withoutLength)?.board).toEqual({
      kind: "words",
      language: "en",
      textLength: "medium",
    });
  });

  it("takes faster Times on shorter texts", () => {
    const fastest = (length: string, timeMs: number) =>
      parseLeaderboardSubmission({
        ...valid,
        length,
        records: [{ nickname: "Anna", timeMs }],
      });

    expect(minLeaderboardTimeMs("short")).toBe(2_500);
    expect(minLeaderboardTimeMs("medium")).toBe(5_000);
    expect(minLeaderboardTimeMs("long")).toBe(10_000);
    expect(fastest("short", 2_500)).not.toBeNull();
    expect(fastest("short", 2_499)).toBeNull();
    expect(fastest("long", 9_999)).toBeNull();
  });

  it("rejects impossible times, bad nicknames, Gibberish and unknown text", () => {
    for (const body of [
      { ...valid, records: [{ nickname: "Anna", timeMs: 1_000 }] },
      { ...valid, records: [{ nickname: "Anna", timeMs: 30_000.5 }] },
      { ...valid, records: [{ nickname: "Anna", timeMs: 600_001 }] },
      { ...valid, records: [{ nickname: "   ", timeMs: 30_000 }] },
      { ...valid, records: [{ nickname: "A".repeat(17), timeMs: 30_000 }] },
      { ...valid, records: [] },
      { ...valid, source: "gibberish" },
      { ...valid, language: "de" },
      { ...valid, length: "epic" },
      { ...valid, keySet: { keys: "asdfghjkl;", capitals: false } },
      {
        keySet: { keys: "asdfghjkl;", capitals: false },
        records: valid.records,
      },
      "not json",
    ]) {
      expect(parseLeaderboardSubmission(body)).toBeNull();
    }
  });
});

describe("leaderboard search", () => {
  it("round-trips a Text Source, Language and Text Length", () => {
    const search = leaderboardSearch({
      kind: "words",
      language: "en",
      textLength: "short",
    });

    expect(parseLeaderboardSearch(new URLSearchParams(search))).toEqual({
      kind: "words",
      language: "en",
      textLength: "short",
    });
  });

  it("asks for the Medium board without a Text Length", () => {
    expect(
      parseLeaderboardSearch(new URLSearchParams("source=words&language=nl")),
    ).toEqual({ kind: "words", language: "nl", textLength: "medium" });
  });

  it("rejects a search without a known Text Source, Language and Text Length", () => {
    for (const search of [
      "keys=asdfghjkl%3B&capitals=false",
      "source=words",
      "source=gibberish&language=en",
      "source=poems&language=en",
      "source=words&language=en&length=epic",
    ]) {
      expect(parseLeaderboardSearch(new URLSearchParams(search))).toBeNull();
    }
  });
});
