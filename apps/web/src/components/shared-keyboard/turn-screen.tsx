"use client";

import type { TypingStats } from "@typerace/game";
import { getStats } from "@typerace/game";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import {
  TypingAids,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";
import { RacingTrack } from "@/components/racing-theme/racing-track";
import { formatClock } from "@/components/typing/format-clock";
import { TypingText } from "@/components/typing/typing-text";
import { useTyping } from "@/components/typing/use-typing";
import { cn } from "@/lib/utils";

/**
 * One Player's Turn. With a Time Bank the clock counts down and the Turn ends
 * when it runs out; without one it is a stopwatch.
 */
export function TurnScreen({
  player,
  text,
  timeBankMs,
  display,
  onComplete,
  onRunOutOfTime,
}: {
  player: string;
  text: string;
  timeBankMs: number | null;
  display: DisplayPreferences;
  onComplete: (stats: TypingStats) => void;
  onRunOutOfTime?: (stats: TypingStats) => void;
}) {
  const t = useTranslations("SharedKeyboard.Turn");
  const { session, sessionRef } = useTyping(text, onComplete);
  const [now, setNow] = useState<number | null>(null);

  const tick = useEffectEvent((time: number) => {
    const startedAt = sessionRef.current.firstKeyAtMs;
    if (
      timeBankMs !== null &&
      startedAt !== null &&
      time - startedAt >= timeBankMs
    ) {
      onRunOutOfTime?.({
        ...getStats(sessionRef.current),
        timeMs: timeBankMs,
      });
      return false;
    }
    setNow(time);
    return true;
  });

  useEffect(() => {
    let frame = requestAnimationFrame(function loop(time) {
      if (tick(time)) {
        frame = requestAnimationFrame(loop);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const elapsedMs =
    session.firstKeyAtMs === null || now === null
      ? 0
      : Math.max(0, now - session.firstKeyAtMs);
  const remainingMs =
    timeBankMs === null ? null : Math.max(0, timeBankMs - elapsedMs);
  const progress = session.position / text.length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{player}</h2>
        {remainingMs === null ? (
          <div
            className="font-mono text-3xl tabular-nums"
            aria-label={t("stopwatch")}
          >
            {formatClock(Math.floor(elapsedMs / 1000))}
          </div>
        ) : (
          <div
            className={cn(
              "font-mono text-3xl tabular-nums",
              remainingMs < 10_000 && "text-destructive",
            )}
            aria-label={t("timeBank")}
          >
            {formatClock(Math.ceil(remainingMs / 1000))}
          </div>
        )}
      </div>
      {display.racingTheme ? (
        <RacingTrack
          cars={[
            {
              id: player,
              name: player,
              position: session.position,
              typosInARow: session.typosInARow,
              finished: session.finished,
              you: true,
            },
          ]}
          textLength={text.length}
        />
      ) : (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      <TypingText session={session} />
      <p className="text-sm text-muted-foreground tabular-nums">
        {t("progress", { typed: session.position, total: text.length })}
      </p>
      <TypingAids nextChar={text[session.position]} display={display} />
    </div>
  );
}
