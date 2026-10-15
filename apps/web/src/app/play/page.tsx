import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SharedKeyboardGame } from "@/components/shared-keyboard/shared-keyboard-game";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SharedKeyboard");

  return { title: t("metadataTitle") };
}

export default function PlayPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-8 pt-16">
      <SharedKeyboardGame />
    </main>
  );
}
