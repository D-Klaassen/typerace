import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OnlineStart } from "@/components/room/online-start";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Online");

  return { title: t("metadataTitle") };
}

export default function OnlinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <OnlineStart />
    </main>
  );
}
