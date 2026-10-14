"use client";

import { crazyDartsText } from "@typerace/game";
import type { RoomView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FingerGuide } from "@/components/finger-guide/finger-guide";
import { TypingText } from "@/components/typing/typing-text";
import { useNow } from "@/components/typing/use-now";
import { useTyping } from "@/components/typing/use-typing";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DartsView = NonNullable<RoomView["darts"]>;

/** How long a hit Player's card stays highlighted. */
const HIT_FLASH_MS = 600;
/** Characters of the endless text shown around the next one. */
const WINDOW_BEFORE = 40;
const WINDOW_LENGTH = 240;

/** Crazy Darts: type to throw Darts; Spectators get the board only. */
export function CrazyDartsMatch({
  darts,
  startingHp,
  you,
  nicknames,
  clockOffsetMs,
  onKey,
}: {
  darts: DartsView;
  startingHp: number;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
  /** Absent for Spectators. */
  onKey?: (key: string) => void;
}) {
  const t = useTranslations("Room");
  const me = darts.players.find((player) => player.playerId === you);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <DartsBoard
        darts={darts}
        startingHp={startingHp}
        you={you}
        nicknames={nicknames}
        clockOffsetMs={clockOffsetMs}
      />
      {me && onKey ? (
        me.out ? (
          <p className="text-center text-lg font-medium" role="status">
            {t("youAreOut")}
          </p>
        ) : (
          <DartsTyping darts={darts} onKey={onKey} />
        )
      ) : null}
    </div>
  );
}

function DartsTyping({
  darts,
  onKey,
}: {
  darts: DartsView;
  onKey: (key: string) => void;
}) {
  const t = useTranslations("Room");
  const [fingerGuide, setFingerGuide] = useState(false);
  const text = crazyDartsText(darts.textSeed, darts.difficulty);
  const { session } = useTyping(text, () => {}, onKey);

  // Show a window of the long text around the next character.
  const start = Math.max(
    0,
    text.lastIndexOf(" ", session.position - WINDOW_BEFORE) + 1,
  );
  const visible = {
    text: text.slice(start, start + WINDOW_LENGTH),
    position: session.position - start,
    inError: session.inError,
  };

  return (
    <>
      <TypingText session={visible} />
      <Label className="gap-2 self-start font-normal">
        <Checkbox
          checked={fingerGuide}
          onCheckedChange={(checked) => setFingerGuide(checked)}
        />
        {t("fingerGuide")}
      </Label>
      {fingerGuide && <FingerGuide nextChar={text[session.position]} />}
    </>
  );
}

function DartsBoard({
  darts,
  startingHp,
  you,
  nicknames,
  clockOffsetMs,
}: {
  darts: DartsView;
  startingHp: number;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
}) {
  const t = useTranslations("Room");
  const roomNow = useNow(() => Date.now() + clockOffsetMs) ?? 0;
  const nameOf = (id: string) => nicknames[id] ?? "?";
  const recentlyHit = new Set(
    darts.recentDarts
      .filter((dart) => roomNow - dart.atMs < HIT_FLASH_MS)
      .map((dart) => dart.to),
  );

  return (
    <div className="flex flex-col gap-4">
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        aria-label={t("hpLabel")}
      >
        {darts.players.map((player) => (
          <li
            key={player.playerId}
            data-hit={recentlyHit.has(player.playerId) || undefined}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
              player.out && "opacity-40",
              recentlyHit.has(player.playerId) &&
                "border-destructive bg-destructive/10",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "truncate",
                  player.playerId === you && "font-semibold",
                )}
              >
                {nameOf(player.playerId)}
              </span>
              <span className="font-mono text-sm tabular-nums">
                {player.out ? t("out") : t("hp", { hp: player.hp })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-[width]"
                style={{
                  width: `${Math.max(0, player.hp / startingHp) * 100}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <ol
        className="flex min-h-6 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
        aria-label={t("dartsLabel")}
      >
        {darts.recentDarts
          .slice(-4)
          .reverse()
          .map((dart) => (
            <li key={dart.id}>
              {t("dartLine", {
                from: nameOf(dart.from),
                to: nameOf(dart.to),
                damage: dart.damage,
              })}
            </li>
          ))}
      </ol>
    </div>
  );
}
