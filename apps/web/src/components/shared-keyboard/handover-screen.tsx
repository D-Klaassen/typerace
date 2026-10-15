"use client";

import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, type ReactNode } from "react";
import { isDialogOpen } from "@/components/typing/dialog-open";
import { Button } from "@/components/ui/button";

export function HandoverScreen({
  standings,
  player,
  solo,
  onReady,
}: {
  /** The Mode's standings so far, shown while the keyboard is passed on. */
  standings: ReactNode;
  player: string;
  /** A single Player: there's no keyboard to pass. */
  solo: boolean;
  onReady: () => void;
}) {
  const t = useTranslations("SharedKeyboard.Handover");

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === " " && !event.repeat && !isDialogOpen()) {
      event.preventDefault();
      onReady();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold">{t("turnOf", { name: player })}</h2>
      <p className="text-muted-foreground">
        {solo ? t("pressSpaceSolo") : t("pressSpace", { name: player })}
      </p>
      <Button size="lg" onClick={onReady}>
        {t("start")}
      </Button>
      {standings}
    </div>
  );
}
