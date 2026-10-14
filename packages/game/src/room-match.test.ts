import { describe, expect, it } from "vitest";
import {
  advanceClock,
  backToLobby,
  castVote,
  createRoom,
  getVoteCounts,
  joinRoom,
  leaveRoom,
  startCountdown,
  typeInRoom,
  updateSettings,
  type Room,
} from "./room";

/** Anna (Host) and Bob racing on "ab" since t = 3 s. */
function racingRoom(): Room {
  return advanceClock(
    startCountdown(roomWith("Anna", "Bob"), "p1", { text: "ab", nowMs: 0 }),
    3_000,
  );
}

function roomWith(...nicknames: string[]): Room {
  return nicknames.reduce(
    (room, nickname, index) =>
      joinRoom(room, { id: `p${index + 1}`, nickname }).room,
    createRoom(),
  );
}

describe("Room Matches", () => {
  it("lets only the Host start a countdown, with at least two Players", () => {
    const room = roomWith("Anna", "Bob");

    expect(startCountdown(room, "p2", { text: "ab", nowMs: 0 })).toBe(room);
    expect(
      startCountdown(roomWith("Anna"), "p1", { text: "ab", nowMs: 0 }).phase,
    ).toBe("lobby");

    const counting = startCountdown(room, "p1", { text: "ab", nowMs: 1_000 });
    expect(counting.phase).toBe("countdown");
    expect(counting.countdownEndsAtMs).toBe(4_000);
  });

  it("only starts Modes that can be played Online so far", () => {
    const room = updateSettings(roomWith("Anna", "Bob"), "p1", {
      mode: "crazyDarts",
    });

    expect(startCountdown(room, "p1", { text: "ab", nowMs: 0 })).toBe(room);
  });

  it("starts racing when the countdown ends", () => {
    let room = startCountdown(roomWith("Anna", "Bob"), "p1", {
      text: "ab",
      nowMs: 0,
    });

    expect(advanceClock(room, 2_999).phase).toBe("countdown");

    room = advanceClock(room, 3_000);
    expect(room.phase).toBe("racing");
    expect(room.race?.startedAtMs).toBe(3_000);
    expect(room.race?.entries.map((entry) => entry.playerId)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("ignores keystrokes until the race has started", () => {
    const counting = startCountdown(roomWith("Anna", "Bob"), "p1", {
      text: "ab",
      nowMs: 0,
    });

    expect(typeInRoom(counting, "p1", "a", 1_000)).toBe(counting);
  });

  it("shows results once everyone has finished, and resets the Votes", () => {
    let room = castVote(roomWith("Anna", "Bob"), "p2", { mode: "timeTrial" });
    room = advanceClock(
      startCountdown(room, "p1", { text: "ab", nowMs: 0 }),
      3_000,
    );

    for (const [player, key, at] of [
      ["p1", "a", 4_000],
      ["p1", "b", 5_000],
      ["p2", "a", 4_500],
    ] as const) {
      room = typeInRoom(room, player, key, at);
    }
    expect(room.phase).toBe("racing");

    room = typeInRoom(room, "p2", "b", 6_000);
    expect(room.phase).toBe("results");
    expect(getVoteCounts(room).mode.timeTrial).toBe(0);
  });

  it("shows results when the grace period after the first finish runs out", () => {
    let room = racingRoom();
    room = typeInRoom(room, "p1", "a", 4_000);
    room = typeInRoom(room, "p1", "b", 5_000);

    expect(advanceClock(room, 64_999).phase).toBe("racing");
    expect(advanceClock(room, 65_000).phase).toBe("results");
  });

  it("drops a Player who leaves mid-race", () => {
    let room = racingRoom();
    room = typeInRoom(room, "p1", "a", 4_000);
    room = typeInRoom(room, "p1", "b", 5_000);

    room = leaveRoom(room, "p2");

    expect(room.race?.entries[1]?.dropped).toBe(true);
    expect(room.phase).toBe("results");
  });

  it("makes late joiners Spectators until the Host goes back to the lobby", () => {
    let room = racingRoom();
    room = joinRoom(room, { id: "p3", nickname: "Cas" }).room;
    expect(room.players[2]?.spectator).toBe(true);

    room = typeInRoom(room, "p3", "a", 4_000);
    expect(room.race?.entries).toHaveLength(2);

    room = typeInRoom(room, "p1", "a", 4_000);
    room = typeInRoom(room, "p1", "b", 5_000);
    room = leaveRoom(room, "p2"); // Anna finished and Bob left → results
    expect(room.phase).toBe("results");
    expect(backToLobby(room, "p3")).toBe(room); // only the Host

    room = backToLobby(room, "p1");
    expect(room.phase).toBe("lobby");
    expect(room.race).toBeNull();
    expect(room.players.map((player) => player.spectator)).toEqual([
      false,
      false,
    ]);
  });
});
