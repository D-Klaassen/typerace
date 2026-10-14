import type { Difficulty } from "@typerace/game";

export type SharedKeyboardMode = "classicRace" | "timeTrial";

export type TextLength = "short" | "medium" | "long";

export interface SharedKeyboardPlayer {
  name: string;
  /** Whether this Player's Turns show the Finger Guide. */
  fingerGuide: boolean;
}

export interface SharedKeyboardSettings {
  mode: SharedKeyboardMode;
  players: SharedKeyboardPlayer[];
  difficulty: Difficulty;
  /** Classic Race only. */
  textLength: TextLength;
  /** Time Trial only. */
  timeBankMs: number;
}

/** Characters of Gibberish per Classic Race text (see docs/spec.md). */
export const TEXT_LENGTHS: Record<TextLength, number> = {
  short: 100,
  medium: 250,
  long: 500,
};

/** Characters of Gibberish per Time Trial Turn (see docs/spec.md). */
export const TIME_TRIAL_TURN_LENGTH = 150;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const DEFAULT_SETTINGS: SharedKeyboardSettings = {
  mode: "classicRace",
  players: [
    { name: "", fingerGuide: false },
    { name: "", fingerGuide: false },
  ],
  difficulty: "medium",
  textLength: "medium",
  timeBankMs: 120_000,
};
