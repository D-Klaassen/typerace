/**
 * How a Racing Theme car moves: gliding to its letter, skidding on a Typo and
 * crashing on the third in a row (see CONTEXT.md: Racing Theme). Pure: the
 * times are passed in.
 */

/** Typos in a row that crash the car until the right key. */
export const CRASH_TYPOS_IN_A_ROW = 3;

export type CarMood = "driving" | "skidding" | "crashed" | "finished";

export function carMood({
  typosInARow,
  finished,
}: {
  typosInARow: number;
  finished: boolean;
}): CarMood {
  if (finished) {
    return "finished";
  }
  if (typosInARow >= CRASH_TYPOS_IN_A_ROW) {
    return "crashed";
  }

  return typosInARow > 0 ? "skidding" : "driving";
}

/** How long a single Typo's skid lasts. */
export const SKID_MS = 600;
/** How long a crash's spin takes. */
export const CRASH_SPIN_MS = 900;
/** Up to about 26°, three swings, fading out. */
const SKID_YAW = 0.45;
const SKID_SLIDE = 0.22;
/** One and a quarter turns, so the car ends up sideways. */
const CRASH_YAW = Math.PI * 2.5;
const CRASH_SLIDE = 1.4;

export interface CarPose {
  /** Turn away from the direction of travel, in radians. */
  yaw: number;
  /** Sideways drift, in lane widths. */
  slide: number;
}

const STILL: CarPose = { yaw: 0, slide: 0 };

/**
 * The car's skid or spin, `skidAgeMs` after its latest Typo or `crashAgeMs`
 * after it crashed. With reduced motion it just stops.
 */
export function carPose(
  {
    skidAgeMs,
    crashAgeMs,
  }: { skidAgeMs: number | null; crashAgeMs: number | null },
  reducedMotion: boolean,
): CarPose {
  if (reducedMotion) {
    return STILL;
  }
  if (crashAgeMs !== null) {
    const eased = 1 - (1 - Math.min(1, crashAgeMs / CRASH_SPIN_MS)) ** 3;

    return { yaw: eased * CRASH_YAW, slide: eased * CRASH_SLIDE };
  }
  if (skidAgeMs !== null && skidAgeMs < SKID_MS) {
    const k = skidAgeMs / SKID_MS;

    return {
      yaw: SKID_YAW * Math.sin(k * Math.PI * 3) * (1 - k),
      slide: SKID_SLIDE * Math.sin(k * Math.PI),
    };
  }

  return STILL;
}

/** How long the car takes to glide to a newly typed letter. */
export const GLIDE_MS = 90;

/**
 * Where to draw a car that went from letter `from` to `to` `sinceChangeMs`
 * ago: easing out towards `to`, and never past it.
 */
export function glide({
  from,
  to,
  sinceChangeMs,
}: {
  from: number;
  to: number;
  sinceChangeMs: number;
}): number {
  const k = Math.min(1, Math.max(0, sinceChangeMs / GLIDE_MS));

  return k === 1 ? to : from + (to - from) * (1 - (1 - k) ** 2);
}
