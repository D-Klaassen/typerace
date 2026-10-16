import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OnlineStart } from "@/components/room/online-start";
import { BackToMenu, MenuBar } from "@/components/navigation/menu-bar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Online");

  return { title: t("metadataTitle") };
}

export default function OnlinePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-8 pt-16">
      <MenuBar>
        <BackToMenu />
      </MenuBar>
      <OnlineStart />
    </main>
  );
}
