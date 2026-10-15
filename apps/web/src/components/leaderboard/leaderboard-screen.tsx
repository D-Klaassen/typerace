"use client";

import {
  leaderboardBoard,
  resolveTextSource,
  type LeaderboardEntry,
  type TextChoice,
  type TextSource,
} from "@typerace/game";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KeySetPicker } from "@/components/key-set/key-set-picker";
import { TextSourcePicker } from "@/components/text-source/text-source-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchLeaderboard,
  leaderboardHref,
  textChoiceOfLeaderboardHref,
} from "@/lib/leaderboard";
import { ROOMS_HOST } from "@/lib/rooms-host";

/**
 * The fastest Time Trial Turns for the text picked on the page: a Key Set for
 * Gibberish, or a Text Source and Language.
 */
export function LeaderboardScreen() {
  const t = useTranslations("Leaderboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<TextChoice>(() =>
    textChoiceOfLeaderboardHref(searchParams),
  );
  const textSource = useMemo(() => resolveTextSource(value), [value]);

  function choose(changes: Partial<TextChoice>) {
    const next = { ...value, ...changes };
    setValue(next);
    // Keep the link shareable without adding to the history.
    router.replace(leaderboardHref(next), { scroll: false });
  }

  if (ROOMS_HOST === null) {
    return <p role="alert">{t("notConfigured")}</p>;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            <h1>{t("title")}</h1>
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <TextSourcePicker value={value} onChange={choose} />
          {value.textSource === "gibberish" && (
            <KeySetPicker value={value} onChange={choose} />
          )}
        </CardContent>
      </Card>
      <Board host={ROOMS_HOST} textSource={textSource} />
    </div>
  );
}

type Loaded = { board: string; entries: LeaderboardEntry[] | "failed" };

function Board({ host, textSource }: { host: string; textSource: TextSource }) {
  const t = useTranslations("Leaderboard");
  const common = useTranslations("Common");
  const locale = useLocale();
  const board = leaderboardBoard(textSource);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaderboard(host, textSource, controller.signal).then(
      (entries) => setLoaded({ board, entries }),
      () => {
        if (!controller.signal.aborted) {
          setLoaded({ board, entries: "failed" });
        }
      },
    );

    return () => controller.abort();
  }, [host, board, textSource]);

  // Until this board arrives, an older one would be misleading.
  const entries = loaded?.board === board ? loaded.entries : null;

  if (entries === null) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }
  if (entries === "failed") {
    return (
      <p role="alert" className="text-destructive">
        {t("failed")}
      </p>
    );
  }
  if (entries.length === 0) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Table aria-label={t("title")}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("rank")}</TableHead>
          <TableHead>{t("player")}</TableHead>
          <TableHead className="text-right">{t("time")}</TableHead>
          <TableHead className="text-right">{t("date")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, index) => (
          <TableRow key={`${entry.recordedAtMs}-${entry.nickname}`}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{entry.nickname}</TableCell>
            <TableCell className="text-right tabular-nums">
              {common("seconds", { value: entry.timeMs / 1000 })}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {date.format(entry.recordedAtMs)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
