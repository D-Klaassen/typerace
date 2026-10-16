"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RacingTrack } from "@/components/racing-theme/racing-track";
import { TypingText } from "@/components/typing/typing-text";
import { TypingAids, type DisplayPreferences } from "./finger-guide";

/** A word with a capital, so the preview also shows Shift. */
const SAMPLE = "TypeRace";
const STEP_MS = 700;

/** A small example of what typing will look like with these preferences. */
export function DisplayPreview({ display }: { display: DisplayPreferences }) {
  const t = useTranslations("Display");
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setPosition((current) => (current + 1) % SAMPLE.length),
      STEP_MS,
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <figure
      className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
      aria-label={t("preview")}
      data-testid="display-preview"
    >
      <figcaption className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("preview")}
      </figcaption>
      {display.racingTheme && (
        <RacingTrack
          cars={[
            {
              id: "preview",
              name: "",
              position,
              typosInARow: 0,
              finished: false,
              isYou: true,
            },
          ]}
          textLength={SAMPLE.length}
          view="whole"
        />
      )}
      <TypingText session={{ text: SAMPLE, position, inError: false }} />
      {display.fingerGuide || display.keyboard ? (
        <TypingAids nextChar={SAMPLE[position]} display={display} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("nothingExtra")}</p>
      )}
    </figure>
  );
}
