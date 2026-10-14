"use client";

import type { TypingStats } from "@typerace/game";
import { getStats } from "@typerace/game";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import { FingerGuide } from "@/components/finger-guide/finger-guide";
import { TypingText } from "@/components/typing/typing-text";
import { useTyping } from "@/components/typing/use-typing";
import { cn } from "@/lib/utils";

/** One Player's Turn: type `text` before the Time Bank runs out. */
export function TurnScreen({
  player,
  text,
  timeBankMs,
  fingerGuide,
  onComplete,
  onRunOutOfTime,
}: {
  player: string;
  text: string;
  timeBankMs: number;
  fingerGuide: boolean;
  onComplete: (stats: TypingStats) => void;
  onRunOutOfTime: (stats: TypingStats) => void;
}) {
  const t = useTranslations("SharedKeyboard.Turn");
  const { session, sessionRef } = useTyping(text, onComplete);
  const [now, setNow] = useState<number | null>(null);

  const tick = useEffectEvent((time: number) => {
    const startedAt = sessionRef.current.firstKeyAtMs;
    if (startedAt !== null && time - startedAt >= timeBankMs) {
      onRunOutOfTime({ ...getStats(sessionRef.current), timeMs: timeBankMs });
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
  const remainingMs = Math.max(0, timeBankMs - elapsedMs);
  const progress = session.position / text.length;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{player}</h2>
        <div
          className={cn(
            "font-mono text-3xl tabular-nums",
            remainingMs < 10_000 && "text-destructive",
          )}
          aria-label={t("timeBank")}
        >
          {formatClock(remainingMs)}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <TypingText session={session} />
      <p className="text-sm text-muted-foreground tabular-nums">
        {t("progress", { typed: session.position, total: text.length })}
      </p>
      {fingerGuide && <FingerGuide nextChar={text[session.position]} />}
    </div>
  );
}

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
