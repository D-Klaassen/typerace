"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CRASH_TYPOS_IN_A_ROW, glide } from "./car-motion";

/** What the circuit needs to know about one car's typing. */
export interface CarTyping {
  id: string;
  position: number;
  typosInARow: number;
}

/** Where to draw a car right now, and how far into a skid or crash it is. */
export interface CarMotion {
  shown: number;
  skidAgeMs: number | null;
  crashAgeMs: number | null;
}

interface Tracked {
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
    const tracked = new Map<string, Tracked>();
    let frame = requestAnimationFrame(function loop(nowMs) {
      const next: Record<string, CarMotion> = {};
      for (const car of latest.current) {
        let track = tracked.get(car.id);
        if (!track) {
          track = {
            from: car.position,
            to: car.position,
            changedAtMs: -Infinity,
            typosInARow: 0,
            lastTypoAtMs: null,
            crashedAtMs: null,
          };
          tracked.set(car.id, track);
        }
        if (car.position !== track.to) {
          track.from = glide({
            from: track.from,
            to: track.to,
            sinceChangeMs: nowMs - track.changedAtMs,
          });
          track.to = car.position;
          track.changedAtMs = nowMs;
        }
        if (car.typosInARow > track.typosInARow) {
          track.lastTypoAtMs = nowMs;
        }
        track.typosInARow = car.typosInARow;
        if (car.typosInARow >= CRASH_TYPOS_IN_A_ROW) {
          track.crashedAtMs ??= nowMs;
        } else {
          track.crashedAtMs = null;
        }

        next[car.id] = {
          shown: glide({
            from: track.from,
            to: track.to,
            sinceChangeMs: nowMs - track.changedAtMs,
          }),
          skidAgeMs:
            car.typosInARow > 0 && track.lastTypoAtMs !== null
              ? nowMs - track.lastTypoAtMs
              : null,
          crashAgeMs:
            track.crashedAtMs === null ? null : nowMs - track.crashedAtMs,
        };
      }
      setMotion(next);
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return motion;
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
