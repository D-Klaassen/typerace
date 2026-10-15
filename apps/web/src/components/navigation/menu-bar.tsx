import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

/**
 * The way back to the home page, in the top-left corner of every other
 * screen. Its `main` must be `relative`.
 */
export function MenuBar({ children }: { children: ReactNode }) {
  const t = useTranslations("Navigation");

  return (
    <nav aria-label={t("label")} className="absolute top-4 left-4 flex gap-2">
      {children}
    </nav>
  );
}

/** Straight back to the home page, for screens with nothing to lose. */
export function BackToMenu() {
  const t = useTranslations("Navigation");

  return (
    <Link href="/" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeftIcon data-icon="inline-start" aria-hidden />
      {t("backToMenu")}
    </Link>
  );
}
