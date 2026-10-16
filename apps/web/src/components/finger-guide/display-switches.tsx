"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DisplayPreferences } from "./display-preferences";

const SWITCHES = [
  "keyboard",
  "fingerGuide",
  "coloredText",
  "racingTheme",
] as const;

/** A switch per Display choice, each with a line saying what it changes. */
export function DisplaySwitches({
  display,
  onChange,
}: {
  display: DisplayPreferences;
  onChange: (next: DisplayPreferences) => void;
}) {
  const t = useTranslations("Display");
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      {SWITCHES.map((key) => (
        <Label key={key} className="items-start gap-2 text-sm font-normal">
          <Checkbox
            checked={display[key]}
            onCheckedChange={(checked) =>
              onChange({ ...display, [key]: checked })
            }
            aria-label={t(key)}
            aria-describedby={`${id}-${key}`}
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{t(key)}</span>
            <span id={`${id}-${key}`} className="text-muted-foreground">
              {t(`${key}Description`)}
            </span>
          </span>
        </Label>
      ))}
    </div>
  );
}
