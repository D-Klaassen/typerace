import { describe, expect, it } from "vitest";
import {
  addToLeaderboard,
  LEADERBOARD_SIZE,
  leaderboardBoard,
  timeTrialRecords,
} from "./leaderboard";
import { resolveKeySet } from "./key-sets";
import {
  advanceClock,
  createRoom,
  joinRoom,
  roomLeaderboardRecords,
  startCountdown,
  typeInRoom,
  updateSettings,
  type Room,
} from "./room";
import { completeTurn, runOutOfTime, startTimeTrial } from "./time-trial";
import type { TypingStats } from "./typing";

function turnTaking(timeMs: number): TypingStats {
  return {
    timeMs,
    wpm: 150 / 5 / (timeMs / 60_000),
    accuracy: 1,
    typos: 0,
    characters: 150,
    keystrokes: 150,
  };
}

describe("Leaderboard", () => {
  it("has one board per set of keys and Capitals, however they were chosen", () => {
    const homeRow = resolveKeySet({ preset: "row-home" }, false);
    const sameKeys = resolveKeySet({ custom: ";lkjhgfdsa" }, false);
    const withCapitals = resolveKeySet({ preset: "row-home" }, true);

    expect(leaderboardBoard(sameKeys)).toBe(leaderboardBoard(homeRow));
    expect(leaderboardBoard(withCapitals)).not.toBe(leaderboardBoard(homeRow));
  });

  it("records each Player's best Time once the Time Trial has a winner", () => {
    let trial = startTimeTrial({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    trial = completeTurn(trial, turnTaking(30_000));
    trial = completeTurn(trial, turnTaking(50_000));
    expect(timeTrialRecords(trial)).toEqual([]);

    // Cas runs out of time without finishing a Turn, then Bob does.
    trial = runOutOfTime(trial, turnTaking(120_000));
    trial = completeTurn(trial, turnTaking(40_000));
    trial = runOutOfTime(trial, turnTaking(80_000));

    expect(trial.winner).toBe("Anna");
    expect(timeTrialRecords(trial)).toEqual([
      { nickname: "Anna", timeMs: 30_000 },
      { nickname: "Bob", timeMs: 40_000 },
    ]);
  });

  it("names Players by nickname and skips those it can't name", () => {
    let trial = startTimeTrial({ players: ["p1", "p2"], timeBankMs: 60_000 });
    trial = completeTurn(trial, turnTaking(20_000));
    trial = completeTurn(trial, turnTaking(25_000));
    trial = runOutOfTime(trial, turnTaking(35_000));

    expect(
      timeTrialRecords(trial, (id) => (id === "p1" ? "Anna" : undefined)),
    ).toEqual([{ nickname: "Anna", timeMs: 20_000 }]);
  });

  it("ranks the fastest first, the earliest first on a tie, and keeps the top", () => {
    let board = addToLeaderboard(
      [],
      [
        { nickname: "Bob", timeMs: 40_000 },
        { nickname: "Anna", timeMs: 30_000 },
      ],
      1,
    );
    board = addToLeaderboard(board, [{ nickname: "Cas", timeMs: 30_000 }], 2);

    expect(board.map((entry) => entry.nickname)).toEqual([
      "Anna",
      "Cas",
      "Bob",
    ]);
    expect(board[1]).toEqual({
      nickname: "Cas",
      timeMs: 30_000,
      recordedAtMs: 2,
    });

    const slow = Array.from({ length: LEADERBOARD_SIZE }, (_, index) => ({
      nickname: `Slow ${index}`,
      timeMs: 90_000,
    }));
    board = addToLeaderboard(board, slow, 3);

    expect(board).toHaveLength(LEADERBOARD_SIZE);
    expect(board.slice(0, 3).map((entry) => entry.nickname)).toEqual([
      "Anna",
      "Cas",
      "Bob",
    ]);
  });
});

describe("Leaderboard records of a Room", () => {
  function timeTrialRoom(): Room {
    let room = ["Anna", "Bob"].reduce(
      (next, nickname, index) =>
        joinRoom(next, { id: `p${index + 1}`, nickname }).room,
      createRoom(),
    );
    room = updateSettings(room, "p1", {
      mode: "timeTrial",
      timeBankMs: 60_000,
      keySet: { preset: "row-home" },
    });

    return advanceClock(
      startCountdown(room, "p1", { text: "unused", seed: 1, nowMs: 0 }),
      3_000,
    );
  }

  function typeTurn(room: Room, playerId: string, startMs: number): Room {
    const text = room.timeTrial!.turn!.text;

    return [...text].reduce(
      (next, key, index) =>
        typeInRoom(next, playerId, key, startMs + index * 100),
      room,
    );
  }

  it("has the best Times and the Key Set once the Time Trial is over", () => {
    let room = timeTrialRoom();
    room = typeTurn(room, "p1", 4_000);
    expect(roomLeaderboardRecords(room)).toBeNull();

    room = typeTurn(room, "p2", 30_000);
    room = typeInRoom(room, "p2", room.timeTrial!.turn!.text[0]!, 60_000);
    room = advanceClock(room, 200_000);

    expect(room.phase).toBe("results");
    const result = roomLeaderboardRecords(room);
    expect(result?.keySet).toEqual(
      resolveKeySet({ preset: "row-home" }, false),
    );
    expect(result?.records.map((record) => record.nickname)).toEqual([
      "Anna",
      "Bob",
    ]);
  });
});
