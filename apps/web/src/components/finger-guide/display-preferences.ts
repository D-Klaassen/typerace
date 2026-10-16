/** What a Player wants to see while typing. */
export interface DisplayPreferences {
  /** The hands, with the finger (and Shift pinky) to use lit up. */
  fingerGuide: boolean;
  /** The keyboard, with the next key (and Shift) lit up. */
  keyboard: boolean;
  /** The text still to type, each character in its finger's colour. */
  coloredText: boolean;
  /** Classic Race and Hot Seat as cars on a circuit (see CONTEXT.md: Racing Theme). */
  racingTheme: boolean;
}

/** A Player's starting point: only the Finger Guide on. */
export const DEFAULT_DISPLAY: DisplayPreferences = {
  fingerGuide: true,
  keyboard: false,
  coloredText: false,
  racingTheme: false,
};

/** For people who watch rather than type, such as Spectators. */
export const NO_DISPLAY_AIDS: DisplayPreferences = {
  fingerGuide: false,
  keyboard: false,
  coloredText: false,
  racingTheme: false,
};
