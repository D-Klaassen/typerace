"use client";

import type { RoomView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import {
  TypingAids,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";
import { RacingTrack, typingCar } from "@/components/racing-theme/racing-track";
import { HotSeatStandings } from "@/components/shared-keyboard/hot-seat-standings";
import { formatClock } from "@/components/typing/format-clock";
import { TypingText } from "@/components/typing/typing-text";
import { useNow } from "@/components/typing/use-now";
import { useTyping } from "@/components/typing/use-typing";
import { cn } from "@/lib/utils";

type HotSeatView = NonNullable<RoomView["hotSeat"]>;
type Turn = NonNullable<HotSeatView["turn"]>;

/** An Online Hot Seat: type on your Turn, watch the others on theirs. */
export function OnlineHotSeat({
  hotSeat,
  you,
  nicknames,
  clockOffsetMs,
  display,
  onKey,
}: {
  hotSeat: HotSeatView;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
  display: DisplayPreferences;
  onKey: (key: string) => void;
}) {
  const { seat, turn } = hotSeat;
  const nameOf = (id: string) => nicknames[id] ?? "?";
  // A new key per Turn gives every Turn a fresh typing session.
  const turnKey = `${seat.turnsTaken}-${seat.eliminated.length}`;
  // The Player's place in the Room gives their car its colour and lane.
  const carSeat = Math.max(
    0,
    seat.players.findIndex((player) => player.name === seat.currentPlayer),
  );

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {turn &&
        (seat.currentPlayer === you ? (
          <MyTurn
            key={turnKey}
            turn={turn}
            you={you}
            seat={carSeat}
            display={display}
            onKey={onKey}
          />
        ) : (
          <WatchTurn
            key={turnKey}
            turn={turn}
            playerId={seat.currentPlayer ?? ""}
            player={nameOf(seat.currentPlayer ?? "")}
            seat={carSeat}
            clockOffsetMs={clockOffsetMs}
            racingTheme={display.racingTheme}
          />
        ))}
      <HotSeatStandings seat={seat} nameOf={nameOf} />
    </div>
  );
}

function MyTurn({
  turn,
  you,
  seat,
  display,
  onKey,
}: {
  turn: Turn;
  you: string;
  seat: number;
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
      {display.racingTheme && (
        <RacingTrack
          cars={[typingCar(session, { id: you, name: "", isYou: true, seat })]}
          textLength={turn.text.length}
        />
      )}
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
  playerId,
  player,
  seat,
  clockOffsetMs,
  racingTheme,
}: {
  turn: Turn;
  playerId: string;
  player: string;
  seat: number;
  clockOffsetMs: number;
  racingTheme: boolean;
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
      {racingTheme && (
        <RacingTrack
          cars={[
            typingCar(
              { ...turn, finished: turn.position === turn.text.length },
              { id: playerId, name: player, seat },
            ),
          ]}
          textLength={turn.text.length}
        />
      )}
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
