import { useTranslations } from "next-intl";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("tagline")}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Link href="/play" className={buttonVariants({ size: "lg" })}>
          {t("sharedKeyboard")}
        </Link>
        <p className="text-sm text-muted-foreground">
          {t("sharedKeyboardDescription")}
        </p>
      </div>
    </main>
  );
}
