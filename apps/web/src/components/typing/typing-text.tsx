import type { TypingSession } from "@typerace/game";
import { cn } from "@/lib/utils";

/** The text being typed: done characters dimmed, the next one marked. */
export function TypingText({ session }: { session: TypingSession }) {
  const { text, position, inError } = session;

  return (
    <p
      className="font-mono text-2xl leading-relaxed tracking-wide break-words whitespace-pre-wrap"
      data-typing-text
    >
      <span className="text-muted-foreground">{text.slice(0, position)}</span>
      {position < text.length && (
        <span
          className={cn(
            "rounded-sm underline decoration-2 underline-offset-4",
            inError
              ? "bg-destructive/20 text-destructive decoration-destructive"
              : "bg-primary/10",
          )}
        >
          {text[position]}
        </span>
      )}
      <span>{text.slice(position + 1)}</span>
    </p>
  );
}
