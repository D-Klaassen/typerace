import { describe, expect, it } from "vitest";
import {
  completeTurn,
  eliminatePlayer,
  getHotSeatResults,
  runOutOfTime,
  startHotSeat,
} from "./hot-seat";
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

describe("Hot Seat", () => {
  it("gives every Player one Turn in order during the opening round", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    expect(seat.currentPlayer).toBe("Anna");

    seat = completeTurn(seat, turnTaking(40_000));
    expect(seat.currentPlayer).toBe("Bob");

    seat = completeTurn(seat, turnTaking(50_000));
    expect(seat.currentPlayer).toBe("Cas");
  });

  it("lets the slowest Player go again until they beat someone", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 600_000,
    });
    seat = completeTurn(seat, turnTaking(40_000));
    seat = completeTurn(seat, turnTaking(50_000));
    seat = completeTurn(seat, turnTaking(70_000));
    expect(seat.currentPlayer).toBe("Cas");

    seat = completeTurn(seat, turnTaking(60_000));
    expect(seat.currentPlayer).toBe("Cas");

    seat = completeTurn(seat, turnTaking(45_000));
    expect(seat.currentPlayer).toBe("Bob");
  });

  it("picks whoever set their time most recently when the slowest is tied", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 600_000,
    });
    seat = completeTurn(seat, turnTaking(40_000));
    seat = completeTurn(seat, turnTaking(60_000));
    seat = completeTurn(seat, turnTaking(60_000));

    expect(seat.currentPlayer).toBe("Cas");
  });

  it("eliminates a Player whose Time Bank runs out and moves on to the next slowest", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    seat = completeTurn(seat, turnTaking(40_000));
    seat = completeTurn(seat, turnTaking(50_000));
    seat = completeTurn(seat, turnTaking(70_000));

    seat = runOutOfTime(seat, turnTaking(50_000));

    expect(seat.currentPlayer).toBe("Bob");
    expect(seat.players).toMatchObject([
      { name: "Anna", timeBankMs: 80_000, eliminated: false },
      { name: "Bob", timeBankMs: 70_000, eliminated: false },
      { name: "Cas", timeBankMs: 0, eliminated: true },
    ]);
  });

  it("ends with a winner when one Player is left, ranked with combined stats", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob"],
      timeBankMs: 60_000,
    });
    seat = completeTurn(seat, turnTaking(40_000));
    seat = completeTurn(seat, turnTaking(50_000));
    seat = runOutOfTime(seat, {
      timeMs: 10_000,
      wpm: 24,
      accuracy: 0.8,
      typos: 5,
      characters: 20,
      keystrokes: 25,
    });

    expect(seat.winner).toBe("Anna");
    expect(seat.currentPlayer).toBeNull();

    const [first, second] = getHotSeatResults(seat);
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
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 60_000,
    });
    seat = runOutOfTime(seat, turnTaking(60_000));

    expect(seat.currentPlayer).toBe("Bob");
    expect(seat.eliminated).toEqual(["Anna"]);

    seat = completeTurn(seat, turnTaking(30_000));
    expect(seat.currentPlayer).toBe("Cas");
  });

  it("treats a Turn that uses up the whole Time Bank as running out of time", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob"],
      timeBankMs: 60_000,
    });
    seat = completeTurn(seat, turnTaking(30_000));
    seat = completeTurn(seat, turnTaking(60_000));

    expect(seat.winner).toBe("Anna");
    expect(seat.eliminated).toEqual(["Bob"]);
  });

  it("can eliminate a Player who is waiting for their Turn", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    seat = completeTurn(seat, turnTaking(40_000));
    seat = completeTurn(seat, turnTaking(50_000));

    seat = eliminatePlayer(seat, "Bob");
    expect(seat.currentPlayer).toBe("Cas");
    expect(seat.eliminated).toEqual(["Bob"]);

    seat = eliminatePlayer(seat, "Cas");
    expect(seat.winner).toBe("Anna");
    expect(seat.currentPlayer).toBeNull();
  });
});
