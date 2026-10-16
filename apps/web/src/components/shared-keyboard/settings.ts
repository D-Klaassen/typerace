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
} from "@/components/finger-guide/display-preferences";

export type SharedKeyboardMode = "classicRace" | "hotSeat";

export interface SharedKeyboardPlayer {
  name: string;
}

export interface SharedKeyboardSettings {
  mode: SharedKeyboardMode;
  players: SharedKeyboardPlayer[];
  /** What every Player sees during their Turns. */
  display: DisplayPreferences;
  textSource: TextSourceKind;
  /** Words and Sentences only. */
  language: Language;
  /** Gibberish only. */
  keySet: KeySetChoice;
  capitals: boolean;
  /** Classic Race only. */
  textLength: TextLength;
  /** Hot Seat only. */
  timeBankMs: number;
}

/** A Classic Race can be played alone; Hot Seat is offered from `MIN_HOT_SEAT_PLAYERS`. */
export const MIN_PLAYERS = 1;
export const MIN_HOT_SEAT_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const DEFAULT_SETTINGS: SharedKeyboardSettings = {
  mode: "classicRace",
  players: [{ name: "" }],
  display: DEFAULT_DISPLAY,
  textSource: "gibberish",
  language: "en",
  keySet: DEFAULT_KEY_SET_CHOICE,
  capitals: false,
  textLength: "medium",
  timeBankMs: 120_000,
};
