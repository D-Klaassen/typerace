"use client";

import type { RoomView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FingerGuide } from "@/components/finger-guide/finger-guide";
import { TypingText } from "@/components/typing/typing-text";
import { useTyping } from "@/components/typing/use-typing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RaceProgress } from "./race-progress";
import { OnlineTimeTrial } from "./time-trial-screens";

type Race = NonNullable<RoomView["race"]>;

export function Countdown({
  endsAtMs,
  clockOffsetMs,
}: {
  endsAtMs: number;
  clockOffsetMs: number;
}) {
  const t = useTranslations("Room");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let frame = requestAnimationFrame(function loop() {
      setNow(Date.now() + clockOffsetMs);
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, [clockOffsetMs]);

  const seconds =
    now === null ? null : Math.max(1, Math.ceil((endsAtMs - now) / 1000));

  return (
    <div className="flex flex-col items-center gap-4" role="status">
      <p className="text-muted-foreground">{t("getReady")}</p>
      <p className="font-mono text-8xl font-bold tabular-nums">
        {seconds ?? ""}
      </p>
    </div>
  );
}

/** Our own typing during a race. Mount only while racing: it listens to the keyboard. */
export function RaceTyping({
  race,
  you,
  nicknames,
  onKey,
}: {
  race: Race;
  you: string;
  nicknames: Record<string, string>;
  onKey: (key: string) => void;
}) {
  const t = useTranslations("Room");
  const [fingerGuide, setFingerGuide] = useState(false);
  const { session } = useTyping(race.text, () => {}, onKey);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <RaceProgress
        racers={race.racers}
        textLength={race.text.length}
        nicknames={nicknames}
        you={you}
        ownPosition={session.position}
      />
      {session.finished ? (
        <p className="text-center text-lg font-medium" role="status">
          {t("finishedWaiting")}
        </p>
      ) : (
        <TypingText session={session} />
      )}
      <Label className="gap-2 self-start font-normal">
        <Checkbox
          checked={fingerGuide}
          onCheckedChange={(checked) => setFingerGuide(checked)}
        />
        {t("fingerGuide")}
      </Label>
      {fingerGuide && !session.finished && (
        <FingerGuide nextChar={race.text[session.position]} />
      )}
    </div>
  );
}

export function Spectating({
  room,
  you,
  nicknames,
  clockOffsetMs,
}: {
  room: RoomView;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
}) {
  const t = useTranslations("Room");

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <p className="text-center text-muted-foreground" role="status">
        {t("spectating")}
      </p>
      {room.race && (
        <RaceProgress
          racers={room.race.racers}
          textLength={room.race.text.length}
          nicknames={nicknames}
          you={you}
        />
      )}
      {room.timeTrial && (
        <OnlineTimeTrial
          timeTrial={room.timeTrial}
          you={you}
          nicknames={nicknames}
          clockOffsetMs={clockOffsetMs}
          onKey={() => {}}
        />
      )}
    </div>
  );
}

interface ResultRow {
  playerId: string;
  /** Classic Race: Time, or progress when unfinished. Time Trial: best Time. */
  time: string;
  turns?: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

export function OnlineResults({
  room,
  isHost,
  nicknames,
  onBackToLobby,
}: {
  room: RoomView;
  isHost: boolean;
  nicknames: Record<string, string>;
  onBackToLobby: () => void;
}) {
  const t = useTranslations("Room");
  const common = useTranslations("Common");
  const seconds = (ms: number) => common("seconds", { value: ms / 1000 });
  const results = room.results;
  const isTimeTrial = results?.mode === "timeTrial";

  const rows: ResultRow[] =
    results?.mode === "timeTrial"
      ? results.ranking.map((result) => ({
          playerId: result.name,
          time: result.bestTimeMs === null ? "–" : seconds(result.bestTimeMs),
          turns: result.turns,
          wpm: result.wpm,
          accuracy: result.accuracy,
          typos: result.typos,
        }))
      : (results?.ranking ?? []).map((result) => ({
          playerId: result.playerId,
          time:
            result.timeMs === null
              ? common("percent", { value: result.progress })
              : seconds(result.timeMs),
          wpm: result.wpm,
          accuracy: result.accuracy,
          typos: result.typos,
        }));
  const winner = rows[0];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <h2 className="text-4xl font-bold">
        {t("winner", {
          name: winner ? (nicknames[winner.playerId] ?? "?") : "",
        })}
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("player")}</TableHead>
            <TableHead className="text-right">
              {isTimeTrial ? t("bestTime") : t("time")}
            </TableHead>
            {isTimeTrial && (
              <TableHead className="text-right">{t("turns")}</TableHead>
            )}
            <TableHead className="text-right">{t("wpm")}</TableHead>
            <TableHead className="text-right">{t("accuracy")}</TableHead>
            <TableHead className="text-right">{t("typos")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.playerId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {nicknames[row.playerId] ?? "?"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.time}
              </TableCell>
              {isTimeTrial && (
                <TableCell className="text-right tabular-nums">
                  {row.turns}
                </TableCell>
              )}
              <TableCell className="text-right tabular-nums">
                {Math.round(row.wpm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {common("percent", { value: row.accuracy })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.typos}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isHost ? (
        <Button size="lg" onClick={onBackToLobby}>
          {t("backToLobby")}
        </Button>
      ) : (
        <p className="text-muted-foreground">{t("waitingForHost")}</p>
      )}
    </div>
  );
}
