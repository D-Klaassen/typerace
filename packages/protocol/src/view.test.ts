import {
  advanceClock,
  createRoom,
  joinRoom,
  startCountdown,
  typeInRoom,
  type Room,
} from "@typerace/game";
import { describe, expect, it } from "vitest";
import { toRoomView } from "./index";

function racingRoom(): Room {
  let room = createRoom();
  room = joinRoom(room, { id: "a", nickname: "Anna" }).room;
  room = joinRoom(room, { id: "b", nickname: "Bob" }).room;
  room = startCountdown(room, "a", { text: "ab", nowMs: 0 });
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
          finished: false,
          dropped: false,
        },
        {
          playerId: "b",
          position: 0,
          typos: 0,
          finished: false,
          dropped: false,
        },
      ],
    });
    expect(view.results).toBeNull();
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

    expect(toRoomView(room).results?.map((result) => result.playerId)).toEqual([
      "b",
      "a",
    ]);
  });
});
