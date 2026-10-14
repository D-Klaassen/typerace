import { describe, expect, it } from "vitest";
import {
  dropFromDarts,
  getCrazyDartsResults,
  startCrazyDarts,
  typeInDarts,
  type CrazyDarts,
} from "./crazy-darts";

const NOT_RANDOM = () => 0;

function start(players: string[], text: string, startingHp = 100): CrazyDarts {
  return startCrazyDarts({
    players,
    text,
    startingHp,
    dartDamagePerCharacter: 1,
    typoHp: 2,
  });
}

function type(
  match: CrazyDarts,
  playerId: string,
  keys: string,
  random = NOT_RANDOM,
): CrazyDarts {
  return [...keys].reduce(
    (current, key, index) => typeInDarts(current, playerId, key, index, random),
    match,
  );
}

function hp(match: CrazyDarts): Record<string, number> {
  return Object.fromEntries(
    match.players.map((player) => [player.playerId, player.hp]),
  );
}

describe("Crazy Darts", () => {
  it("throws a Dart worth the word's length when its last character is typed", () => {
    let match = start(["a", "b"], "abcd ef");

    match = type(match, "a", "abc");
    expect(hp(match)).toEqual({ a: 100, b: 100 });

    match = type(match, "a", "d");
    expect(hp(match)).toEqual({ a: 100, b: 96 });
    expect(match.darts).toEqual([
      { id: 0, from: "a", to: "b", damage: 4, atMs: 0 },
    ]);
  });

  it("aims at the opponent with the most HP and never at the thrower", () => {
    let match = start(["a", "b", "c"], "ab cd ef gh");
    match = type(match, "c", "ab"); // hits a (tie, first pick)
    expect(hp(match)).toEqual({ a: 98, b: 100, c: 100 });

    match = type(match, "b", "ab"); // b leads with c; hits c, not itself
    expect(hp(match)).toEqual({ a: 98, b: 100, c: 98 });
  });

  it("picks at random between opponents tied for the most HP", () => {
    const match = start(["a", "b", "c"], "ab cd");
    const lastPick = () => 0.99;

    expect(hp(type(match, "a", "ab", lastPick))).toEqual({
      a: 100,
      b: 100,
      c: 98,
    });
  });

  it("costs the typist HP for every Typo, which can knock them out", () => {
    let match = start(["a", "b"], "ab cd", 4);

    match = type(match, "a", "x");
    expect(hp(match)).toEqual({ a: 2, b: 4 });

    match = type(match, "a", "x");
    expect(match.players[0]).toMatchObject({ hp: 0, out: true });
    expect(match.winner).toBe("b");
  });

  it("ignores Players who are out and puts leavers out", () => {
    let match = start(["a", "b", "c"], "ab cd", 2);
    match = type(match, "a", "ab"); // b out (tie → first pick)
    expect(match.players[1]).toMatchObject({ hp: 0, out: true });

    const before = match;
    expect(type(match, "b", "cd")).toEqual(before);

    match = dropFromDarts(match, "c");
    expect(match.outOrder).toEqual(["b", "c"]);
    expect(match.winner).toBe("a");
  });

  it("ranks the winner first, then in reverse order of going out", () => {
    let match = start(["a", "b", "c"], "abc de", 3);
    match = type(match, "a", "x"); // Typo: a 1 HP
    match = type(match, "b", "abc"); // b hits c (3 HP > a's 1): c out
    match = dropFromDarts(match, "a");

    const results = getCrazyDartsResults(match);

    expect(results.map((result) => result.playerId)).toEqual(["b", "a", "c"]);
    expect(results[0]).toMatchObject({ hp: 3, damageDealt: 3, typos: 0 });
    expect(results[1]).toMatchObject({ hp: 0, damageDealt: 0, typos: 1 });
  });
});
