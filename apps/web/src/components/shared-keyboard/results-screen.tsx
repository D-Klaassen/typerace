import { getTimeTrialResults, type TimeTrial } from "@typerace/game";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ResultsScreen({
  trial,
  onPlayAgain,
  onBackToSetup,
}: {
  trial: TimeTrial;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}) {
  const t = useTranslations("SharedKeyboard.Results");
  const common = useTranslations("Common");
  const results = getTimeTrialResults(trial);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      <h2 className="text-4xl font-bold">
        {t("winner", { name: trial.winner ?? "" })}
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("rank")}</TableHead>
            <TableHead>{t("player")}</TableHead>
            <TableHead className="text-right">{t("bestTime")}</TableHead>
            <TableHead className="text-right">{t("turns")}</TableHead>
            <TableHead className="text-right">{t("wpm")}</TableHead>
            <TableHead className="text-right">{t("accuracy")}</TableHead>
            <TableHead className="text-right">{t("typos")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={result.name}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{result.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {result.bestTimeMs === null
                  ? "–"
                  : common("seconds", { value: result.bestTimeMs / 1000 })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.turns}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {Math.round(result.wpm)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {common("percent", { value: result.accuracy })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.typos}
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
