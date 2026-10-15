import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LeaderboardScreen } from "@/components/leaderboard/leaderboard-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Leaderboard");

  return { title: t("metadataTitle") };
}

export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-8">
      {/* The boards load in the browser; the Key Set comes from the URL. */}
      <Suspense>
        <LeaderboardScreen />
      </Suspense>
    </main>
  );
}
