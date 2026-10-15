import { getKeyGuide } from "@typerace/game";
import { Hands } from "./hands";
import { OnScreenKeyboard } from "./on-screen-keyboard";

/** What a Player wants to see while typing. Both are off by default. */
export interface DisplayPreferences {
  /** The hands, with the finger (and Shift pinky) to use lit up. */
  fingerGuide: boolean;
  /** The keyboard, with the next key (and Shift) lit up. */
  keyboard: boolean;
}

export const NO_DISPLAY_AIDS: DisplayPreferences = {
  fingerGuide: false,
  keyboard: false,
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
