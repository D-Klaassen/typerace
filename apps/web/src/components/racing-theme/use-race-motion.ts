"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CRASH_SPIN_MS,
  CRASH_TYPOS_IN_A_ROW,
  glide,
  SKID_MS,
} from "./car-motion";

/** What the circuit needs to know about one car's typing. */
export interface CarTyping {
  id: string;
  position: number;
  typosInARow: number;
}

/** Where to draw a car right now, and how far into a skid or crash it is. */
export interface CarMotion {
  shown: number;
  /** Time since the latest Typo, during its skid; null otherwise. */
  skidAgeMs: number | null;
  /** Time since the crash, up to the end of the spin; null when not crashed. */
  crashAgeMs: number | null;
}

/** When a car's last moves happened, on this browser's clock. */
interface CarTimeline {
  from: number;
  to: number;
  changedAtMs: number;
  typosInARow: number;
  lastTypoAtMs: number | null;
  crashedAtMs: number | null;
}

/**
 * Times every car's moves on this browser's clock: when it reached its
 * letter (to glide there), its latest Typo (to skid) and its crash (to spin).
 * The cars come from local typing or from the Room's updates alike.
 */
export function useRaceMotion(
  cars: readonly CarTyping[],
): Readonly<Record<string, CarMotion>> {
  const latest = useRef(cars);
  const [motion, setMotion] = useState<Readonly<Record<string, CarMotion>>>({});

  useEffect(() => {
    latest.current = cars;
  });

  useEffect(() => {
    const timelines = new Map<string, CarTimeline>();
    let shown: Readonly<Record<string, CarMotion>> = {};
    let frame = requestAnimationFrame(function loop(nowMs) {
      const next: Record<string, CarMotion> = {};
      for (const car of latest.current) {
        let timeline = timelines.get(car.id);
        if (!timeline) {
          timeline = {
            from: car.position,
            to: car.position,
            changedAtMs: -Infinity,
            typosInARow: 0,
            lastTypoAtMs: null,
            crashedAtMs: null,
          };
          timelines.set(car.id, timeline);
        }
        if (car.position !== timeline.to) {
          timeline.from = glide({
            from: timeline.from,
            to: timeline.to,
            sinceChangeMs: nowMs - timeline.changedAtMs,
          });
          timeline.to = car.position;
          timeline.changedAtMs = nowMs;
        }
        if (car.typosInARow > timeline.typosInARow) {
          timeline.lastTypoAtMs = nowMs;
        }
        timeline.typosInARow = car.typosInARow;
        if (car.typosInARow >= CRASH_TYPOS_IN_A_ROW) {
          timeline.crashedAtMs ??= nowMs;
        } else {
          timeline.crashedAtMs = null;
        }

        const sinceTypoMs =
          timeline.lastTypoAtMs === null
            ? Infinity
            : nowMs - timeline.lastTypoAtMs;
        next[car.id] = {
          shown: glide({
            from: timeline.from,
            to: timeline.to,
            sinceChangeMs: nowMs - timeline.changedAtMs,
          }),
          // The skid plays out in full, even if the right key comes first.
          skidAgeMs: sinceTypoMs < SKID_MS ? sinceTypoMs : null,
          crashAgeMs:
            timeline.crashedAtMs === null
              ? null
              : Math.min(CRASH_SPIN_MS, nowMs - timeline.crashedAtMs),
        };
      }
      // Once nothing moves, the circuit needn't draw again every frame.
      if (!sameMotion(shown, next)) {
        shown = next;
        setMotion(next);
      }
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return motion;
}

function sameMotion(
  a: Readonly<Record<string, CarMotion>>,
  b: Readonly<Record<string, CarMotion>>,
): boolean {
  const ids = Object.keys(b);

  return (
    ids.length === Object.keys(a).length &&
    ids.every(
      (id) =>
        a[id]?.shown === b[id]!.shown &&
        a[id]?.skidAgeMs === b[id]!.skidAgeMs &&
        a[id]?.crashAgeMs === b[id]!.crashAgeMs,
    )
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotionSetting(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

/** Whether the computer is set to reduce motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionSetting,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
