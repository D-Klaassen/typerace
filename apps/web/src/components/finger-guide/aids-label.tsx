import type { Display } from "@typerace/game";
import { HandIcon, KeyboardIcon, PaletteIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/** Which aids a Player had on, as small icons with names. */
export function AidsLabel({ display }: { display: Display | undefined }) {
  const t = useTranslations("Display");

  if (!display) {
    return <span className="text-muted-foreground">–</span>;
  }
  if (!display.fingerGuide && !display.keyboard && !display.coloredText) {
    return <span className="text-muted-foreground">{t("noAids")}</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {display.keyboard && (
        <span className="inline-flex items-center gap-1">
          <KeyboardIcon className="size-4" aria-hidden />
          {t("keyboard")}
        </span>
      )}
      {display.fingerGuide && (
        <span className="inline-flex items-center gap-1">
          <HandIcon className="size-4" aria-hidden />
          {t("fingerGuide")}
        </span>
      )}
      {display.coloredText && (
        <span className="inline-flex items-center gap-1">
          <PaletteIcon className="size-4" aria-hidden />
          {t("coloredText")}
        </span>
      )}
    </span>
  );
}
