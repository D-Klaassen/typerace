import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RoomScreen } from "@/components/room/room-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Room");

  return { title: t("metadataTitle") };
}

export default function RoomPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-8 pt-16">
      {/* The Room is entirely client-side; it reads its code from the URL. */}
      <Suspense>
        <RoomScreen />
      </Suspense>
    </main>
  );
}
