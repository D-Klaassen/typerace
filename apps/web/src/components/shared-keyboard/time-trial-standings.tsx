import type { TimeTrial } from "@typerace/game";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Best times and remaining Time Banks during a Time Trial. */
export function TimeTrialStandings({ trial }: { trial: TimeTrial }) {
  const t = useTranslations("SharedKeyboard.Standings");
  const common = useTranslations("Common");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("player")}</TableHead>
          <TableHead className="text-right">{t("bestTime")}</TableHead>
          <TableHead className="text-right">{t("timeBank")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trial.players.map((player) => (
          <TableRow
            key={player.name}
            className={cn(
              player.name === trial.currentPlayer && "font-semibold",
              player.eliminated && "text-muted-foreground line-through",
            )}
          >
            <TableCell>{player.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {player.bestTimeMs === null
                ? t("noTimeYet")
                : common("seconds", { value: player.bestTimeMs / 1000 })}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {player.eliminated
                ? t("eliminated")
                : common("seconds", { value: player.timeBankMs / 1000 })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
