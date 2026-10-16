import { describe, expect, it } from "vitest";
import {
  advanceHotSeat,
  dropFromHotSeat,
  startOnlineHotSeat,
  typeInHotSeat,
  type OnlineHotSeat,
} from "./online-hot-seat";

function start(): OnlineHotSeat {
  return startOnlineHotSeat({
    players: ["a", "b"],
    timeBankMs: 60_000,
    textSource: {
      kind: "gibberish",
      keySet: { keys: "abcdefghijklmnopqrstuvwxyz", capitals: false },
    },
    seed: 7,
  });
}

/** The current Player types their whole Turn, one key per `msPerKey`. */
function typeTurn(
  match: OnlineHotSeat,
  fromMs: number,
  msPerKey: number,
): OnlineHotSeat {
  const player = match.seat.currentPlayer!;
  const text = match.turn!.text;

  return [...text].reduce(
    (current, key, index) =>
      typeInHotSeat(current, player, key, fromMs + index * msPerKey),
    match,
  );
}

describe("Online Hot Seat", () => {
  it("only lets the Player whose Turn it is type", () => {
    let match = start();
    const firstKey = match.turn!.text[0]!;

    match = typeInHotSeat(match, "b", firstKey, 1_000);
    expect(match.turn?.position).toBe(0);

    match = typeInHotSeat(match, "a", firstKey, 1_000);
    expect(match.turn?.position).toBe(1);
  });

  it("ends the Turn when the text is done and gives the next Player fresh text", () => {
    let match = start();
    const firstText = match.turn!.text;

    match = typeTurn(match, 1_000, 100);

    expect(match.seat.currentPlayer).toBe("b");
    expect(match.turn?.text).not.toBe(firstText);
    expect(match.turn?.position).toBe(0);
    expect(match.seat.players[0]?.bestTimeMs).toBe(
      (firstText.length - 1) * 100,
    );
  });

  it("eliminates the Player whose Time Bank runs out on the Room's clock", () => {
    let match = start();
    match = typeTurn(match, 1_000, 100); // Anna done
    const bobsFirstKey = match.turn!.text[0]!;
    match = typeInHotSeat(match, "b", bobsFirstKey, 20_000);

    expect(advanceHotSeat(match, 79_999).seat.winner).toBeNull();

    match = advanceHotSeat(match, 80_000);
    expect(match.seat.winner).toBe("a");
    expect(match.turn).toBeNull();
  });

  it("doesn't drain the Time Bank before the first keystroke", () => {
    const match = start();

    expect(advanceHotSeat(match, 10 * 60_000)).toBe(match);
  });

  it("eliminates a Player who leaves, during their Turn or not", () => {
    const three = startOnlineHotSeat({
      players: ["a", "b", "c"],
      timeBankMs: 60_000,
      textSource: { kind: "words", language: "nl" },
      seed: 1,
    });

    let match = dropFromHotSeat(three, "a");
    expect(match.seat.eliminated).toEqual(["a"]);
    expect(match.seat.currentPlayer).toBe("b");

    match = dropFromHotSeat(match, "c");
    expect(match.seat.winner).toBe("b");
  });
});
