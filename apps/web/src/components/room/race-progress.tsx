import type { RacerView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Everyone's progress through the text, as bars. */
export function RaceProgress({
  racers,
  textLength,
  nicknames,
  you,
  ownPosition,
}: {
  racers: RacerView[];
  textLength: number;
  nicknames: Record<string, string>;
  you: string;
  /** Our own position from local typing, ahead of the Room's view. */
  ownPosition?: number;
}) {
  const t = useTranslations("Room");

  return (
    <ul className="flex flex-col gap-2" aria-label={t("progressLabel")}>
      {racers.map((racer) => {
        const position =
          racer.playerId === you && ownPosition !== undefined
            ? ownPosition
            : racer.position;

        return (
          <li
            key={racer.playerId}
            className={cn(
              "grid grid-cols-[8rem_1fr] items-center gap-3",
              racer.dropped && "opacity-50",
            )}
          >
            <span
              className={cn(
                "truncate text-sm",
                racer.playerId === you && "font-semibold",
              )}
            >
              {nicknames[racer.playerId] ?? "?"}
            </span>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-[width]",
                  racer.finished ? "bg-emerald-500" : "bg-primary",
                )}
                style={{ width: `${(position / textLength) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
