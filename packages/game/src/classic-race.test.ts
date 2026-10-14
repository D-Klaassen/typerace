import { describe, expect, it } from "vitest";
import {
  finishRaceTurn,
  getClassicRaceResults,
  startClassicRace,
} from "./classic-race";
import type { TypingStats } from "./typing";

function turn(timeMs: number, typos = 0): TypingStats {
  return {
    timeMs,
    wpm: 250 / 5 / (timeMs / 60_000),
    accuracy: 250 / (250 + typos),
    typos,
    characters: 250,
    keystrokes: 250 + typos,
  };
}

describe("Classic Race on a Shared Keyboard", () => {
  it("gives every Player exactly one Turn in order", () => {
    let race = startClassicRace({ players: ["Anna", "Bob", "Cas"] });
    expect(race.currentPlayer).toBe("Anna");

    race = finishRaceTurn(race, turn(50_000));
    expect(race.currentPlayer).toBe("Bob");

    race = finishRaceTurn(race, turn(40_000));
    expect(race.currentPlayer).toBe("Cas");
    expect(race.finished).toBe(false);

    race = finishRaceTurn(race, turn(60_000));
    expect(race.currentPlayer).toBeNull();
    expect(race.finished).toBe(true);
  });

  it("ranks Players from fastest to slowest with their stats", () => {
    let race = startClassicRace({ players: ["Anna", "Bob", "Cas"] });
    race = finishRaceTurn(race, turn(50_000));
    race = finishRaceTurn(race, turn(40_000, 3));
    race = finishRaceTurn(race, turn(60_000));

    const results = getClassicRaceResults(race);

    expect(results.map((result) => result.name)).toEqual([
      "Bob",
      "Anna",
      "Cas",
    ]);
    expect(results[0]).toEqual({
      name: "Bob",
      timeMs: 40_000,
      wpm: 75,
      accuracy: 250 / 253,
      typos: 3,
    });
  });

  it("breaks a tie on Time by Accuracy, then by who went first", () => {
    let race = startClassicRace({ players: ["Anna", "Bob", "Cas"] });
    race = finishRaceTurn(race, turn(45_000, 2));
    race = finishRaceTurn(race, turn(45_000));
    race = finishRaceTurn(race, turn(45_000, 2));

    expect(getClassicRaceResults(race).map((result) => result.name)).toEqual([
      "Bob",
      "Anna",
      "Cas",
    ]);
  });
});
