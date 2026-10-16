import { describe, expect, it } from "vitest";
import {
  leaderboardSearch,
  leaderboardSubmissionBody,
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
} from "./index";

describe("parseLeaderboardSubmission", () => {
  const valid = {
    source: "words",
    language: "en",
    records: [{ nickname: " Anna ", timeMs: 30_000 }],
  };

  it("accepts a finished Hot Seat Match and trims nicknames", () => {
    expect(parseLeaderboardSubmission(valid)).toEqual({
      textSource: { kind: "words", language: "en" },
      records: [{ nickname: "Anna", timeMs: 30_000 }],
    });
  });

  it("round-trips a Hot Seat Match by Text Source and Language", () => {
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

  it("rejects impossible times, bad nicknames, Gibberish and unknown text", () => {
    for (const body of [
      { ...valid, records: [{ nickname: "Anna", timeMs: 1_000 }] },
      { ...valid, records: [{ nickname: "Anna", timeMs: 30_000.5 }] },
      { ...valid, records: [{ nickname: "   ", timeMs: 30_000 }] },
      { ...valid, records: [{ nickname: "A".repeat(17), timeMs: 30_000 }] },
      { ...valid, records: [] },
      { ...valid, source: "gibberish" },
      { ...valid, language: "de" },
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
  it("round-trips a Text Source and Language", () => {
    const search = leaderboardSearch({ kind: "words", language: "en" });

    expect(parseLeaderboardSearch(new URLSearchParams(search))).toEqual({
      kind: "words",
      language: "en",
    });
  });

  it("rejects a search without a known Text Source and Language", () => {
    for (const search of [
      "keys=asdfghjkl%3B&capitals=false",
      "source=words",
      "source=gibberish&language=en",
      "source=poems&language=en",
    ]) {
      expect(parseLeaderboardSearch(new URLSearchParams(search))).toBeNull();
    }
  });
});
