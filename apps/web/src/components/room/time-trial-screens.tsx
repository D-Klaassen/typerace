"use client";

import type { RoomView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import {
  TypingAids,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";
import { TimeTrialStandings } from "@/components/shared-keyboard/time-trial-standings";
import { formatClock } from "@/components/typing/format-clock";
import { TypingText } from "@/components/typing/typing-text";
import { useNow } from "@/components/typing/use-now";
import { useTyping } from "@/components/typing/use-typing";
import { cn } from "@/lib/utils";

type TimeTrialView = NonNullable<RoomView["timeTrial"]>;
type Turn = NonNullable<TimeTrialView["turn"]>;

/** An Online Time Trial: type on your Turn, watch the others on theirs. */
export function OnlineTimeTrial({
  timeTrial,
  you,
  nicknames,
  clockOffsetMs,
  display,
  onKey,
}: {
  timeTrial: TimeTrialView;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
  display: DisplayPreferences;
  onKey: (key: string) => void;
}) {
  const { trial, turn } = timeTrial;
  const nameOf = (id: string) => nicknames[id] ?? "?";
  // A new key per Turn gives every Turn a fresh typing session.
  const turnKey = `${trial.turnsTaken}-${trial.eliminated.length}`;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {turn &&
        (trial.currentPlayer === you ? (
          <MyTurn key={turnKey} turn={turn} display={display} onKey={onKey} />
        ) : (
          <WatchTurn
            turn={turn}
            player={nameOf(trial.currentPlayer ?? "")}
            clockOffsetMs={clockOffsetMs}
          />
        ))}
      <TimeTrialStandings trial={trial} nameOf={nameOf} />
    </div>
  );
}

function MyTurn({
  turn,
  display,
  onKey,
}: {
  turn: Turn;
  display: DisplayPreferences;
  onKey: (key: string) => void;
}) {
  const t = useTranslations("Room");
  const { session } = useTyping(turn.text, () => {}, onKey);
  const now = useNow(() => performance.now());
  const elapsedMs =
    session.firstKeyAtMs === null || now === null
      ? 0
      : now - session.firstKeyAtMs;

  return (
    <>
      <TurnHeader
        title={t("yourTurn")}
        remainingMs={turn.timeBankMs - elapsedMs}
      />
      {session.finished ? (
        <p className="text-center text-lg font-medium" role="status">
          {t("turnDone")}
        </p>
      ) : (
        <TypingText session={session} />
      )}
      {!session.finished && (
        <TypingAids nextChar={turn.text[session.position]} display={display} />
      )}
    </>
  );
}

function WatchTurn({
  turn,
  player,
  clockOffsetMs,
}: {
  turn: Turn;
  player: string;
  clockOffsetMs: number;
}) {
  const t = useTranslations("Room");
  const roomNow = useNow(() => Date.now() + clockOffsetMs);
  const elapsedMs =
    turn.firstKeyAtMs === null || roomNow === null
      ? 0
      : roomNow - turn.firstKeyAtMs;

  return (
    <>
      <TurnHeader
        title={t("theirTurn", { name: player })}
        remainingMs={turn.timeBankMs - elapsedMs}
      />
      <TypingText session={turn} />
    </>
  );
}

function TurnHeader({
  title,
  remainingMs,
}: {
  title: string;
  remainingMs: number;
}) {
  const t = useTranslations("Room");
  const clamped = Math.max(0, remainingMs);

  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div
        className={cn(
          "font-mono text-3xl tabular-nums",
          clamped < 10_000 && "text-destructive",
        )}
        aria-label={t("timeBank")}
      >
        {formatClock(Math.ceil(clamped / 1000))}
      </div>
    </div>
  );
}
