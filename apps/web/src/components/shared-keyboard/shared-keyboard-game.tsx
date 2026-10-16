"use client";

import {
  completeTurn,
  finishRaceTurn,
  generateText,
  resolveTextSource,
  getClassicRaceResults,
  getHotSeatResults,
  runOutOfTime,
  startClassicRace,
  startHotSeat,
  TEXT_LENGTH_CHARACTERS,
  HOT_SEAT_TURN_LENGTH,
  hotSeatRecords,
  leaderboardTextSource,
  soloRaceRecords,
  type ClassicRace,
  type LeaderboardRecord,
  type HotSeat,
  type TypingStats,
} from "@typerace/game";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { DEFAULT_DISPLAY } from "@/components/finger-guide/finger-guide";
import {
  LeaderboardNote,
  type LeaderboardStatus,
} from "@/components/leaderboard/leaderboard-note";
import { BackToMenu, MenuBar } from "@/components/navigation/menu-bar";
import { QuitButton } from "@/components/navigation/quit-button";
import { submitToLeaderboard } from "@/lib/leaderboard";
import { ROOMS_HOST } from "@/lib/rooms-host";
import { HandoverScreen } from "./handover-screen";
import { RaceStandings } from "./race-standings";
import { ResultsScreen } from "./results-screen";
import { DEFAULT_SETTINGS, type SharedKeyboardSettings } from "./settings";
import { SetupForm } from "./setup-form";
import { HotSeatStandings } from "./hot-seat-standings";
import { TurnScreen } from "./turn-screen";

type Match =
  | { mode: "hotSeat"; seat: HotSeat }
  | { mode: "classicRace"; race: ClassicRace };

type Game =
  | { phase: "setup" }
  | { phase: "handover" | "turn" | "results"; match: Match; seed: number };

/** Classic Race or Hot Seat, played by passing one keyboard around, or a Classic Race alone. */
export function SharedKeyboardGame() {
  const t = useTranslations("SharedKeyboard.Quit");
  const router = useRouter();
  const [settings, setSettings] =
    useState<SharedKeyboardSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<Game>({ phase: "setup" });
  /** Which finished Match was sent to the Leaderboard, and how it went. */
  const [saved, setSaved] = useState<{
    match: Match;
    status: LeaderboardStatus;
  } | null>(null);

  // Next.js keeps this page alive, hidden, after navigating away. Leaving
  // quits the game, so coming back starts at setup with the same settings.
  useLayoutEffect(() => () => setGame({ phase: "setup" }), []);

  /** The board the Times go on; Gibberish has none. */
  const board = leaderboardTextSource(resolveTextSource(settings));

  /** A Hot Seat Match's best Times, or a solo Classic Race of a Turn's length. */
  function leaderboardRecords(match: Match): LeaderboardRecord[] {
    if (board === null) {
      return [];
    }

    return match.mode === "hotSeat"
      ? hotSeatRecords(match.seat)
      : soloRaceRecords(
          match.race,
          TEXT_LENGTH_CHARACTERS[settings.textLength],
        );
  }

  function saveToLeaderboard(match: Match) {
    const records = leaderboardRecords(match);
    if (ROOMS_HOST === null || board === null || records.length === 0) {
      return;
    }

    setSaved({ match, status: "saving" });
    submitToLeaderboard(ROOMS_HOST, { textSource: board, records }).then(
      () => setSaved({ match, status: "saved" }),
      () => setSaved({ match, status: "failed" }),
    );
  }

  function start(chosen: SharedKeyboardSettings) {
    const players = chosen.players.map((player) => player.name);
    setSettings(chosen);
    setGame({
      phase: "handover",
      match:
        chosen.mode === "hotSeat"
          ? {
              mode: "hotSeat",
              seat: startHotSeat({ players, timeBankMs: chosen.timeBankMs }),
            }
          : { mode: "classicRace", race: startClassicRace({ players }) },
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  }

  if (game.phase === "setup") {
    return (
      <>
        <MenuBar>
          <BackToMenu />
        </MenuBar>
        <SetupForm initial={settings} onStart={start} />
      </>
    );
  }

  const { match, seed } = game;
  const endTurn = (next: Match) => {
    setGame({
      phase: isOver(next) ? "results" : "handover",
      match: next,
      seed,
    });
    if (isOver(next)) {
      saveToLeaderboard(next);
    }
  };

  let screen: ReactNode;
  switch (game.phase) {
    case "handover":
      screen = (
        <HandoverScreen
          player={currentPlayer(match)}
          solo={settings.players.length === 1}
          standings={
            match.mode === "hotSeat" ? (
              <HotSeatStandings seat={match.seat} />
            ) : (
              <RaceStandings race={match.race} />
            )
          }
          onReady={() => setGame({ ...game, phase: "turn" })}
        />
      );
      break;

    case "turn": {
      const player = currentPlayer(match);
      const turnNumber = turnsTaken(match);
      // Every Turn gets fresh text of the same length and Text Source.
      const text = generateText(resolveTextSource(settings), {
        seed: seed + turnNumber,
        minLength:
          match.mode === "hotSeat"
            ? HOT_SEAT_TURN_LENGTH
            : TEXT_LENGTH_CHARACTERS[settings.textLength],
      });
      const display =
        settings.players.find((p) => p.name === player)?.display ??
        DEFAULT_DISPLAY;

      if (match.mode === "classicRace") {
        screen = (
          <TurnScreen
            key={turnNumber}
            player={player}
            text={text}
            timeBankMs={null}
            display={display}
            onComplete={(stats) =>
              endTurn({
                mode: "classicRace",
                race: finishRaceTurn(match.race, stats),
              })
            }
          />
        );
        break;
      }

      const { seat } = match;
      const endHotSeatTurn =
        (end: (seat: HotSeat, stats: TypingStats) => HotSeat) =>
        (stats: TypingStats) =>
          endTurn({ mode: "hotSeat", seat: end(seat, stats) });

      screen = (
        <TurnScreen
          key={turnNumber}
          player={player}
          text={text}
          timeBankMs={
            seat.players.find((p) => p.name === player)?.timeBankMs ?? 0
          }
          display={display}
          onComplete={endHotSeatTurn(completeTurn)}
          onRunOutOfTime={endHotSeatTurn(runOutOfTime)}
        />
      );
      break;
    }

    case "results":
      screen =
        match.mode === "hotSeat" ? (
          <ResultsScreen
            results={getHotSeatResults(match.seat)}
            columns={["bestTime", "turns", "wpm", "accuracy", "typos"]}
            aidsOf={(name) =>
              settings.players.find((player) => player.name === name)?.display
            }
            leaderboard={
              ROOMS_HOST !== null &&
              board !== null && (
                <LeaderboardNote
                  status={saved?.match === match ? saved.status : null}
                  textSource={board}
                />
              )
            }
            onPlayAgain={() => start(settings)}
            onBackToSetup={() => setGame({ phase: "setup" })}
          />
        ) : (
          <ResultsScreen
            results={getClassicRaceResults(match.race)}
            columns={["time", "wpm", "accuracy", "typos"]}
            aidsOf={(name) =>
              settings.players.find((player) => player.name === name)?.display
            }
            leaderboard={
              ROOMS_HOST !== null &&
              board !== null &&
              leaderboardRecords(match).length > 0 && (
                <LeaderboardNote
                  status={saved?.match === match ? saved.status : null}
                  textSource={board}
                />
              )
            }
            onPlayAgain={() => start(settings)}
            onBackToSetup={() => setGame({ phase: "setup" })}
          />
        );
  }

  return (
    <>
      <MenuBar>
        {game.phase === "results" ? (
          <BackToMenu />
        ) : (
          // Nothing is saved from an unfinished game, so ask first.
          <QuitButton
            label={t("quit")}
            confirmation={{ title: t("title"), description: t("description") }}
            onQuit={() => router.push("/")}
          />
        )}
      </MenuBar>
      {screen}
    </>
  );
}

function currentPlayer(match: Match): string {
  return (
    (match.mode === "hotSeat"
      ? match.seat.currentPlayer
      : match.race.currentPlayer) ?? ""
  );
}

function turnsTaken(match: Match): number {
  return match.mode === "hotSeat"
    ? match.seat.turnsTaken
    : match.race.turns.length;
}

function isOver(match: Match): boolean {
  return match.mode === "hotSeat"
    ? match.seat.winner !== null
    : match.race.finished;
}
