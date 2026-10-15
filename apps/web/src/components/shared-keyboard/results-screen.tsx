import type { Display } from "@typerace/game";
import { useTranslations } from "next-intl";
import { AidsLabel } from "@/components/finger-guide/aids-label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ResultRow {
  name: string;
  /** Classic Race: the Turn's Time. */
  timeMs?: number;
  /** Time Trial: fastest finished Turn. */
  bestTimeMs?: number | null;
  /** Time Trial: number of Turns taken. */
  turns?: number;
  wpm: number;
  accuracy: number;
  typos: number;
}

type Column = "time" | "bestTime" | "turns" | "wpm" | "accuracy" | "typos";

/** Final ranking for any Mode; `results` must already be in rank order. */
export function ResultsScreen({
  results,
  columns,
  aidsOf,
  onPlayAgain,
  onBackToSetup,
}: {
  results: ResultRow[];
  columns: Column[];
  /** The aids a Player had on, by nickname. */
  aidsOf: (name: string) => Display | undefined;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}) {
  const t = useTranslations("SharedKeyboard.Results");
  const common = useTranslations("Common");
  const seconds = (ms: number | null | undefined) =>
    ms === null || ms === undefined
      ? "–"
      : common("seconds", { value: ms / 1000 });

  const cell: Record<Column, (result: ResultRow) => string | number> = {
    time: (result) => seconds(result.timeMs),
    bestTime: (result) => seconds(result.bestTimeMs),
    turns: (result) => result.turns ?? "–",
    wpm: (result) => Math.round(result.wpm),
    accuracy: (result) => common("percent", { value: result.accuracy }),
    typos: (result) => result.typos,
  };

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <h2 className="text-4xl font-bold">
        {t("winner", { name: results[0]?.name ?? "" })}
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("rank")}</TableHead>
            <TableHead>{t("player")}</TableHead>
            {columns.map((column) => (
              <TableHead key={column} className="text-right">
                {t(column)}
              </TableHead>
            ))}
            <TableHead>{t("aids")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={result.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{result.name}</TableCell>
              {columns.map((column) => (
                <TableCell key={column} className="text-right tabular-nums">
                  {cell[column](result)}
                </TableCell>
              ))}
              <TableCell>
                <AidsLabel display={aidsOf(result.name)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-3">
        <Button size="lg" onClick={onPlayAgain}>
          {t("playAgain")}
        </Button>
        <Button size="lg" variant="outline" onClick={onBackToSetup}>
          {t("backToSetup")}
        </Button>
      </div>
    </div>
  );
}
