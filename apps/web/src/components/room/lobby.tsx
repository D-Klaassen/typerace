"use client";

import {
  ONLINE_MODES,
  type Difficulty,
  type Mode,
  type RoomSettings,
  type TextLength,
  type Vote,
} from "@typerace/game";
import { CheckIcon, CopyIcon, CrownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChoiceGroup } from "@/components/choice-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RoomState } from "./use-room";

const MODES: Mode[] = ["classicRace", "crazyDarts", "timeTrial"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const TEXT_LENGTHS: TextLength[] = ["short", "medium", "long"];
const TIME_BANK_MINUTES = [1, 2, 3, 5];
const STARTING_HP = [50, 100, 150, 200];
const DART_DAMAGE = [1, 2, 3];
const TYPO_HP = [0, 2, 5];

export function Lobby({
  code,
  state,
  onUpdateSettings,
  onVote,
  onStart,
}: {
  code: string;
  state: RoomState;
  onUpdateSettings: (changes: Partial<RoomSettings>) => void;
  onVote: (vote: Vote) => void;
  onStart: () => void;
}) {
  const t = useTranslations("Room");
  const { room, voteCounts, you } = state;
  const isHost = room.hostId === you;
  const myVotes = room.votes[you] ?? {};

  return (
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[1fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-2xl tracking-widest">
            {code}
          </CardTitle>
          <CardDescription>{t("shareHint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CopyLinkButton />
          <ul className="flex flex-col gap-2" aria-label={t("players")}>
            {room.players.map((player) => (
              <li key={player.id} className="flex items-center gap-2">
                <span className="font-medium">{player.nickname}</span>
                {player.id === room.hostId && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CrownIcon className="size-3" aria-hidden />
                    {t("host")}
                  </span>
                )}
                {player.id === you && (
                  <span className="text-xs text-muted-foreground">
                    {t("you")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
          <CardDescription>
            {isHost ? t("hostHint") : t("guestHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsForm
            settings={room.settings}
            voteCounts={voteCounts}
            editable={isHost}
            onChange={onUpdateSettings}
          />
          {!isHost && (
            <section
              aria-labelledby="vote-title"
              className="flex flex-col gap-4 border-t pt-6"
            >
              <h3 id="vote-title" className="font-medium">
                {t("voteTitle")}
              </h3>
              <ChoiceGroup
                legend={t("voteMode")}
                name="vote-mode"
                options={MODES.map((value) => ({
                  value,
                  label: t(`modes.${value}`),
                  badge: voteCounts.mode[value],
                }))}
                value={myVotes.mode}
                onChange={(mode) => onVote({ mode })}
              />
              <ChoiceGroup
                legend={t("voteDifficulty")}
                name="vote-difficulty"
                options={DIFFICULTIES.map((value) => ({
                  value,
                  label: t(`difficulties.${value}`),
                  badge: voteCounts.difficulty[value],
                }))}
                value={myVotes.difficulty}
                onChange={(difficulty) => onVote({ difficulty })}
              />
            </section>
          )}
          <StartArea
            isHost={isHost}
            playerCount={room.players.length}
            mode={room.settings.mode}
            onStart={onStart}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StartArea({
  isHost,
  playerCount,
  mode,
  onStart,
}: {
  isHost: boolean;
  playerCount: number;
  mode: Mode;
  onStart: () => void;
}) {
  const t = useTranslations("Room");

  if (!ONLINE_MODES.includes(mode)) {
    return <p className="text-sm text-muted-foreground">{t("modeSoon")}</p>;
  }
  if (!isHost) {
    return (
      <p className="text-sm text-muted-foreground">{t("waitingForStart")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" disabled={playerCount < 2} onClick={onStart}>
        {t("start")}
      </Button>
      {playerCount < 2 && (
        <p className="text-sm text-muted-foreground">{t("needTwoPlayers")}</p>
      )}
    </div>
  );
}

function SettingsForm({
  settings,
  voteCounts,
  editable,
  onChange,
}: {
  settings: RoomSettings;
  voteCounts: RoomState["voteCounts"];
  editable: boolean;
  onChange: (changes: Partial<RoomSettings>) => void;
}) {
  const t = useTranslations("Room");
  const shared = { disabled: !editable };

  return (
    <div className="flex flex-col gap-6">
      <ChoiceGroup
        {...shared}
        legend={t("mode")}
        name="mode"
        options={MODES.map((value) => ({
          value,
          label: t(`modes.${value}`),
          badge: editable ? voteCounts.mode[value] : undefined,
        }))}
        value={settings.mode}
        onChange={(mode) => onChange({ mode })}
      />
      <ChoiceGroup
        {...shared}
        legend={t("difficulty")}
        name="difficulty"
        options={DIFFICULTIES.map((value) => ({
          value,
          label: t(`difficulties.${value}`),
          badge: editable ? voteCounts.difficulty[value] : undefined,
        }))}
        value={settings.difficulty}
        onChange={(difficulty) => onChange({ difficulty })}
      />
      {settings.mode === "classicRace" && (
        <ChoiceGroup
          {...shared}
          legend={t("textLength")}
          name="text-length"
          options={TEXT_LENGTHS.map((value) => ({
            value,
            label: t(`textLengths.${value}`),
          }))}
          value={settings.textLength}
          onChange={(textLength) => onChange({ textLength })}
        />
      )}
      {settings.mode === "timeTrial" && (
        <ChoiceGroup
          {...shared}
          legend={t("timeBank")}
          name="time-bank"
          options={TIME_BANK_MINUTES.map((minutes) => ({
            value: minutes * 60_000,
            label: String(minutes),
          }))}
          value={settings.timeBankMs}
          onChange={(timeBankMs) => onChange({ timeBankMs })}
        />
      )}
      {settings.mode === "crazyDarts" && (
        <>
          <ChoiceGroup
            {...shared}
            legend={t("startingHp")}
            name="starting-hp"
            options={STARTING_HP.map((value) => ({
              value,
              label: String(value),
            }))}
            value={settings.startingHp}
            onChange={(startingHp) => onChange({ startingHp })}
          />
          <ChoiceGroup
            {...shared}
            legend={t("dartDamage")}
            name="dart-damage"
            options={DART_DAMAGE.map((value) => ({
              value,
              label: String(value),
            }))}
            value={settings.dartDamagePerCharacter}
            onChange={(dartDamagePerCharacter) =>
              onChange({ dartDamagePerCharacter })
            }
          />
          <ChoiceGroup
            {...shared}
            legend={t("typoHp")}
            name="typo-hp"
            options={TYPO_HP.map((value) => ({
              value,
              label: String(value),
            }))}
            value={settings.typoHp}
            onChange={(typoHp) => onChange({ typoHp })}
          />
        </>
      )}
    </div>
  );
}

function CopyLinkButton() {
  const t = useTranslations("Room");
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? t("copied") : t("copyLink")}
    </Button>
  );
}
