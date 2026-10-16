"use client";

import {
  leaderboardKey,
  REAL_TEXT_KINDS,
  TEXT_LENGTHS,
  type LeaderboardBoard,
  type LeaderboardEntry,
} from "@typerace/game";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChoiceGroup } from "@/components/choice-group";
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
  boardOfLeaderboardHref,
  leaderboardHref,
} from "@/lib/leaderboard";
import { ROOMS_HOST } from "@/lib/rooms-host";

/**
 * The fastest Times for the Text Source, Language and Text Length picked on
 * the page. Gibberish has no board, so it can't be picked.
 */
export function LeaderboardScreen() {
  const t = useTranslations("Leaderboard");
  const lengths = useTranslations("SharedKeyboard.Setup.textLengths");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [board, setBoard] = useState<LeaderboardBoard>(() =>
    boardOfLeaderboardHref(searchParams),
  );

  function choose(next: LeaderboardBoard) {
    setBoard(next);
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
          <TextSourcePicker
            kinds={REAL_TEXT_KINDS}
            value={{ textSource: board.kind, language: board.language }}
            onChange={({ textSource: kind, language }) =>
              choose({ ...board, kind, language })
            }
          />
          <ChoiceGroup
            legend={t("textLength")}
            name="text-length"
            options={TEXT_LENGTHS.map((value) => ({
              value,
              label: lengths(value),
            }))}
            value={board.textLength}
            onChange={(textLength) => choose({ ...board, textLength })}
          />
        </CardContent>
      </Card>
      <Board host={ROOMS_HOST} board={board} />
    </div>
  );
}

type Loaded = { key: string; entries: LeaderboardEntry[] | "failed" };

function Board({ host, board }: { host: string; board: LeaderboardBoard }) {
  const t = useTranslations("Leaderboard");
  const common = useTranslations("Common");
  const locale = useLocale();
  const key = leaderboardKey(board);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaderboard(host, board, controller.signal).then(
      (entries) => setLoaded({ key, entries }),
      () => {
        if (!controller.signal.aborted) {
          setLoaded({ key, entries: "failed" });
        }
      },
    );

    return () => controller.abort();
  }, [host, key, board]);

  // Until this board arrives, an older one would be misleading.
  const entries = loaded?.key === key ? loaded.entries : null;

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
