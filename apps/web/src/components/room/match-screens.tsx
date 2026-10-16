"use client";

import {
  leaderboardTextSource,
  resolveTextSource,
  type Display,
  type TypingSession,
} from "@typerace/game";
import type { RoomView } from "@typerace/protocol";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  NO_DISPLAY_AIDS,
  TypingAids,
  type DisplayPreferences,
} from "@/components/finger-guide/finger-guide";
import {
  RacingTrack,
  typingCar,
  type RacingCar,
} from "@/components/racing-theme/racing-track";
import { TypingText } from "@/components/typing/typing-text";
import { useTyping } from "@/components/typing/use-typing";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AidsLabel } from "@/components/finger-guide/aids-label";
import { LeaderboardNote } from "@/components/leaderboard/leaderboard-note";
import { RaceProgress } from "./race-progress";
import { CrazyDartsMatch } from "./crazy-darts-screens";
import { OnlineHotSeat } from "./hot-seat-screens";

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
  display,
  onKey,
}: {
  race: Race;
  you: string;
  nicknames: Record<string, string>;
  display: DisplayPreferences;
  onKey: (key: string) => void;
}) {
  const t = useTranslations("Room");
  const { session } = useTyping(race.text, () => {}, onKey);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {display.racingTheme ? (
        <RacingTrack
          cars={racingCars(race, nicknames, you, session)}
          textLength={race.text.length}
          follow={you}
        />
      ) : (
        <RaceProgress
          racers={race.racers}
          textLength={race.text.length}
          nicknames={nicknames}
          you={you}
          ownPosition={session.position}
        />
      )}
      {session.finished ? (
        <p className="text-center text-lg font-medium" role="status">
          {t("finishedWaiting")}
        </p>
      ) : (
        <TypingText session={session} />
      )}
      {!session.finished && (
        <TypingAids nextChar={race.text[session.position]} display={display} />
      )}
    </div>
  );
}

export function Spectating({
  room,
  you,
  nicknames,
  clockOffsetMs,
  racingTheme,
}: {
  room: RoomView;
  you: string;
  nicknames: Record<string, string>;
  clockOffsetMs: number;
  /** Spectators only get the Racing Theme if this browser remembers it on. */
  racingTheme: boolean;
}) {
  const t = useTranslations("Room");

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <p className="text-center text-muted-foreground" role="status">
        {t("spectating")}
      </p>
      {room.race &&
        (racingTheme ? (
          <div className="w-full">
            <RacingTrack
              cars={racingCars(room.race, nicknames, you)}
              textLength={room.race.text.length}
            />
          </div>
        ) : (
          <RaceProgress
            racers={room.race.racers}
            textLength={room.race.text.length}
            nicknames={nicknames}
            you={you}
          />
        ))}
      {room.darts && (
        <CrazyDartsMatch
          darts={room.darts}
          startingHp={room.settings.startingHp}
          you={you}
          nicknames={nicknames}
          clockOffsetMs={clockOffsetMs}
        />
      )}
      {room.hotSeat && (
        <OnlineHotSeat
          hotSeat={room.hotSeat}
          you={you}
          nicknames={nicknames}
          clockOffsetMs={clockOffsetMs}
          display={{ ...NO_DISPLAY_AIDS, racingTheme }}
          onKey={() => {}}
        />
      )}
    </div>
  );
}

/** Everyone's cars in this Classic Race, ours from local typing, ahead of the Room's view. */
function racingCars(
  race: Race,
  nicknames: Record<string, string>,
  you: string,
  own?: TypingSession,
): RacingCar[] {
  return race.racers.map((racer) => {
    const isYou = racer.playerId === you;
    const typing = isYou && own ? own : racer;

    return {
      ...typingCar(typing, {
        id: racer.playerId,
        name: nicknames[racer.playerId] ?? "?",
        isYou,
      }),
      // Our own finish is timed by the Room too, once its update arrives.
      finishedAtMs: racer.finishedAtMs,
      dropped: racer.dropped,
    };
  });
}

export function OnlineResults({
  room,
  isHost,
  nicknames,
  displays,
  onBackToLobby,
}: {
  room: RoomView;
  isHost: boolean;
  nicknames: Record<string, string>;
  /** The aids each Player had on during the Match. */
  displays: Readonly<Record<string, Display>>;
  onBackToLobby: () => void;
}) {
  const t = useTranslations("Room");
  const common = useTranslations("Common");
  const seconds = (ms: number) => common("seconds", { value: ms / 1000 });
  const percent = (value: number) => common("percent", { value });
  const { headers, rows } = resultTable(room.results, { t, seconds, percent });
  const winner = rows[0];
  // Gibberish has no board, so a Hot Seat Match on it isn't recorded.
  const board = leaderboardTextSource(resolveTextSource(room.settings));

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
            {headers.map((header) => (
              <TableHead key={header} className="text-right">
                {header}
              </TableHead>
            ))}
            <TableHead>{t("aids")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.playerId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {nicknames[row.playerId] ?? "?"}
              </TableCell>
              {row.cells.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="text-right tabular-nums">
                  {cell}
                </TableCell>
              ))}
              <TableCell>
                <AidsLabel display={displays[row.playerId]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {room.results?.mode === "hotSeat" && board !== null && (
        // The Room puts the best Times on the Leaderboard itself.
        <LeaderboardNote status="saved" textSource={board} />
      )}
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

interface ResultTable {
  headers: string[];
  rows: { playerId: string; cells: (string | number)[] }[];
}

function resultTable(
  results: RoomView["results"],
  {
    t,
    seconds,
    percent,
  }: {
    t: (key: string) => string;
    seconds: (ms: number) => string;
    percent: (value: number) => string;
  },
): ResultTable {
  const stats = (result: { wpm: number; accuracy: number; typos: number }) => [
    Math.round(result.wpm),
    percent(result.accuracy),
    result.typos,
  ];
  const statHeaders = [t("wpm"), t("accuracy"), t("typos")];

  switch (results?.mode) {
    case "hotSeat":
      return {
        headers: [t("bestTime"), t("turns"), ...statHeaders],
        rows: results.ranking.map((result) => ({
          playerId: result.name,
          cells: [
            result.bestTimeMs === null ? "–" : seconds(result.bestTimeMs),
            result.turns,
            ...stats(result),
          ],
        })),
      };
    case "crazyDarts":
      return {
        headers: [t("hpLeft"), t("damageDealt"), ...statHeaders],
        rows: results.ranking.map((result) => ({
          playerId: result.playerId,
          cells: [result.hp, result.damageDealt, ...stats(result)],
        })),
      };
    case "classicRace":
      return {
        headers: [t("time"), ...statHeaders],
        rows: results.ranking.map((result) => ({
          playerId: result.playerId,
          cells: [
            result.timeMs === null
              ? percent(result.progress)
              : seconds(result.timeMs),
            ...stats(result),
          ],
        })),
      };
    default:
      return { headers: [], rows: [] };
  }
}
