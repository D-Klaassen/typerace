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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type SharedKeyboardSettings,
} from "./settings";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
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
  const [players, setPlayers] = useState(initial.players);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [timeBankMs, setTimeBankMs] = useState(initial.timeBankMs);
  const [problem, setProblem] = useState<NicknameProblem | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateNicknames(players);
    setProblem(found);
    if (!found) {
      onStart({
        players: players.map((name) => name.trim()),
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
            {players.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label htmlFor={`player-${index}`} className="sr-only">
                  {t("playerLabel", { number: index + 1 })}
                </Label>
                <Input
                  id={`player-${index}`}
                  value={name}
                  maxLength={MAX_NICKNAME_LENGTH}
                  placeholder={t("playerLabel", { number: index + 1 })}
                  autoComplete="off"
                  onChange={(event) =>
                    setPlayers(
                      players.map((other, i) =>
                        i === index ? event.target.value : other,
                      ),
                    )
                  }
                />
                {players.length > MIN_PLAYERS && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("removePlayer", {
                      name: name || t("playerLabel", { number: index + 1 }),
                    })}
                    onClick={() =>
                      setPlayers(players.filter((_, i) => i !== index))
                    }
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            ))}
            {players.length < MAX_PLAYERS && (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => setPlayers([...players, ""])}
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

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("mode")}</span>
            <span className="text-muted-foreground">{t("timeTrial")}</span>
          </div>

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

function ChoiceGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-md border px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
