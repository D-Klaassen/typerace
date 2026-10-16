import {
  advanceClock,
  createRoom,
  joinRoom,
  startCountdown,
  typeInRoom,
  updateSettings,
  type Room,
} from "@typerace/game";
import { describe, expect, it } from "vitest";
import { toRoomView } from "./index";

function racingRoom(): Room {
  let room = createRoom();
  room = joinRoom(room, { id: "a", nickname: "Anna" }).room;
  room = joinRoom(room, { id: "b", nickname: "Bob" }).room;
  room = startCountdown(room, "a", { text: "ab", seed: 1, nowMs: 0 });
  return advanceClock(room, 3_000);
}

describe("toRoomView", () => {
  it("sends each racer's progress without repeating the text", () => {
    const room = typeInRoom(racingRoom(), "a", "a", 4_000);

    const view = toRoomView(room);

    expect(view.race).toEqual({
      text: "ab",
      startedAtMs: 3_000,
      racers: [
        {
          playerId: "a",
          position: 1,
          typos: 0,
          typosInARow: 0,
          finished: false,
          dropped: false,
        },
        {
          playerId: "b",
          position: 0,
          typos: 0,
          typosInARow: 0,
          finished: false,
          dropped: false,
        },
      ],
    });
    expect(view.results).toBeNull();
  });

  it("sends each racer's Typos in a row, so others can see them crash", () => {
    let room = racingRoom();
    for (const [key, at] of [
      ["x", 3_500],
      ["y", 3_600],
      ["z", 3_700],
    ] as const) {
      room = typeInRoom(room, "a", key, at);
    }

    expect(
      toRoomView(room).race?.racers.map((racer) => racer.typosInARow),
    ).toEqual([3, 0]);

    room = typeInRoom(room, "a", "a", 3_800);
    expect(toRoomView(room).race?.racers[0]?.typosInARow).toBe(0);
  });

  it("sends the Hot Seat Turn's Typos in a row to those watching", () => {
    let room = createRoom();
    room = joinRoom(room, { id: "a", nickname: "Anna" }).room;
    room = joinRoom(room, { id: "b", nickname: "Bob" }).room;
    room = updateSettings(room, "a", { mode: "hotSeat" });
    room = advanceClock(
      startCountdown(room, "a", { text: "unused", seed: 1, nowMs: 0 }),
      3_000,
    );
    const firstKey = room.hotSeat!.turn!.text[0]!;
    const wrongKey = firstKey === "x" ? "y" : "x";

    room = typeInRoom(room, "a", wrongKey, 3_500);
    room = typeInRoom(room, "a", wrongKey, 3_600);

    expect(toRoomView(room).hotSeat?.turn).toMatchObject({
      position: 0,
      inError: true,
      typosInARow: 2,
    });
  });

  it("includes the ranking once the race is over", () => {
    let room = racingRoom();
    for (const [player, key, at] of [
      ["b", "a", 3_500],
      ["b", "b", 4_000],
      ["a", "a", 4_500],
      ["a", "b", 5_000],
    ] as const) {
      room = typeInRoom(room, player, key, at);
    }

    const results = toRoomView(room).results;
    expect(results?.mode).toBe("classicRace");
    expect(
      results?.mode === "classicRace" &&
        results.ranking.map((result) => result.playerId),
    ).toEqual(["b", "a"]);
  });
});
