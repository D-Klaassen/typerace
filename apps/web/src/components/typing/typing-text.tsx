import { getKeyGuide, type Finger, type TypingSession } from "@typerace/game";
import { fingerColors } from "@/components/finger-guide/finger-colors";
import { cn } from "@/lib/utils";

/** Runs of characters typed by the same finger, so each run is one span. */
function fingerRuns(text: string): { text: string; finger?: Finger }[] {
  const runs: { text: string; finger?: Finger }[] = [];
  for (const char of text) {
    const finger = getKeyGuide(char)?.finger;
    const last = runs.at(-1);
    if (last && last.finger === finger) {
      last.text += char;
    } else {
      runs.push({ text: char, finger });
    }
  }

  return runs;
}

/**
 * The text being typed: done characters dimmed, the next one marked. With
 * `coloredText`, the characters still to type are in their finger's colour.
 */
export function TypingText({
  session,
  coloredText = false,
}: {
  session: Pick<TypingSession, "text" | "position" | "inError">;
  coloredText?: boolean;
}) {
  const { text, position, inError } = session;
  const next = text[position];
  const nextFinger =
    coloredText && next !== undefined ? getKeyGuide(next)?.finger : undefined;
  const rest = text.slice(position + 1);

  return (
    <p
      className="font-mono text-2xl leading-relaxed tracking-wide break-words whitespace-pre-wrap"
      data-typing-text
    >
      <span className="text-muted-foreground">{text.slice(0, position)}</span>
      {next !== undefined && (
        <span
          className={cn(
            "rounded-sm underline decoration-2 underline-offset-4",
            inError
              ? "bg-destructive/20 text-destructive decoration-destructive"
              : ["bg-primary/10", nextFinger && fingerColors(nextFinger).text],
          )}
          data-finger={nextFinger}
        >
          {next}
        </span>
      )}
      {coloredText ? (
        fingerRuns(rest).map((run, index) => (
          <span
            key={index}
            className={run.finger && fingerColors(run.finger).text}
            data-finger={run.finger}
          >
            {run.text}
          </span>
        ))
      ) : (
        <span>{rest}</span>
      )}
    </p>
  );
}
