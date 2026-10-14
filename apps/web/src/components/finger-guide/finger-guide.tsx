import { getKeyGuide } from "@typerace/game";
import { Hands } from "./hands";
import { OnScreenKeyboard } from "./on-screen-keyboard";

/** Shows which key and finger (and which Shift) should type `nextChar`. */
export function FingerGuide({ nextChar }: { nextChar: string | undefined }) {
  const guide = nextChar === undefined ? null : getKeyGuide(nextChar);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-4"
      data-testid="finger-guide"
    >
      <OnScreenKeyboard guide={guide} />
      <Hands guide={guide} />
    </div>
  );
}
