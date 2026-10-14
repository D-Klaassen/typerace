import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="text-lg text-neutral-500">{t("tagline")}</p>
    </main>
  );
}
