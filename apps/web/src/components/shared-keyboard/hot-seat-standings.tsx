import type { HotSeat } from "@typerace/game";
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

/** Best times and remaining Time Banks during a Hot Seat Match. */
export function HotSeatStandings({
  seat,
  nameOf = (name) => name,
}: {
  seat: HotSeat;
  /** Online, Players are named by id; this turns that into a nickname. */
  nameOf?: (name: string) => string;
}) {
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
        {seat.players.map((player) => (
          <TableRow
            key={player.name}
            className={cn(
              player.name === seat.currentPlayer && "font-semibold",
              player.eliminated && "text-muted-foreground line-through",
            )}
          >
            <TableCell>{nameOf(player.name)}</TableCell>
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
