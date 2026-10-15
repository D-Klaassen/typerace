import type { KeySetChoice } from "@typerace/game";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { leaderboardHref } from "@/lib/leaderboard";

/** How sending a finished Time Trial to the Leaderboard went. */
export type LeaderboardStatus = "saving" | "saved" | "failed";

/** Under Time Trial results: whether the best Times made it, and a link. */
export function LeaderboardNote({
  status,
  keySet,
  capitals,
}: {
  /** Null when there was nothing to save. */
  status: LeaderboardStatus | null;
  keySet: KeySetChoice;
  capitals: boolean;
}) {
  const t = useTranslations("Leaderboard");

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {status && (
        <p
          role="status"
          className={
            status === "failed" ? "text-destructive" : "text-muted-foreground"
          }
        >
          {t(`status.${status}`)}
        </p>
      )}
      <Link
        href={leaderboardHref(keySet, capitals)}
        className={buttonVariants({ variant: "link" })}
      >
        {t("view")}
      </Link>
    </div>
  );
}
