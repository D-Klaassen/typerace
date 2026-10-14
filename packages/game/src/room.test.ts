import { describe, expect, it } from "vitest";
import {
  castVote,
  createRoom,
  getVoteCounts,
  joinRoom,
  leaveRoom,
  updateSettings,
  type Room,
} from "./room";

function roomWith(...nicknames: string[]): Room {
  return nicknames.reduce(
    (room, nickname, index) =>
      joinRoom(room, { id: `p${index + 1}`, nickname }).room,
    createRoom(),
  );
}

describe("Room", () => {
  it("makes the first Player to join the Host", () => {
    let room = createRoom();
    room = joinRoom(room, { id: "a", nickname: "Anna" }).room;
    room = joinRoom(room, { id: "b", nickname: "Bob" }).room;

    expect(room.hostId).toBe("a");
    expect(room.players.map((player) => player.nickname)).toEqual([
      "Anna",
      "Bob",
    ]);
  });

  it("turns away a seventh Player", () => {
    const full = roomWith("A", "B", "C", "D", "E", "F");

    const result = joinRoom(full, { id: "p7", nickname: "G" });

    expect(result.error).toBe("roomFull");
    expect(result.room).toBe(full);
  });

  it("rejects a nickname that is taken, ignoring case", () => {
    const room = roomWith("Anna");

    const result = joinRoom(room, { id: "p2", nickname: "anna" });

    expect(result.error).toBe("nicknameTaken");
    expect(result.room).toBe(room);
  });

  it("rejects an empty or too long nickname and trims the rest", () => {
    const room = createRoom();

    expect(joinRoom(room, { id: "a", nickname: "  " }).error).toBe(
      "nicknameRequired",
    );
    expect(
      joinRoom(room, { id: "a", nickname: "seventeen chars!!" }).error,
    ).toBe("nicknameTooLong");
    expect(
      joinRoom(room, { id: "a", nickname: " Anna " }).room.players[0]?.nickname,
    ).toBe("Anna");
  });

  it("hands the Host role to the longest-present Player when the Host leaves", () => {
    const room = leaveRoom(roomWith("Anna", "Bob", "Cas"), "p1");

    expect(room.hostId).toBe("p2");
    expect(room.players.map((player) => player.nickname)).toEqual([
      "Bob",
      "Cas",
    ]);
  });

  it("keeps the Host when someone else leaves, and has none once empty", () => {
    let room = leaveRoom(roomWith("Anna", "Bob"), "p2");
    expect(room.hostId).toBe("p1");

    room = leaveRoom(room, "p1");
    expect(room.hostId).toBeNull();
    expect(room.players).toEqual([]);
  });

  it("lets only the Host change the settings", () => {
    const room = roomWith("Anna", "Bob");

    const changedByHost = updateSettings(room, "p1", {
      mode: "crazyDarts",
      difficulty: "hard",
    });
    expect(changedByHost.settings).toMatchObject({
      mode: "crazyDarts",
      difficulty: "hard",
    });

    expect(updateSettings(room, "p2", { difficulty: "easy" })).toBe(room);
  });

  it("counts one Mode and one Difficulty Vote per non-Host Player", () => {
    let room = roomWith("Anna", "Bob", "Cas");
    room = castVote(room, "p2", { mode: "crazyDarts" });
    room = castVote(room, "p2", { difficulty: "hard" });
    room = castVote(room, "p3", { mode: "timeTrial" });
    room = castVote(room, "p3", { mode: "crazyDarts" }); // changed their mind
    room = castVote(room, "p1", { mode: "classicRace" }); // the Host can't vote

    expect(getVoteCounts(room)).toEqual({
      mode: { classicRace: 0, crazyDarts: 2, timeTrial: 0 },
      difficulty: { easy: 0, medium: 0, hard: 1 },
    });
  });

  it("drops the Votes of Players who left or became Host", () => {
    let room = roomWith("Anna", "Bob", "Cas");
    room = castVote(room, "p2", { mode: "crazyDarts" });
    room = castVote(room, "p3", { mode: "timeTrial" });

    room = leaveRoom(room, "p1"); // Bob becomes Host
    expect(getVoteCounts(room).mode).toEqual({
      classicRace: 0,
      crazyDarts: 0,
      timeTrial: 1,
    });

    room = leaveRoom(room, "p3");
    expect(getVoteCounts(room).mode.timeTrial).toBe(0);
  });
});
