"use client";

import {
  completeTurn,
  finishRaceTurn,
  generateGibberish,
  resolveKeySet,
  getClassicRaceResults,
  getTimeTrialResults,
  runOutOfTime,
  startClassicRace,
  startTimeTrial,
  timeTrialRecords,
  type ClassicRace,
  type TimeTrial,
  type TypingStats,
} from "@typerace/game";
import { useState } from "react";
import { DEFAULT_DISPLAY } from "@/components/finger-guide/finger-guide";
import {
  LeaderboardNote,
  type LeaderboardStatus,
} from "@/components/leaderboard/leaderboard-note";
import { submitToLeaderboard } from "@/lib/leaderboard";
import { ROOMS_HOST } from "@/lib/rooms-host";
import { HandoverScreen } from "./handover-screen";
import { RaceStandings } from "./race-standings";
import { ResultsScreen } from "./results-screen";
import {
  DEFAULT_SETTINGS,
  TEXT_LENGTHS,
  TIME_TRIAL_TURN_LENGTH,
  type SharedKeyboardSettings,
} from "./settings";
import { SetupForm } from "./setup-form";
import { TimeTrialStandings } from "./time-trial-standings";
import { TurnScreen } from "./turn-screen";

type Match =
  | { mode: "timeTrial"; trial: TimeTrial }
  | { mode: "classicRace"; race: ClassicRace };

type Game =
  | { phase: "setup" }
  | { phase: "handover" | "turn" | "results"; match: Match; seed: number };

/** Classic Race or Time Trial, played by passing one keyboard around. */
export function SharedKeyboardGame() {
  const [settings, setSettings] =
    useState<SharedKeyboardSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<Game>({ phase: "setup" });
  /** Which finished Time Trial was sent to the Leaderboard, and how it went. */
  const [saved, setSaved] = useState<{
    trial: TimeTrial;
    status: LeaderboardStatus;
  } | null>(null);

  function saveToLeaderboard(trial: TimeTrial) {
    const records = timeTrialRecords(trial);
    if (ROOMS_HOST === null || records.length === 0) {
      return;
    }

    setSaved({ trial, status: "saving" });
    submitToLeaderboard(ROOMS_HOST, {
      keySet: resolveKeySet(settings.keySet, settings.capitals),
      records,
    }).then(
      () => setSaved({ trial, status: "saved" }),
      () => setSaved({ trial, status: "failed" }),
    );
  }

  function start(chosen: SharedKeyboardSettings) {
    const players = chosen.players.map((player) => player.name);
    setSettings(chosen);
    setGame({
      phase: "handover",
      match:
        chosen.mode === "timeTrial"
          ? {
              mode: "timeTrial",
              trial: startTimeTrial({ players, timeBankMs: chosen.timeBankMs }),
            }
          : { mode: "classicRace", race: startClassicRace({ players }) },
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  }

  if (game.phase === "setup") {
    return <SetupForm initial={settings} onStart={start} />;
  }

  const { match, seed } = game;
  const endTurn = (next: Match) => {
    setGame({
      phase: isOver(next) ? "results" : "handover",
      match: next,
      seed,
    });
    if (next.mode === "timeTrial" && isOver(next)) {
      saveToLeaderboard(next.trial);
    }
  };

  switch (game.phase) {
    case "handover":
      return (
        <HandoverScreen
          player={currentPlayer(match)}
          standings={
            match.mode === "timeTrial" ? (
              <TimeTrialStandings trial={match.trial} />
            ) : (
              <RaceStandings race={match.race} />
            )
          }
          onReady={() => setGame({ ...game, phase: "turn" })}
        />
      );

    case "turn": {
      const player = currentPlayer(match);
      const turnNumber = turnsTaken(match);
      // Every Turn gets fresh Gibberish of the same length and Key Set.
      const text = generateGibberish({
        seed: seed + turnNumber,
        keySet: resolveKeySet(settings.keySet, settings.capitals),
        minLength:
          match.mode === "timeTrial"
            ? TIME_TRIAL_TURN_LENGTH
            : TEXT_LENGTHS[settings.textLength],
      });
      const display =
        settings.players.find((p) => p.name === player)?.display ??
        DEFAULT_DISPLAY;

      if (match.mode === "classicRace") {
        return (
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
      }

      const { trial } = match;
      const endTrialTurn =
        (end: (trial: TimeTrial, stats: TypingStats) => TimeTrial) =>
        (stats: TypingStats) =>
          endTurn({ mode: "timeTrial", trial: end(trial, stats) });

      return (
        <TurnScreen
          key={turnNumber}
          player={player}
          text={text}
          timeBankMs={
            trial.players.find((p) => p.name === player)?.timeBankMs ?? 0
          }
          display={display}
          onComplete={endTrialTurn(completeTurn)}
          onRunOutOfTime={endTrialTurn(runOutOfTime)}
        />
      );
    }

    case "results":
      return match.mode === "timeTrial" ? (
        <ResultsScreen
          results={getTimeTrialResults(match.trial)}
          columns={["bestTime", "turns", "wpm", "accuracy", "typos"]}
          aidsOf={(name) =>
            settings.players.find((player) => player.name === name)?.display
          }
          leaderboard={
            ROOMS_HOST !== null && (
              <LeaderboardNote
                status={saved?.trial === match.trial ? saved.status : null}
                keySet={settings.keySet}
                capitals={settings.capitals}
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
          onPlayAgain={() => start(settings)}
          onBackToSetup={() => setGame({ phase: "setup" })}
        />
      );
  }
}

function currentPlayer(match: Match): string {
  return (
    (match.mode === "timeTrial"
      ? match.trial.currentPlayer
      : match.race.currentPlayer) ?? ""
  );
}

function turnsTaken(match: Match): number {
  return match.mode === "timeTrial"
    ? match.trial.turnsTaken
    : match.race.turns.length;
}

function isOver(match: Match): boolean {
  return match.mode === "timeTrial"
    ? match.trial.winner !== null
    : match.race.finished;
}
