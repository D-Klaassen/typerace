"use client";

import { KEY_SET_PRESETS, LESSONS, type PresetGroup } from "@typerace/game";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { usePresetLabel } from "./use-preset-label";

const STAGES = [...new Set(LESSONS.map((lesson) => lesson.stage))];
const OTHER_GROUPS: PresetGroup[] = ["row", "finger", "classic"];

/** A non-Host Player's Vote for a Key Set preset, with the counts so far. */
export function KeySetVote({
  myVote,
  counts,
  onVote,
}: {
  myVote: string | undefined;
  counts: Record<string, number>;
  onVote: (presetId: string) => void;
}) {
  const t = useTranslations("KeySet");
  const labelOf = usePresetLabel();
  const option = (id: string, label: string) => (
    <option key={id} value={id}>
      {label}
      {counts[id] ? ` (${t("votes", { count: counts[id]! })})` : ""}
    </option>
  );

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="key-set-vote">{t("vote")}</Label>
      <select
        id="key-set-vote"
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={myVote ?? ""}
        onChange={(event) => onVote(event.target.value)}
      >
        <option value="" disabled>
          {t("noVote")}
        </option>
        {OTHER_GROUPS.map((group) => (
          <optgroup key={group} label={t(`groups.${group}`)}>
            {KEY_SET_PRESETS.filter((preset) => preset.group === group).map(
              (preset) => option(preset.id, labelOf(preset)),
            )}
          </optgroup>
        ))}
        {STAGES.map((stage) => (
          <optgroup key={stage} label={t(`stages.${stage}`)}>
            {LESSONS.filter((lesson) => lesson.stage === stage).map((lesson) =>
              option(lesson.id, labelOf(lesson)),
            )}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
