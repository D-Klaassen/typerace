import { describe, expect, it } from "vitest";
import {
  completeTurn,
  eliminatePlayer,
  getTimeTrialResults,
  runOutOfTime,
  startTimeTrial,
} from "./time-trial";
import type { TypingStats } from "./typing";

/** Stats for a clean Turn of 150 characters that took `timeMs`. */
function turnTaking(timeMs: number, typos = 0): TypingStats {
  return {
    timeMs,
    wpm: 150 / 5 / (timeMs / 60_000),
    accuracy: 150 / (150 + typos),
    typos,
    characters: 150,
    keystrokes: 150 + typos,
  };
}

describe("Time Trial", () => {
  it("gives every Player one Turn in order during the opening round", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    expect(trial.currentPlayer).toBe("Anna");

    trial = completeTurn(trial, turnTaking(40_000));
    expect(trial.currentPlayer).toBe("Bob");

    trial = completeTurn(trial, turnTaking(50_000));
    expect(trial.currentPlayer).toBe("Cas");
  });

  it("lets the slowest Player go again until they beat someone", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 600_000,
    });
    trial = completeTurn(trial, turnTaking(40_000));
    trial = completeTurn(trial, turnTaking(50_000));
    trial = completeTurn(trial, turnTaking(70_000));
    expect(trial.currentPlayer).toBe("Cas");

    trial = completeTurn(trial, turnTaking(60_000));
    expect(trial.currentPlayer).toBe("Cas");

    trial = completeTurn(trial, turnTaking(45_000));
    expect(trial.currentPlayer).toBe("Bob");
  });

  it("picks whoever set their time most recently when the slowest is tied", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 600_000,
    });
    trial = completeTurn(trial, turnTaking(40_000));
    trial = completeTurn(trial, turnTaking(60_000));
    trial = completeTurn(trial, turnTaking(60_000));

    expect(trial.currentPlayer).toBe("Cas");
  });

  it("eliminates a Player whose Time Bank runs out and moves on to the next slowest", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    trial = completeTurn(trial, turnTaking(40_000));
    trial = completeTurn(trial, turnTaking(50_000));
    trial = completeTurn(trial, turnTaking(70_000));

    trial = runOutOfTime(trial, turnTaking(50_000));

    expect(trial.currentPlayer).toBe("Bob");
    expect(trial.players).toMatchObject([
      { name: "Anna", timeBankMs: 80_000, eliminated: false },
      { name: "Bob", timeBankMs: 70_000, eliminated: false },
      { name: "Cas", timeBankMs: 0, eliminated: true },
    ]);
  });

  it("ends with a winner when one Player is left, ranked with combined stats", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob"],
      timeBankMs: 60_000,
    });
    trial = completeTurn(trial, turnTaking(40_000));
    trial = completeTurn(trial, turnTaking(50_000));
    trial = runOutOfTime(trial, {
      timeMs: 10_000,
      wpm: 24,
      accuracy: 0.8,
      typos: 5,
      characters: 20,
      keystrokes: 25,
    });

    expect(trial.winner).toBe("Anna");
    expect(trial.currentPlayer).toBeNull();

    const [first, second] = getTimeTrialResults(trial);
    expect(first).toEqual({
      name: "Anna",
      bestTimeMs: 40_000,
      turns: 1,
      timeMs: 40_000,
      wpm: 45,
      accuracy: 1,
      typos: 0,
    });
    expect(second).toEqual({
      name: "Bob",
      bestTimeMs: 50_000,
      turns: 2,
      timeMs: 60_000,
      wpm: 34,
      accuracy: 170 / 175,
      typos: 5,
    });
  });

  it("keeps the opening order when someone runs out of time in the opening round", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 60_000,
    });
    trial = runOutOfTime(trial, turnTaking(60_000));

    expect(trial.currentPlayer).toBe("Bob");
    expect(trial.eliminated).toEqual(["Anna"]);

    trial = completeTurn(trial, turnTaking(30_000));
    expect(trial.currentPlayer).toBe("Cas");
  });

  it("treats a Turn that uses up the whole Time Bank as running out of time", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob"],
      timeBankMs: 60_000,
    });
    trial = completeTurn(trial, turnTaking(30_000));
    trial = completeTurn(trial, turnTaking(60_000));

    expect(trial.winner).toBe("Anna");
    expect(trial.eliminated).toEqual(["Bob"]);
  });

  it("can eliminate a Player who is waiting for their Turn", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    trial = completeTurn(trial, turnTaking(40_000));
    trial = completeTurn(trial, turnTaking(50_000));

    trial = eliminatePlayer(trial, "Bob");
    expect(trial.currentPlayer).toBe("Cas");
    expect(trial.eliminated).toEqual(["Bob"]);

    trial = eliminatePlayer(trial, "Cas");
    expect(trial.winner).toBe("Anna");
    expect(trial.currentPlayer).toBeNull();
  });
});
