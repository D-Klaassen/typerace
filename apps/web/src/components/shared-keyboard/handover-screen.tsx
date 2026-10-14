"use client";

import type { TimeTrial } from "@typerace/game";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent } from "react";
import { Button } from "@/components/ui/button";
import { Standings } from "./standings";

export function HandoverScreen({
  trial,
  player,
  onReady,
}: {
  trial: TimeTrial;
  player: string;
  onReady: () => void;
}) {
  const t = useTranslations("SharedKeyboard.Handover");

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === " " && !event.repeat) {
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
        {t("pressSpace", { name: player })}
      </p>
      <Button size="lg" onClick={onReady}>
        {t("start")}
      </Button>
      <Standings trial={trial} />
    </div>
  );
}
