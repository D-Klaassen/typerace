import type { ClassicRace } from "@typerace/game";
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

/** Times so far during a Classic Race on a Shared Keyboard. */
export function RaceStandings({ race }: { race: ClassicRace }) {
  const t = useTranslations("SharedKeyboard.Standings");
  const common = useTranslations("Common");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("player")}</TableHead>
          <TableHead className="text-right">{t("time")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {race.players.map((name, index) => {
          const turn = race.turns[index];

          return (
            <TableRow
              key={name}
              className={cn(name === race.currentPlayer && "font-semibold")}
            >
              <TableCell>{name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {turn
                  ? common("seconds", { value: turn.timeMs / 1000 })
                  : t("noTimeYet")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
