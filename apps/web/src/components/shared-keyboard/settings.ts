import type { Difficulty } from "@typerace/game";

export interface SharedKeyboardPlayer {
  name: string;
  /** Whether this Player's Turns show the Finger Guide. */
  fingerGuide: boolean;
}

export interface SharedKeyboardSettings {
  players: SharedKeyboardPlayer[];
  difficulty: Difficulty;
  timeBankMs: number;
}

/** Characters of Gibberish per Turn (see docs/spec.md). */
export const TURN_LENGTH = 150;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const DEFAULT_SETTINGS: SharedKeyboardSettings = {
  players: [
    { name: "", fingerGuide: false },
    { name: "", fingerGuide: false },
  ],
  difficulty: "medium",
  timeBankMs: 120_000,
};
