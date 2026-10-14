"use client";

import {
  MAX_NICKNAME_LENGTH,
  validateNicknames,
  type Difficulty,
  type NicknameProblem,
} from "@typerace/game";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChoiceGroup } from "@/components/choice-group";
import { Label } from "@/components/ui/label";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type SharedKeyboardMode,
  type SharedKeyboardPlayer,
  type SharedKeyboardSettings,
  type TextLength,
} from "./settings";

const MODES: SharedKeyboardMode[] = ["classicRace", "timeTrial"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const TEXT_LENGTH_OPTIONS: TextLength[] = ["short", "medium", "long"];
const TIME_BANK_MINUTES = [1, 2, 3, 5];

export function SetupForm({
  initial,
  onStart,
}: {
  initial: SharedKeyboardSettings;
  onStart: (settings: SharedKeyboardSettings) => void;
}) {
  const t = useTranslations("SharedKeyboard.Setup");
  const common = useTranslations("Common");
  const [mode, setMode] = useState(initial.mode);
  const [players, setPlayers] = useState(initial.players);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [textLength, setTextLength] = useState(initial.textLength);
  const [timeBankMs, setTimeBankMs] = useState(initial.timeBankMs);
  const [problem, setProblem] = useState<NicknameProblem | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateNicknames(players.map((player) => player.name));
    setProblem(found);
    if (!found) {
      onStart({
        mode,
        textLength,
        players: players.map((player) => ({
          ...player,
          name: player.name.trim(),
        })),
        difficulty,
        timeBankMs,
      });
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("players")}</legend>
            {players.map((player, index) => {
              const label = t("playerLabel", { number: index + 1 });
              const update = (changes: Partial<SharedKeyboardPlayer>) =>
                setPlayers(
                  players.map((other, i) =>
                    i === index ? { ...other, ...changes } : other,
                  ),
                );

              return (
                <div key={index} className="flex items-center gap-2">
                  <Label htmlFor={`player-${index}`} className="sr-only">
                    {label}
                  </Label>
                  <Input
                    id={`player-${index}`}
                    value={player.name}
                    maxLength={MAX_NICKNAME_LENGTH}
                    placeholder={label}
                    autoComplete="off"
                    onChange={(event) => update({ name: event.target.value })}
                  />
                  <Label className="shrink-0 gap-2 text-sm font-normal whitespace-nowrap">
                    <Checkbox
                      checked={player.fingerGuide}
                      onCheckedChange={(checked) =>
                        update({ fingerGuide: checked })
                      }
                      aria-label={t("fingerGuideFor", {
                        name: player.name || label,
                      })}
                    />
                    {t("fingerGuide")}
                  </Label>
                  {players.length > MIN_PLAYERS && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("removePlayer", {
                        name: player.name || label,
                      })}
                      onClick={() =>
                        setPlayers(players.filter((_, i) => i !== index))
                      }
                    >
                      <XIcon />
                    </Button>
                  )}
                </div>
              );
            })}
            {players.length < MAX_PLAYERS && (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() =>
                  setPlayers([...players, { name: "", fingerGuide: false }])
                }
              >
                {t("addPlayer")}
              </Button>
            )}
            {problem && (
              <p role="alert" className="text-sm text-destructive">
                {t(`errors.${problem}`)}
              </p>
            )}
          </fieldset>

          <ChoiceGroup
            legend={t("mode")}
            name="mode"
            options={MODES.map((value) => ({ value, label: t(value) }))}
            value={mode}
            onChange={setMode}
          />

          <ChoiceGroup
            legend={t("difficulty")}
            name="difficulty"
            options={DIFFICULTIES.map((value) => ({
              value,
              label: common(`difficulty.${value}`),
            }))}
            value={difficulty}
            onChange={setDifficulty}
          />

          {mode === "classicRace" ? (
            <ChoiceGroup
              legend={t("textLength")}
              name="text-length"
              options={TEXT_LENGTH_OPTIONS.map((value) => ({
                value,
                label: t(`textLengths.${value}`),
              }))}
              value={textLength}
              onChange={setTextLength}
            />
          ) : (
            <ChoiceGroup
              legend={t("timeBank")}
              name="time-bank"
              options={TIME_BANK_MINUTES.map((minutes) => ({
                value: minutes * 60_000,
                label: String(minutes),
              }))}
              value={timeBankMs}
              onChange={setTimeBankMs}
            />
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" size="lg" className="w-full">
            {t("start")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
