"use client";

import {
  findPreset,
  generateGibberish,
  KEY_SET_PRESETS,
  LESSONS,
  MIN_CUSTOM_KEYS,
  normalizeKeys,
  resolveKeySet,
  type KeySetChoice,
  type PresetGroup,
} from "@typerace/game";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChoiceGroup } from "@/components/choice-group";
import { OnScreenKeyboard } from "@/components/finger-guide/on-screen-keyboard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePresetLabel } from "./use-preset-label";

type Tab = PresetGroup | "custom";

const TABS: Tab[] = ["lesson", "row", "finger", "classic", "custom"];
const STAGES = [...new Set(LESSONS.map((lesson) => lesson.stage))];

/** Keys the quick buttons add to a custom set. */
const QUICK_ADD: Record<string, string> = {
  homeRow: "asdfghjkl;",
  topRow: "qwertyuiop",
  bottomRow: "zxcvbnm,./",
  numbers: "1234567890",
};

export interface KeySetValue {
  keySet: KeySetChoice;
  capitals: boolean;
}

/** Choose a Key Set: a preset from one of the groups, or custom keys. */
export function KeySetPicker({
  value,
  onChange,
  presetBadges = {},
}: {
  value: KeySetValue;
  onChange: (value: KeySetValue) => void;
  /** Vote counts per preset id, shown to the Host. */
  presetBadges?: Record<string, number>;
}) {
  const t = useTranslations("KeySet");
  const labelOf = usePresetLabel();
  const current =
    "preset" in value.keySet ? findPreset(value.keySet.preset) : undefined;
  const [tab, setTab] = useState<Tab>(current?.group ?? "custom");
  const resolved = resolveKeySet(value.keySet, value.capitals);
  const customKeys = "custom" in value.keySet ? value.keySet.custom : "";

  const choosePreset = (id: string) =>
    onChange({ ...value, keySet: { preset: id } });
  const setCustom = (keys: string) =>
    onChange({ ...value, keySet: { custom: normalizeKeys(keys) } });

  return (
    <div className="flex flex-col gap-4">
      <ChoiceGroup
        legend={t("title")}
        name="key-set-group"
        options={TABS.map((group) => ({
          value: group,
          label: t(`groups.${group}`),
        }))}
        value={tab}
        onChange={(group) => {
          setTab(group);
          if (group === "custom") {
            // Start from the keys of the current choice.
            setCustom(resolved.keys);
          }
        }}
      />

      {tab === "lesson" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="lesson">{t("lessonLabel")}</Label>
          <select
            id="lesson"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={current?.group === "lesson" ? current.id : ""}
            onChange={(event) => choosePreset(event.target.value)}
          >
            {current?.group !== "lesson" && (
              <option value="" disabled>
                {t("pickLesson")}
              </option>
            )}
            {STAGES.map((stage) => (
              <optgroup key={stage} label={t(`stages.${stage}`)}>
                {LESSONS.filter((lesson) => lesson.stage === stage).map(
                  (lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {labelOf(lesson)}
                      {presetBadges[lesson.id]
                        ? ` (${t("votes", { count: presetBadges[lesson.id]! })})`
                        : ""}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {(tab === "row" || tab === "finger" || tab === "classic") && (
        <ChoiceGroup
          legend={t(`groups.${tab}`)}
          name={`key-set-${tab}`}
          options={KEY_SET_PRESETS.filter((preset) => preset.group === tab).map(
            (preset) => ({
              value: preset.id,
              label: labelOf(preset),
              badge: presetBadges[preset.id],
            }),
          )}
          value={current?.id}
          onChange={choosePreset}
        />
      )}

      {tab === "custom" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("customHint")}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(QUICK_ADD).map(([name, keys]) => (
              <Button
                key={name}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCustom(customKeys + keys)}
              >
                {t(`quickAdd.${name}`)}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCustom("")}
            >
              {t("clear")}
            </Button>
          </div>
          <OnScreenKeyboard
            label={t("customKeyboard")}
            selected={new Set(customKeys)}
            onToggleKey={(key) =>
              setCustom(
                customKeys.includes(key)
                  ? customKeys.replace(key, "")
                  : customKeys + key,
              )
            }
          />
          {normalizeKeys(customKeys).length < MIN_CUSTOM_KEYS && (
            <p role="alert" className="text-sm text-destructive">
              {t("tooFewKeys", { count: MIN_CUSTOM_KEYS })}
            </p>
          )}
        </div>
      )}

      <Label className="gap-2 self-start font-normal">
        <Checkbox
          checked={resolved.capitals}
          disabled={current?.capitals === true}
          onCheckedChange={(checked) =>
            onChange({ ...value, capitals: checked })
          }
        />
        {t("capitals")}
      </Label>

      <KeySetSample value={value} />
    </div>
  );
}

/** A read-only view: the chosen keys on the keyboard and a sample of the text. */
export function KeySetSummary({ value }: { value: KeySetValue }) {
  const t = useTranslations("KeySet");
  const labelOf = usePresetLabel();
  const preset =
    "preset" in value.keySet ? findPreset(value.keySet.preset) : undefined;
  const resolved = resolveKeySet(value.keySet, value.capitals);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="font-medium">{t("title")}: </span>
        {preset ? labelOf(preset) : t("groups.custom")}
        {resolved.capitals && ` · ${t("capitals")}`}
      </p>
      <OnScreenKeyboard selected={new Set(resolved.keys)} />
      <KeySetSample value={value} />
    </div>
  );
}

function KeySetSample({ value }: { value: KeySetValue }) {
  const t = useTranslations("KeySet");
  const sample = generateGibberish({
    seed: 1,
    keySet: resolveKeySet(value.keySet, value.capitals),
    minLength: 60,
  });

  return (
    <p className="text-sm text-muted-foreground" data-testid="key-set-sample">
      {t("sample")} <span className="font-mono text-foreground">{sample}</span>
    </p>
  );
}
