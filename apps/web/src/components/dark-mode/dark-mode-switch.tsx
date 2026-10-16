"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CAR_HEIGHT, CAR_WIDTH, Car } from "./car";

const BEAM_WIDTH = 260;
const BEAM_HEIGHT = 90;
/** The headlight's height on the car, so the beam starts there. */
const HEADLIGHT_Y = 28;
/** The switch sits 16px from the top and is about 34px high. */
const CAR_TOP = 16 + 17 - CAR_HEIGHT / 2;

function setDarkMode(on: boolean) {
  document.documentElement.classList.toggle("dark", on);
}

/**
 * The dark mode switch in the top-right corner. There is no light mode to
 * stay in: switch it off and a car races over, bumps it back on, turns
 * around and drives off with its headlights on. The switch is locked until
 * the car is gone; with reduced motion, dark mode just comes back.
 */
export function DarkModeSwitch() {
  const t = useTranslations("DarkMode");
  const [dark, setDark] = useState(true);
  /** From switching off until dark mode is back and the car has gone. */
  const [busy, setBusy] = useState(false);
  const [driving, setDriving] = useState(false);
  const control = useRef<HTMLButtonElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);

  function show(on: boolean) {
    setDark(on);
    setDarkMode(on);
  }

  function switchOff() {
    if (busy) return;
    setBusy(true);
    show(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTimeout(() => {
        show(true);
        setBusy(false);
      }, 800);
    } else {
      setTimeout(() => setDriving(true), 400);
    }
  }

  useEffect(() => {
    const body = car.current;
    const lights = beam.current;
    const target = control.current;
    if (!driving || !body || !lights || !target) return;
    let cancelled = false;
    const stopAt = target.getBoundingClientRect().left - CAR_WIDTH - 2;
    const at = (x: number, facing = 1, lift = 0) =>
      `translateX(${x}px) translateY(${-lift}px) scaleX(${facing})`;
    // Every step holds its end position, or the car snaps back to its start
    // off the left edge between steps.
    const hold = { fill: "forwards" } as const;

    async function drive(body: HTMLDivElement, lights: HTMLDivElement) {
      await body.animate(
        [{ transform: at(-CAR_WIDTH) }, { transform: at(stopAt) }],
        { ...hold, duration: 1100, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" },
      ).finished;
      if (cancelled) return;

      const bump = body.animate(
        [
          { transform: at(stopAt) },
          { transform: at(stopAt + 16) },
          { transform: at(stopAt) },
        ],
        { ...hold, duration: 260, easing: "ease-out" },
      );
      setTimeout(() => {
        setDark(true);
        setDarkMode(true);
        document.body.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 240 },
        );
      }, 120);
      await bump.finished;
      if (cancelled) return;

      // Turn around: the car narrows as it turns, but never below 40% of its
      // width, so it doesn't vanish halfway.
      await body.animate(
        [
          { transform: at(stopAt, 1), easing: "ease-in" },
          { transform: at(stopAt, 0.4), offset: 0.5 },
          { transform: at(stopAt, -0.4), offset: 0.5, easing: "ease-out" },
          { transform: at(stopAt, -1) },
        ],
        { ...hold, duration: 300 },
      ).finished;
      if (cancelled) return;

      // A little hop while the headlights flicker on.
      await Promise.all([
        body.animate(
          [
            { transform: at(stopAt, -1, 0), easing: "ease-out" },
            { transform: at(stopAt, -1, 14), offset: 0.5, easing: "ease-in" },
            { transform: at(stopAt, -1, 0) },
          ],
          { ...hold, duration: 320 },
        ).finished,
        lights.animate(
          [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }],
          { ...hold, duration: 350 },
        ).finished,
      ]);
      if (cancelled) return;

      await body.animate(
        [{ transform: at(stopAt, -1) }, { transform: at(-CAR_WIDTH - 10, -1) }],
        { ...hold, duration: 1100, easing: "cubic-bezier(0.6, 0, 0.8, 0.4)" },
      ).finished;
      if (cancelled) return;
      setDriving(false);
      setBusy(false);
    }
    void drive(body, lights);

    return () => {
      cancelled = true;
      // Never leave anyone in light mode.
      setDarkMode(true);
    };
  }, [driving]);

  return (
    <>
      <button
        ref={control}
        type="button"
        role="switch"
        aria-checked={dark}
        disabled={busy}
        onClick={switchOff}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-sm disabled:cursor-not-allowed"
      >
        {t("label")}
        <span
          aria-hidden
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            dark ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]",
              dark ? "left-[18px]" : "left-0.5",
            )}
          />
        </span>
      </button>
      {driving && (
        <div
          ref={car}
          data-testid="dark-mode-car"
          className="pointer-events-none fixed left-0 z-40"
          style={{ top: CAR_TOP, transform: `translateX(${-CAR_WIDTH}px)` }}
        >
          <Car />
          {/* In front of the car; it points the other way once it turns. */}
          <div
            ref={beam}
            className="absolute left-full"
            style={{
              top: HEADLIGHT_Y - BEAM_HEIGHT / 2,
              width: BEAM_WIDTH,
              height: BEAM_HEIGHT,
              opacity: 0,
              clipPath: "polygon(0 44%, 100% 0, 100% 100%, 0 56%)",
              background:
                "linear-gradient(to right, rgb(255 250 220 / 0.85), rgb(255 250 220 / 0))",
            }}
          />
        </div>
      )}
    </>
  );
}
