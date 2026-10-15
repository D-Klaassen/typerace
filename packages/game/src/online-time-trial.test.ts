import { describe, expect, it } from "vitest";
import {
  advanceTimeTrial,
  dropFromTimeTrial,
  startOnlineTimeTrial,
  typeInTimeTrial,
  type OnlineTimeTrial,
} from "./online-time-trial";

function start(): OnlineTimeTrial {
  return startOnlineTimeTrial({
    players: ["a", "b"],
    timeBankMs: 60_000,
    keySet: { keys: "abcdefghijklmnopqrstuvwxyz", capitals: false },
    seed: 7,
  });
}

/** The current Player types their whole Turn, one key per `msPerKey`. */
function typeTurn(
  match: OnlineTimeTrial,
  fromMs: number,
  msPerKey: number,
): OnlineTimeTrial {
  const player = match.trial.currentPlayer!;
  const text = match.turn!.text;

  return [...text].reduce(
    (current, key, index) =>
      typeInTimeTrial(current, player, key, fromMs + index * msPerKey),
    match,
  );
}

describe("Online Time Trial", () => {
  it("only lets the Player whose Turn it is type", () => {
    let match = start();
    const firstKey = match.turn!.text[0]!;

    match = typeInTimeTrial(match, "b", firstKey, 1_000);
    expect(match.turn?.position).toBe(0);

    match = typeInTimeTrial(match, "a", firstKey, 1_000);
    expect(match.turn?.position).toBe(1);
  });

  it("ends the Turn when the text is done and gives the next Player fresh text", () => {
    let match = start();
    const firstText = match.turn!.text;

    match = typeTurn(match, 1_000, 100);

    expect(match.trial.currentPlayer).toBe("b");
    expect(match.turn?.text).not.toBe(firstText);
    expect(match.turn?.position).toBe(0);
    expect(match.trial.players[0]?.bestTimeMs).toBe(
      (firstText.length - 1) * 100,
    );
  });

  it("eliminates the Player whose Time Bank runs out on the Room's clock", () => {
    let match = start();
    match = typeTurn(match, 1_000, 100); // Anna done
    const bobsFirstKey = match.turn!.text[0]!;
    match = typeInTimeTrial(match, "b", bobsFirstKey, 20_000);

    expect(advanceTimeTrial(match, 79_999).trial.winner).toBeNull();

    match = advanceTimeTrial(match, 80_000);
    expect(match.trial.winner).toBe("a");
    expect(match.turn).toBeNull();
  });

  it("doesn't drain the Time Bank before the first keystroke", () => {
    const match = start();

    expect(advanceTimeTrial(match, 10 * 60_000)).toBe(match);
  });

  it("eliminates a Player who leaves, during their Turn or not", () => {
    const three = startOnlineTimeTrial({
      players: ["a", "b", "c"],
      timeBankMs: 60_000,
      keySet: { keys: "asdfghjkl;", capitals: false },
      seed: 1,
    });

    let match = dropFromTimeTrial(three, "a");
    expect(match.trial.eliminated).toEqual(["a"]);
    expect(match.trial.currentPlayer).toBe("b");

    match = dropFromTimeTrial(match, "c");
    expect(match.trial.winner).toBe("b");
  });
});
