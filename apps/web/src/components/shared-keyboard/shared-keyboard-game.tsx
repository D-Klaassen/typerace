"use client";

import {
  completeTurn,
  generateGibberish,
  runOutOfTime,
  startTimeTrial,
  type TimeTrial,
  type TypingStats,
} from "@typerace/game";
import { useState } from "react";
import { HandoverScreen } from "./handover-screen";
import { ResultsScreen } from "./results-screen";
import {
  DEFAULT_SETTINGS,
  TURN_LENGTH,
  type SharedKeyboardSettings,
} from "./settings";
import { SetupForm } from "./setup-form";
import { TurnScreen } from "./turn-screen";

type Game =
  | { phase: "setup" }
  | { phase: "handover" | "turn"; trial: TimeTrial; seed: number }
  | { phase: "results"; trial: TimeTrial };

/** A Time Trial played by passing one keyboard around. */
export function SharedKeyboardGame() {
  const [settings, setSettings] =
    useState<SharedKeyboardSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<Game>({ phase: "setup" });

  function start(chosen: SharedKeyboardSettings) {
    setSettings(chosen);
    setGame({
      phase: "handover",
      trial: startTimeTrial({
        players: chosen.players,
        timeBankMs: chosen.timeBankMs,
      }),
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  }

  function endTurn(
    seed: number,
    trial: TimeTrial,
    stats: TypingStats,
    end: typeof completeTurn,
  ) {
    const next = end(trial, stats);
    setGame(
      next.winner === null
        ? { phase: "handover", trial: next, seed }
        : { phase: "results", trial: next },
    );
  }

  switch (game.phase) {
    case "setup":
      return <SetupForm initial={settings} onStart={start} />;

    case "handover":
      return (
        <HandoverScreen
          trial={game.trial}
          player={game.trial.currentPlayer ?? ""}
          onReady={() => setGame({ ...game, phase: "turn" })}
        />
      );

    case "turn": {
      const { trial, seed } = game;
      const player = trial.players.find((p) => p.name === trial.currentPlayer);
      // Every Turn gets fresh Gibberish of the same length and Difficulty.
      const text = generateGibberish({
        seed: seed + trial.turnsTaken,
        difficulty: settings.difficulty,
        minLength: TURN_LENGTH,
      });

      return (
        <TurnScreen
          key={trial.turnsTaken}
          player={trial.currentPlayer ?? ""}
          text={text}
          timeBankMs={player?.timeBankMs ?? 0}
          onComplete={(stats) => endTurn(seed, trial, stats, completeTurn)}
          onRunOutOfTime={(stats) => endTurn(seed, trial, stats, runOutOfTime)}
        />
      );
    }

    case "results":
      return (
        <ResultsScreen
          trial={game.trial}
          onPlayAgain={() => start(settings)}
          onBackToSetup={() => setGame({ phase: "setup" })}
        />
      );
  }
}
