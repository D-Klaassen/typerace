import { describe, expect, it } from "vitest";
import {
  leaderboardSearch,
  leaderboardSubmissionBody,
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
} from "./index";

describe("parseLeaderboardSubmission", () => {
  const valid = {
    keySet: { keys: "asdfghjkl;", capitals: false },
    records: [{ nickname: " Anna ", timeMs: 30_000 }],
  };

  it("accepts a finished Hot Seat Match and trims nicknames", () => {
    expect(parseLeaderboardSubmission(valid)).toEqual({
      textSource: { kind: "gibberish", keySet: valid.keySet },
      records: [{ nickname: "Anna", timeMs: 30_000 }],
    });
  });

  it("accepts a Hot Seat Match with real text, by Text Source and Language", () => {
    const records = [{ nickname: "Anna", timeMs: 30_000 }];
    const body = leaderboardSubmissionBody({
      textSource: { kind: "sentences", language: "nl" },
      records,
    });

    expect(body).toEqual({ source: "sentences", language: "nl", records });
    expect(parseLeaderboardSubmission(body)).toEqual({
      textSource: { kind: "sentences", language: "nl" },
      records,
    });
  });

  it("rejects impossible times, bad nicknames and unknown keys", () => {
    for (const body of [
      { ...valid, records: [{ nickname: "Anna", timeMs: 1_000 }] },
      { ...valid, records: [{ nickname: "Anna", timeMs: 30_000.5 }] },
      { ...valid, records: [{ nickname: "   ", timeMs: 30_000 }] },
      { ...valid, records: [{ nickname: "A".repeat(17), timeMs: 30_000 }] },
      { ...valid, records: [] },
      { ...valid, keySet: { keys: "ÄÖ", capitals: false } },
      { records: valid.records, source: "gibberish", language: "en" },
      { records: valid.records, source: "words", language: "de" },
      { ...valid, source: "words", language: "en" },
      "not json",
    ]) {
      expect(parseLeaderboardSubmission(body)).toBeNull();
    }
  });
});

describe("leaderboard search", () => {
  it("round-trips a Key Set, with its keys in keyboard order", () => {
    const search = leaderboardSearch({
      kind: "gibberish",
      keySet: { keys: "fjdk", capitals: true },
    });

    expect(parseLeaderboardSearch(new URLSearchParams(search))).toEqual({
      kind: "gibberish",
      keySet: { keys: "dfjk", capitals: true },
    });
  });

  it("round-trips a Text Source and Language", () => {
    const search = leaderboardSearch({ kind: "words", language: "en" });

    expect(parseLeaderboardSearch(new URLSearchParams(search))).toEqual({
      kind: "words",
      language: "en",
    });
  });

  it("rejects a search without enough keys or a known Text Source", () => {
    for (const search of [
      "keys=a",
      "source=words",
      "source=gibberish&language=en",
      "source=poems&language=en",
    ]) {
      expect(parseLeaderboardSearch(new URLSearchParams(search))).toBeNull();
    }
  });
});
