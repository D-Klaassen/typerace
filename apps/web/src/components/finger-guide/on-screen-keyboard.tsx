import { getKeyGuide, type Finger, type KeyGuide } from "@typerace/game";
import { cn } from "@/lib/utils";
import { fingerColors } from "./finger-colors";

interface KeyCap {
  /** Unshifted character, or a name for keys that type nothing. */
  id: string;
  label: string;
  /** Width in key units (1 = a letter key). */
  width?: number;
  /** Finger for keys that `getKeyGuide` doesn't know (Shift). */
  finger?: Finger;
}

const char = (id: string): KeyCap => ({
  id,
  label: /[a-z]/.test(id) ? id.toUpperCase() : id,
});
const filler = (id: string, label: string, width: number): KeyCap => ({
  id,
  label,
  width,
});

// US QWERTY (ANSI), 15 units wide.
const ROWS: KeyCap[][] = [
  [...[..."`1234567890-="].map(char), filler("backspace", "⌫", 2)],
  [
    filler("tab", "Tab", 1.5),
    ...[..."qwertyuiop[]"].map(char),
    filler("\\", "\\", 1.5),
  ],
  [
    filler("caps", "Caps", 1.75),
    ...[..."asdfghjkl;'"].map(char),
    filler("enter", "Enter", 2.25),
  ],
  [
    { id: "left-shift", label: "Shift", width: 2.25, finger: "left-pinky" },
    ...[..."zxcvbnm,./"].map(char),
    { id: "right-shift", label: "Shift", width: 2.75, finger: "right-pinky" },
  ],
  [
    filler("left-gap", "", 4),
    { id: " ", label: "", width: 6.25 },
    filler("right-gap", "", 4.75),
  ],
];

const HOME_ROW_BUMPS = new Set(["f", "j"]);

export function OnScreenKeyboard({ guide }: { guide: KeyGuide | null }) {
  return (
    <div className="flex flex-col gap-1 select-none" aria-hidden>
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cap) => (
            <Key key={cap.id} cap={cap} guide={guide} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Key({ cap, guide }: { cap: KeyCap; guide: KeyGuide | null }) {
  const isGap = cap.id.endsWith("-gap");
  const finger = cap.finger ?? getKeyGuide(cap.id)?.finger;
  const isActive =
    guide !== null && (guide.key === cap.id || guide.shift === cap.id);
  const colors = finger ? fingerColors(finger) : null;

  return (
    <div
      data-key={cap.id}
      data-active={isActive || undefined}
      style={{ flexGrow: cap.width ?? 1, flexBasis: 0 }}
      className={cn(
        "relative flex h-10 items-center justify-center rounded-md font-mono text-sm transition-colors",
        isGap
          ? "invisible"
          : cn("border", colors?.zone ?? "bg-muted text-muted-foreground"),
        isActive &&
          cn(colors?.active, "scale-105 border-transparent shadow-md"),
      )}
    >
      {cap.label}
      {HOME_ROW_BUMPS.has(cap.id) && (
        <span className="absolute bottom-1.5 h-0.5 w-2 rounded-full bg-current opacity-60" />
      )}
    </div>
  );
}
