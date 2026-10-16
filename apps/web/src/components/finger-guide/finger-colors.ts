import type { Finger } from "@typerace/game";

type FingerKind = "pinky" | "ring" | "middle" | "index" | "thumbs";

interface FingerColors {
  /** Tint for every key in the finger's zone. */
  zone: string;
  /** The key or finger that must be pressed next. */
  active: string;
  /** Hand outline fill for the finger at rest. */
  fill: string;
  /** Hand outline fill for the finger that must press next. */
  activeFill: string;
  /** Characters in the text, for Coloured Text. */
  text: string;
}

// The same finger gets the same colour on both hands.
const COLORS: Record<FingerKind, FingerColors> = {
  pinky: {
    zone: "bg-rose-100 dark:bg-rose-950/70",
    active: "bg-rose-500 text-white dark:bg-rose-500",
    fill: "fill-rose-200 dark:fill-rose-900",
    activeFill: "fill-rose-500",
    text: "text-rose-700 dark:text-rose-400",
  },
  ring: {
    zone: "bg-amber-100 dark:bg-amber-950/70",
    active: "bg-amber-500 text-white dark:bg-amber-500",
    fill: "fill-amber-200 dark:fill-amber-900",
    activeFill: "fill-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  middle: {
    zone: "bg-emerald-100 dark:bg-emerald-950/70",
    active: "bg-emerald-500 text-white dark:bg-emerald-500",
    fill: "fill-emerald-200 dark:fill-emerald-900",
    activeFill: "fill-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  index: {
    zone: "bg-sky-100 dark:bg-sky-950/70",
    active: "bg-sky-500 text-white dark:bg-sky-500",
    fill: "fill-sky-200 dark:fill-sky-900",
    activeFill: "fill-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  },
  thumbs: {
    zone: "bg-violet-100 dark:bg-violet-950/70",
    active: "bg-violet-500 text-white dark:bg-violet-500",
    fill: "fill-violet-200 dark:fill-violet-900",
    activeFill: "fill-violet-500",
    text: "text-violet-700 dark:text-violet-400",
  },
};

export function fingerColors(finger: Finger): FingerColors {
  const kind = finger === "thumbs" ? "thumbs" : finger.split("-")[1];

  return COLORS[kind as FingerKind];
}
