import {
  DEFAULT_KEY_SET_CHOICE,
  type KeySetChoice,
  type Language,
  type TextLength,
  type TextSourceKind,
} from "@typerace/game";
import {
  DEFAULT_DISPLAY,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";

export type SharedKeyboardMode = "classicRace" | "timeTrial";

export interface SharedKeyboardPlayer {
  name: string;
  /** What this Player sees during their Turns. */
  display: DisplayPreferences;
}

export interface SharedKeyboardSettings {
  mode: SharedKeyboardMode;
  players: SharedKeyboardPlayer[];
  textSource: TextSourceKind;
  /** Words and Sentences only. */
  language: Language;
  /** Gibberish only. */
  keySet: KeySetChoice;
  capitals: boolean;
  /** Classic Race only. */
  textLength: TextLength;
  /** Time Trial only. */
  timeBankMs: number;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const DEFAULT_SETTINGS: SharedKeyboardSettings = {
  mode: "classicRace",
  players: [
    { name: "", display: DEFAULT_DISPLAY },
    { name: "", display: DEFAULT_DISPLAY },
  ],
  textSource: "gibberish",
  language: "en",
  keySet: DEFAULT_KEY_SET_CHOICE,
  capitals: false,
  textLength: "medium",
  timeBankMs: 120_000,
};
