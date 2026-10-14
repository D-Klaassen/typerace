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
  race,
  you,
  nicknames,
}: {
  race: Race | null;
  you: string;
  nicknames: Record<string, string>;
}) {
  const t = useTranslations("Room");

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <p className="text-center text-muted-foreground" role="status">
        {t("spectating")}
      </p>
      {race && (
        <RaceProgress
          racers={race.racers}
          textLength={race.text.length}
          nicknames={nicknames}
          you={you}
        />
      )}
    </div>
  );
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
  const results = room.results ?? [];
  const winner = results[0];

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
            <TableHead className="text-right">{t("time")}</TableHead>
            <TableHead className="text-right">{t("wpm")}</TableHead>
            <TableHead className="text-right">{t("accuracy")}</TableHead>
            <TableHead className="text-right">{t("typos")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={result.playerId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {nicknames[result.playerId] ?? "?"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.timeMs === null
                  ? common("percent", { value: result.progress })
                  : common("seconds", { value: result.timeMs / 1000 })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {Math.round(result.wpm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {common("percent", { value: result.accuracy })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.typos}
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
