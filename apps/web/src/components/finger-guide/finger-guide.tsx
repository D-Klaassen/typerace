import { getKeyGuide } from "@typerace/game";
import { Hands } from "./hands";
import type { DisplayPreferences } from "./display-preferences";
import { OnScreenKeyboard } from "./on-screen-keyboard";

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
