import { describe, expect, it } from "vitest";
import {
  addToLeaderboard,
  LEADERBOARD_SIZE,
  leaderboardBoard,
  leaderboardTextSource,
  hotSeatRecords,
  soloRaceRecords,
} from "./leaderboard";
import { finishRaceTurn, startClassicRace } from "./classic-race";
import { resolveKeySet } from "./key-sets";
import { HOT_SEAT_TURN_LENGTH } from "./online-hot-seat";
import { LANGUAGES, REAL_TEXT_KINDS, resolveTextSource } from "./text-source";
import {
  advanceClock,
  createRoom,
  joinRoom,
  roomLeaderboardRecords,
  startCountdown,
  typeInRoom,
  updateSettings,
  type Room,
  type RoomSettings,
} from "./room";
import { completeTurn, runOutOfTime, startHotSeat } from "./hot-seat";
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
  it("has one board per Text Source and Language", () => {
    const boards = REAL_TEXT_KINDS.flatMap((kind) =>
      LANGUAGES.map((language) => leaderboardBoard({ kind, language })),
    );

    expect(new Set(boards).size).toBe(boards.length);
  });

  it("has no board for Gibberish, which is for practising keys", () => {
    const words = { kind: "words", language: "nl" } as const;

    expect(
      leaderboardTextSource(
        resolveTextSource({
          textSource: "words",
          language: "nl",
          keySet: { preset: "row-home" },
          capitals: true,
        }),
      ),
    ).toEqual(words);
    expect(
      leaderboardTextSource({
        kind: "gibberish",
        keySet: resolveKeySet({ preset: "row-home" }, false),
      }),
    ).toBeNull();
  });

  it("keeps Times from the old 150-character Turns off today's boards", () => {
    expect(leaderboardBoard({ kind: "words", language: "en" })).toBe(
      `${HOT_SEAT_TURN_LENGTH}:words:en`,
    );
  });

  it("records each Player's best Time once the Hot Seat Match has a winner", () => {
    let seat = startHotSeat({
      players: ["Anna", "Bob", "Cas"],
      timeBankMs: 120_000,
    });
    seat = completeTurn(seat, turnTaking(30_000));
    seat = completeTurn(seat, turnTaking(50_000));
    expect(hotSeatRecords(seat)).toEqual([]);

    // Cas runs out of time without finishing a Turn, then Bob does.
    seat = runOutOfTime(seat, turnTaking(120_000));
    seat = completeTurn(seat, turnTaking(40_000));
    seat = runOutOfTime(seat, turnTaking(80_000));

    expect(seat.winner).toBe("Anna");
    expect(hotSeatRecords(seat)).toEqual([
      { nickname: "Anna", timeMs: 30_000 },
      { nickname: "Bob", timeMs: 40_000 },
    ]);
  });

  it("records Times in whole milliseconds, as the browser's clock has fractions", () => {
    let seat = startHotSeat({ players: ["Anna", "Bob"], timeBankMs: 60_000 });
    seat = completeTurn(seat, turnTaking(20_000.4));
    seat = completeTurn(seat, turnTaking(25_000.6));
    seat = runOutOfTime(seat, turnTaking(35_000));
    const race = finishRaceTurn(
      startClassicRace({ players: ["Anna"] }),
      turnTaking(25_000.5),
    );

    expect(hotSeatRecords(seat)).toEqual([
      { nickname: "Anna", timeMs: 20_000 },
      { nickname: "Bob", timeMs: 25_001 },
    ]);
    expect(soloRaceRecords(race, HOT_SEAT_TURN_LENGTH)).toEqual([
      { nickname: "Anna", timeMs: 25_001 },
    ]);
  });

  it("names Players by nickname and skips those it can't name", () => {
    let seat = startHotSeat({ players: ["p1", "p2"], timeBankMs: 60_000 });
    seat = completeTurn(seat, turnTaking(20_000));
    seat = completeTurn(seat, turnTaking(25_000));
    seat = runOutOfTime(seat, turnTaking(35_000));

    expect(
      hotSeatRecords(seat, (id) => (id === "p1" ? "Anna" : undefined)),
    ).toEqual([{ nickname: "Anna", timeMs: 20_000 }]);
  });

  it("records a solo Classic Race whose text was a Turn's length", () => {
    const race = finishRaceTurn(
      startClassicRace({ players: ["Anna"] }),
      turnTaking(25_000),
    );

    expect(soloRaceRecords(race, HOT_SEAT_TURN_LENGTH)).toEqual([
      { nickname: "Anna", timeMs: 25_000 },
    ]);
    expect(soloRaceRecords(race, HOT_SEAT_TURN_LENGTH * 2)).toEqual([]);
  });

  it("doesn't record a Classic Race with more Players, or an unfinished one", () => {
    let race = startClassicRace({ players: ["Anna", "Bob"] });
    race = finishRaceTurn(race, turnTaking(25_000));
    race = finishRaceTurn(race, turnTaking(30_000));

    expect(soloRaceRecords(race, HOT_SEAT_TURN_LENGTH)).toEqual([]);
    expect(
      soloRaceRecords(
        startClassicRace({ players: ["Anna"] }),
        HOT_SEAT_TURN_LENGTH,
      ),
    ).toEqual([]);
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
  function hotSeatRoom(changes: Partial<RoomSettings> = {}): Room {
    let room = ["Anna", "Bob"].reduce(
      (next, nickname, index) =>
        joinRoom(next, { id: `p${index + 1}`, nickname }).room,
      createRoom(),
    );
    room = updateSettings(room, "p1", {
      mode: "hotSeat",
      timeBankMs: 60_000,
      keySet: { preset: "row-home" },
      ...changes,
    });

    return advanceClock(
      startCountdown(room, "p1", { text: "unused", seed: 1, nowMs: 0 }),
      3_000,
    );
  }

  function finish(room: Room): Room {
    room = typeTurn(room, "p1", 4_000);
    room = typeTurn(room, "p2", 30_000);
    // Whoever is slowest starts a Turn and runs out of time.
    const { seat, turn } = room.hotSeat!;
    room = typeInRoom(room, seat.currentPlayer!, turn!.text[0]!, 60_000);

    return advanceClock(room, 200_000);
  }

  function typeTurn(room: Room, playerId: string, startMs: number): Room {
    const text = room.hotSeat!.turn!.text;

    return [...text].reduce(
      (next, key, index) =>
        typeInRoom(next, playerId, key, startMs + index * 100),
      room,
    );
  }

  it("has nothing for a Hot Seat Match on Gibberish", () => {
    const room = finish(hotSeatRoom());

    expect(room.phase).toBe("results");
    expect(roomLeaderboardRecords(room)).toBeNull();
  });

  it("has the best Times and the Text Source once the Hot Seat Match is over", () => {
    const started = hotSeatRoom({ textSource: "sentences", language: "nl" });
    expect(roomLeaderboardRecords(typeTurn(started, "p1", 4_000))).toBeNull();

    const room = finish(started);

    expect(room.phase).toBe("results");
    const result = roomLeaderboardRecords(room);
    expect(result?.textSource).toEqual({ kind: "sentences", language: "nl" });
    expect(result?.records.map((record) => record.nickname)).toEqual([
      "Anna",
      "Bob",
    ]);
  });
});
