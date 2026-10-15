"use client";

import type { KeySetPreset } from "@typerace/game";
import { useTranslations } from "next-intl";

/** "Lesson 14 · q p" for Lessons, the translated name for other presets. */
export function usePresetLabel(): (preset: KeySetPreset) => string {
  const t = useTranslations("KeySet");

  return (preset) =>
    "number" in preset
      ? t("lesson", {
          number: preset.number as number,
          keys: [...preset.keys].join(" "),
        })
      : t(`presets.${preset.id}`);
}
