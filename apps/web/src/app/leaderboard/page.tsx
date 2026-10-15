import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LeaderboardScreen } from "@/components/leaderboard/leaderboard-screen";
import { BackToMenu, MenuBar } from "@/components/navigation/menu-bar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Leaderboard");

  return { title: t("metadataTitle") };
}

export default function LeaderboardPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center p-8 pt-16">
      <MenuBar>
        <BackToMenu />
      </MenuBar>
      {/* The boards load in the browser; the Key Set comes from the URL. */}
      <Suspense>
        <LeaderboardScreen />
      </Suspense>
    </main>
  );
}
