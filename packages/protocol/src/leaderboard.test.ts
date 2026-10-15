import { describe, expect, it } from "vitest";
import {
  leaderboardSearch,
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
} from "./index";

describe("parseLeaderboardSubmission", () => {
  const valid = {
    keySet: { keys: "asdfghjkl;", capitals: false },
    records: [{ nickname: " Anna ", timeMs: 30_000 }],
  };

  it("accepts a finished Time Trial and trims nicknames", () => {
    expect(parseLeaderboardSubmission(valid)).toEqual({
      ...valid,
      records: [{ nickname: "Anna", timeMs: 30_000 }],
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
      "not json",
    ]) {
      expect(parseLeaderboardSubmission(body)).toBeNull();
    }
  });
});

describe("leaderboard search", () => {
  it("round-trips a Key Set, with its keys in keyboard order", () => {
    const search = leaderboardSearch({ keys: "fjdk", capitals: true });

    expect(parseLeaderboardSearch(new URLSearchParams(search))).toEqual({
      keys: "dfjk",
      capitals: true,
    });
  });

  it("rejects a search without enough keys", () => {
    expect(parseLeaderboardSearch(new URLSearchParams("keys=a"))).toBeNull();
  });
});
