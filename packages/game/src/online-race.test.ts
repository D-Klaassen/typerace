import { describe, expect, it } from "vitest";
import {
  dropFromRace,
  getOnlineRaceResults,
  isRaceOver,
  startOnlineRace,
  typeInRace,
  type OnlineRace,
} from "./online-race";

function typeAll(
  race: OnlineRace,
  playerId: string,
  text: string,
  fromMs: number,
  msPerKey: number,
): OnlineRace {
  return [...text].reduce(
    (current, key, index) =>
      typeInRace(current, playerId, key, fromMs + index * msPerKey),
    race,
  );
}

describe("Online Classic Race", () => {
  it("lets every Player type the same text independently", () => {
    let race = startOnlineRace({
      players: ["a", "b"],
      text: "abc def",
      startedAtMs: 1_000,
    });

    race = typeAll(race, "a", "abc", 1_100, 100);
    race = typeInRace(race, "b", "x", 1_200);

    expect(race.entries.map((entry) => entry.session.position)).toEqual([3, 0]);
    expect(race.entries[1]?.session.typos).toBe(1);
  });

  it("is over once every Player has finished", () => {
    let race = startOnlineRace({
      players: ["a", "b"],
      text: "ab",
      startedAtMs: 0,
    });
    race = typeAll(race, "a", "ab", 100, 100);
    expect(isRaceOver(race, 300)).toBe(false);

    race = typeAll(race, "b", "ab", 300, 100);
    expect(isRaceOver(race, 400)).toBe(true);
  });

  it("is over 60 seconds after the first Player finishes", () => {
    let race = startOnlineRace({
      players: ["a", "b"],
      text: "ab",
      startedAtMs: 0,
    });
    race = typeAll(race, "a", "ab", 1_000, 1_000); // finishes at 2 s

    expect(isRaceOver(race, 61_999)).toBe(false);
    expect(isRaceOver(race, 62_000)).toBe(true);
  });

  it("freezes a dropped Player and stops waiting for them", () => {
    let race = startOnlineRace({
      players: ["a", "b"],
      text: "ab",
      startedAtMs: 0,
    });
    race = typeInRace(race, "b", "a", 100);
    race = dropFromRace(race, "b");
    race = typeInRace(race, "b", "b", 200);
    expect(race.entries[1]?.session.position).toBe(1);

    race = typeAll(race, "a", "ab", 300, 100);
    expect(isRaceOver(race, 500)).toBe(true);
  });

  it("ranks finishers by their Time, then the rest by progress", () => {
    let race = startOnlineRace({
      players: ["a", "b", "c", "d"],
      text: "abcde",
      startedAtMs: 0,
    });
    race = typeAll(race, "a", "abcde", 2_000, 2_000); // finishes at 10 s
    race = typeAll(race, "b", "abcde", 2_000, 1_000); // finishes at 6 s
    race = typeAll(race, "c", "abc", 1_000, 1_000); // 3 of 5 by 3 s
    race = typeInRace(race, "d", "x", 500);
    race = typeInRace(race, "d", "a", 1_000);

    const results = getOnlineRaceResults(race);

    expect(results.map((result) => result.playerId)).toEqual([
      "b",
      "a",
      "c",
      "d",
    ]);
    expect(results[0]).toEqual({
      playerId: "b",
      finished: true,
      timeMs: 6_000,
      progress: 1,
      wpm: 10,
      accuracy: 1,
      typos: 0,
    });
    expect(results[2]).toMatchObject({
      playerId: "c",
      finished: false,
      timeMs: null,
      progress: 0.6,
    });
    expect(results[2]?.wpm).toBeCloseTo(12);
    expect(results[3]).toMatchObject({ accuracy: 0.5, typos: 1 });
  });
});
