import type { TextChoice } from "@typerace/game";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { leaderboardHref } from "@/lib/leaderboard";

/** How sending a finished Hot Seat Match to the Leaderboard went. */
export type LeaderboardStatus = "saving" | "saved" | "failed";

/**
 * Under Hot Seat results: whether the best Times made it, and a link to
 * the board of the text they were typed on.
 */
export function LeaderboardNote({
  status,
  text,
}: {
  /** Null when there was nothing to save. */
  status: LeaderboardStatus | null;
  text: TextChoice;
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
        href={leaderboardHref(text)}
        className={buttonVariants({ variant: "link" })}
      >
        {t("view")}
      </Link>
    </div>
  );
}
