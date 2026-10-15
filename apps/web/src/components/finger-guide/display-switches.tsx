"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DisplayPreferences } from "./finger-guide";

/** The two switches; `forName` labels them per Player on a Shared Keyboard. */
export function DisplaySwitches({
  display,
  onChange,
  forName,
}: {
  display: DisplayPreferences;
  onChange: (next: DisplayPreferences) => void;
  forName?: string;
}) {
  const t = useTranslations("Display");
  const label = (key: "fingerGuide" | "keyboard") =>
    forName ? t(`${key}For`, { name: forName }) : t(key);

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {(["keyboard", "fingerGuide"] as const).map((key) => (
        <Label
          key={key}
          className="gap-2 text-sm font-normal whitespace-nowrap"
        >
          <Checkbox
            checked={display[key]}
            onCheckedChange={(checked) =>
              onChange({ ...display, [key]: checked })
            }
            aria-label={label(key)}
          />
          {t(key)}
        </Label>
      ))}
    </div>
  );
}
