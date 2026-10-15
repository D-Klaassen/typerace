"use client";

import {
  MAX_NICKNAME_LENGTH,
  validateNicknames,
  type NicknameProblem,
  type TextLength,
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
import { ChoiceGroup } from "@/components/choice-group";
import { KeySetPicker } from "@/components/key-set/key-set-picker";
import { TextSourcePicker } from "@/components/text-source/text-source-picker";
import { DisplayPreview } from "@/components/finger-guide/display-preview";
import { DisplaySwitches } from "@/components/finger-guide/display-switches";
import { DEFAULT_DISPLAY } from "@/components/finger-guide/finger-guide";
import { Label } from "@/components/ui/label";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type SharedKeyboardMode,
  type SharedKeyboardPlayer,
  type SharedKeyboardSettings,
} from "./settings";

const MODES: SharedKeyboardMode[] = ["classicRace", "timeTrial"];
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
  const [mode, setMode] = useState(initial.mode);
  const [players, setPlayers] = useState(initial.players);
  const [textSource, setTextSource] = useState({
    textSource: initial.textSource,
    language: initial.language,
  });
  const [keySet, setKeySet] = useState({
    keySet: initial.keySet,
    capitals: initial.capitals,
  });
  const [textLength, setTextLength] = useState(initial.textLength);
  const [timeBankMs, setTimeBankMs] = useState(initial.timeBankMs);
  const [problem, setProblem] = useState<NicknameProblem | null>(null);
  /** Whose display choice the preview shows: the last one changed. */
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewPlayer =
    previewIndex === null ? undefined : players[previewIndex];

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
        ...textSource,
        ...keySet,
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
            <legend className="text-sm font-medium">{t("players")}</legend>
            <p
              id="nickname-hint"
              className="mb-2 text-sm text-muted-foreground"
            >
              {t("nicknameHint")}
            </p>
            {players.map((player, index) => {
              const label = t("playerLabel", { number: index + 1 });
              const update = (changes: Partial<SharedKeyboardPlayer>) =>
                setPlayers(
                  players.map((other, i) =>
                    i === index ? { ...other, ...changes } : other,
                  ),
                );

              return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`player-${index}`} className="sr-only">
                      {label}
                    </Label>
                    <Input
                      id={`player-${index}`}
                      value={player.name}
                      maxLength={MAX_NICKNAME_LENGTH}
                      placeholder={label}
                      autoComplete="off"
                      aria-describedby="nickname-hint"
                      onChange={(event) => update({ name: event.target.value })}
                    />
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
                  <DisplaySwitches
                    display={player.display}
                    forName={player.name || label}
                    onChange={(display) => {
                      update({ display });
                      setPreviewIndex(index);
                    }}
                  />
                </div>
              );
            })}
            {players.length < MAX_PLAYERS && (
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() =>
                  setPlayers([
                    ...players,
                    { name: "", display: DEFAULT_DISPLAY },
                  ])
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

          {previewPlayer && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {t("previewFor", {
                  name:
                    previewPlayer.name ||
                    t("playerLabel", { number: (previewIndex ?? 0) + 1 }),
                })}
              </span>
              <DisplayPreview display={previewPlayer.display} />
            </div>
          )}

          <ChoiceGroup
            legend={t("mode")}
            name="mode"
            options={MODES.map((value) => ({ value, label: t(value) }))}
            value={mode}
            onChange={setMode}
          />

          <TextSourcePicker value={textSource} onChange={setTextSource} />

          {textSource.textSource === "gibberish" && (
            <KeySetPicker value={keySet} onChange={setKeySet} />
          )}

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
