import { getKeyGuide } from "@typerace/game";
import { Hands } from "./hands";
import { OnScreenKeyboard } from "./on-screen-keyboard";

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

/** The On-screen Keyboard and/or Finger Guide for typing `nextChar`. */
export function TypingAids({
  nextChar,
  display,
}: {
  nextChar: string | undefined;
  display: DisplayPreferences;
}) {
  if (!display.fingerGuide && !display.keyboard) {
    return null;
  }
  const guide = nextChar === undefined ? null : getKeyGuide(nextChar);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {display.keyboard && (
        <div data-testid="on-screen-keyboard">
          <OnScreenKeyboard guide={guide} />
        </div>
      )}
      {display.fingerGuide && (
        <div data-testid="finger-guide">
          <Hands guide={guide} />
        </div>
      )}
    </div>
  );
}
