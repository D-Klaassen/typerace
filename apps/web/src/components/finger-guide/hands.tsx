import type { Finger, Hand, KeyGuide } from "@typerace/game";
import { cn } from "@/lib/utils";
import { fingerColors } from "./finger-colors";

// One left hand, drawn pinky to thumb; the right hand is its mirror image.
const FINGERS: {
  finger: "pinky" | "ring" | "middle" | "index";
  x: number;
  y: number;
  height: number;
}[] = [
  { finger: "pinky", x: 10, y: 48, height: 52 },
  { finger: "ring", x: 38, y: 22, height: 78 },
  { finger: "middle", x: 66, y: 12, height: 88 },
  { finger: "index", x: 94, y: 24, height: 76 },
];

export function Hands({ guide }: { guide: KeyGuide | null }) {
  const active = new Set<Finger>();
  if (guide) {
    active.add(guide.finger);
    if (guide.shift) {
      active.add(guide.shift === "left-shift" ? "left-pinky" : "right-pinky");
    }
  }

  return (
    <div className="flex justify-center gap-16" aria-hidden>
      <HandDrawing hand="left" active={active} />
      <HandDrawing hand="right" active={active} />
    </div>
  );
}

function HandDrawing({ hand, active }: { hand: Hand; active: Set<Finger> }) {
  const thumbsActive = active.has("thumbs");

  return (
    <svg
      viewBox="0 0 170 170"
      className={cn("h-32 w-32", hand === "right" && "-scale-x-100")}
      data-hand={hand}
    >
      {FINGERS.map(({ finger, x, y, height }) => {
        const name: Finger = `${hand}-${finger}`;
        const colors = fingerColors(name);
        const isActive = active.has(name);

        return (
          <rect
            key={finger}
            data-finger={name}
            data-active={isActive || undefined}
            x={x}
            y={y}
            width={24}
            height={height}
            rx={12}
            className={cn(
              "stroke-foreground/40 transition-colors",
              isActive ? colors.activeFill : colors.fill,
            )}
            strokeWidth={2}
          />
        );
      })}
      <rect
        data-finger="thumbs"
        data-active={thumbsActive || undefined}
        x={118}
        y={92}
        width={24}
        height={56}
        rx={12}
        transform="rotate(-35 130 120)"
        className={cn(
          "stroke-foreground/40 transition-colors",
          thumbsActive
            ? fingerColors("thumbs").activeFill
            : fingerColors("thumbs").fill,
        )}
        strokeWidth={2}
      />
      <rect
        x={8}
        y={92}
        width={116}
        height={72}
        rx={24}
        className="fill-muted stroke-foreground/40"
        strokeWidth={2}
      />
    </svg>
  );
}
