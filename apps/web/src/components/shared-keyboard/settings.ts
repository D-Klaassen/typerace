import { DEFAULT_KEY_SET_CHOICE, type KeySetChoice } from "@typerace/game";
import {
  DEFAULT_DISPLAY,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";

export type SharedKeyboardMode = "classicRace" | "timeTrial";

export type TextLength = "short" | "medium" | "long";

export interface SharedKeyboardPlayer {
  name: string;
  /** What this Player sees during their Turns. */
  display: DisplayPreferences;
}

export interface SharedKeyboardSettings {
  mode: SharedKeyboardMode;
  players: SharedKeyboardPlayer[];
  keySet: KeySetChoice;
  capitals: boolean;
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
    { name: "", display: DEFAULT_DISPLAY },
    { name: "", display: DEFAULT_DISPLAY },
  ],
  keySet: DEFAULT_KEY_SET_CHOICE,
  capitals: false,
  textLength: "medium",
  timeBankMs: 120_000,
};
