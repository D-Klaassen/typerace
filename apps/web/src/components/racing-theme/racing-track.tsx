"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { carMood, carPose } from "./car-motion";
import {
  lapOf,
  lapsFor,
  placeOnTrack,
  TRACK_HEIGHT,
  TRACK_WIDTH,
  trackPoints,
} from "./track";
import {
  useRaceMotion,
  useReducedMotion,
  type CarMotion,
  type CarTyping,
} from "./use-race-motion";

/** One car on the circuit: a Player's typing, as far along as they are. */
export interface RacingCar extends CarTyping {
  name: string;
  finished: boolean;
  /** When they finished, on one clock for every car; unknown sorts last. */
  finishedAtMs?: number | null;
  /** Left the Room; their car stays where it was, faded. */
  dropped?: boolean;
  /** This browser's own Player: labelled "You" and outlined. */
  isYou?: boolean;
  /**
   * The Player's seat (their place in the Room or the setup), which picks
   * the car's colour and lane, so a Player keeps them everywhere. Defaults
   * to the car's place in the list.
   */
  seat?: number;
}

const LANE = 16;
const LANES = 6;
/** How much the follow camera zooms in. */
const ZOOM = 1.8;
const VIEW_W = TRACK_WIDTH / ZOOM;
const VIEW_H = TRACK_HEIGHT / ZOOM;
const CAR_COLOURS = [
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#a855f7",
  "#ec4899",
];

const CENTRE = trackPoints(0);
const LANE_LINES = Array.from({ length: LANES - 1 }, (_, i) =>
  trackPoints((i + 1 - LANES / 2) * LANE),
);
const START = placeOnTrack(0, 1, 0);

function seatOf(car: RacingCar, cars: readonly RacingCar[]): number {
  return car.seat ?? cars.indexOf(car);
}

function colourOf(seat: number): string {
  return CAR_COLOURS[seat % CAR_COLOURS.length]!;
}

/** From the left kerb (seat 0) to the right one. */
function laneOffset(seat: number): number {
  return ((seat % LANES) - (LANES - 1) / 2) * LANE;
}

/** The camera's view, in the circuit's SVG units. */
function cameraBox(camera: { x: number; y: number }) {
  return {
    x: (camera.x - VIEW_W / 2).toFixed(1),
    y: (camera.y - VIEW_H / 2).toFixed(1),
    width: VIEW_W.toFixed(1),
    height: VIEW_H.toFixed(1),
  };
}

/**
 * The race order: those who finished first, by when; then everyone still
 * typing, furthest first; then those who left.
 */
function raceOrder(cars: readonly RacingCar[]): RacingCar[] {
  const group = (car: RacingCar) => (car.dropped ? 2 : car.finished ? 0 : 1);

  return [...cars].sort(
    (a, b) =>
      group(a) - group(b) ||
      (a.finished && b.finished
        ? (a.finishedAtMs ?? Infinity) - (b.finishedAtMs ?? Infinity)
        : b.position - a.position),
  );
}

/**
 * The Racing Theme: the Match from above on a circuit, every car exactly as
 * far along as its Player's typing. `view="follow"` zooms in on the car
 * `follow` (or the leader) with the whole circuit in a corner;
 * `view="whole"` shows the whole circuit, as in the Display preview.
 */
export function RacingTrack({
  cars,
  textLength,
  follow = null,
  view = "follow",
}: {
  cars: readonly RacingCar[];
  textLength: number;
  /** The car the camera follows; the leader when null. */
  follow?: string | null;
  view?: "follow" | "whole";
}) {
  const t = useTranslations("RacingTheme");
  const reducedMotion = useReducedMotion();
  const motion = useRaceMotion(cars);
  const grassId = useId();
  const laps = lapsFor(textLength);
  const progressOf = (car: RacingCar) =>
    Math.min(1, (motion[car.id]?.shown ?? car.position) / textLength);
  const order = raceOrder(cars);
  const leader = order[0];
  // Without a car to follow, the camera follows whoever leads the cars still racing.
  const followed =
    cars.find((car) => car.id === follow) ??
    order.find((car) => !car.finished && !car.dropped) ??
    leader;
  const you = cars.find((car) => car.isYou);
  const camera = placeOnTrack(followed ? progressOf(followed) : 0, laps, 0);
  const box = cameraBox(camera);
  const viewBox =
    view === "whole"
      ? `0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`
      : `${box.x} ${box.y} ${box.width} ${box.height}`;
  const withOrder = cars.length > 1 && view === "follow";

  return (
    <div
      className={cn("grid gap-3", withOrder && "sm:grid-cols-[1fr_11rem]")}
      data-testid="racing-track"
    >
      <div className="relative overflow-hidden rounded-xl">
        <svg
          viewBox={viewBox}
          className="block w-full bg-green-700"
          role="img"
          aria-label={t("track")}
        >
          <defs>
            <pattern
              id={grassId}
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <rect width="40" height="40" fill="#15803d" />
              <rect width="20" height="40" fill="#16a34a" />
            </pattern>
          </defs>
          <rect
            x="-600"
            y="-600"
            width={TRACK_WIDTH + 1200}
            height={TRACK_HEIGHT + 1200}
            fill={`url(#${grassId})`}
          />
          <Circuit />
          {cars.map((car) => (
            <Car
              key={car.id}
              car={car}
              seat={seatOf(car, cars)}
              progress={progressOf(car)}
              laps={laps}
              motion={motion[car.id]}
              reducedMotion={reducedMotion}
            />
          ))}
        </svg>
        {view === "follow" && (
          <>
            <WholeCircuit
              cars={cars}
              laps={laps}
              progressOf={progressOf}
              box={box}
            />
            <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
              {t("lap", {
                lap: followed ? lapOf(followed.position / textLength, laps) : 1,
                laps,
              })}
            </span>
          </>
        )}
        {you && carMood(you) === "crashed" && (
          <p
            role="status"
            className={cn(
              "absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-red-600/90 px-4 py-2 text-center font-bold text-white shadow-lg",
              !reducedMotion && "animate-pulse",
            )}
          >
            {t("crashNotice")}
          </p>
        )}
      </div>

      {withOrder && <RaceOrder order={order} cars={cars} />}
    </div>
  );
}

/** The tarmac, kerbs, lane lines and the start and finish line. */
function Circuit() {
  return (
    <>
      <polyline
        points={CENTRE}
        fill="none"
        stroke="#dc2626"
        strokeWidth={LANE * LANES + 10}
        strokeDasharray="14 14"
      />
      <polyline
        points={CENTRE}
        fill="none"
        stroke="#f8fafc"
        strokeWidth={LANE * LANES + 10}
        strokeDasharray="14 14"
        strokeDashoffset="14"
      />
      <polyline
        points={CENTRE}
        fill="none"
        stroke="#52525b"
        strokeWidth={LANE * LANES}
      />
      {LANE_LINES.map((points, i) => (
        <polyline
          key={i}
          points={points}
          fill="none"
          stroke="#e5e7eb"
          strokeOpacity={0.5}
          strokeWidth={1}
          strokeDasharray="6 8"
        />
      ))}
      <g
        transform={`translate(${START.x.toFixed(1)} ${START.y.toFixed(1)}) rotate(${((START.angle * 180) / Math.PI + 90).toFixed(1)})`}
      >
        {Array.from({ length: 36 }, (_, i) => (
          <rect
            key={i}
            x={-(LANE * LANES) / 2 + (i % 18) * ((LANE * LANES) / 18)}
            y={i < 18 ? -5 : 0}
            width={(LANE * LANES) / 18}
            height="5"
            fill={(i + Math.floor(i / 18)) % 2 ? "#111" : "#fff"}
          />
        ))}
      </g>
    </>
  );
}

function Car({
  car,
  seat,
  progress,
  laps,
  motion,
  reducedMotion,
}: {
  car: RacingCar;
  seat: number;
  progress: number;
  laps: number;
  motion: CarMotion | undefined;
  reducedMotion: boolean;
}) {
  const t = useTranslations("RacingTheme");
  const crashed = carMood(car) === "crashed";
  const pose = carPose(
    {
      skidAgeMs: crashed ? null : (motion?.skidAgeMs ?? null),
      crashAgeMs: crashed ? (motion?.crashAgeMs ?? null) : null,
    },
    reducedMotion,
  );
  const offset = laneOffset(seat);
  // A crash slides the car towards the nearer kerb and the grass beyond it.
  const towardsGrass = offset < 0 ? -1 : 1;
  const place = placeOnTrack(
    progress,
    laps,
    offset + towardsGrass * pose.slide * LANE,
  );
  const lapPosition = progress * laps;
  const tyreMarks =
    !reducedMotion && (crashed || (motion?.skidAgeMs ?? null) !== null);
  // Names side by side would overlap, so every other one goes underneath.
  const labelY = seat % 2 === 1 ? 16 : -11;

  return (
    <g opacity={car.dropped ? 0.35 : 1}>
      {tyreMarks && (
        <polyline
          points={trackPoints(offset, lapPosition - 0.025, lapPosition)}
          fill="none"
          stroke="#111"
          strokeOpacity={0.45}
          strokeWidth={3}
          strokeDasharray="2 2"
        />
      )}
      <g
        transform={`translate(${place.x.toFixed(1)} ${place.y.toFixed(1)}) rotate(${(((place.angle + pose.yaw) * 180) / Math.PI).toFixed(1)}) scale(1.3)`}
      >
        <rect
          x="-9"
          y="-4.5"
          width="18"
          height="9"
          rx="3"
          fill={colourOf(seat)}
          stroke={car.isYou ? "#fff" : "rgba(0,0,0,0.5)"}
          strokeWidth={car.isYou ? 1.5 : 0.8}
        />
        <rect
          x="1"
          y="-3"
          width="4"
          height="6"
          rx="1"
          fill="rgba(200,230,255,0.9)"
        />
      </g>
      <g transform={`translate(${place.x.toFixed(1)} ${place.y.toFixed(1)})`}>
        <text
          y={labelY}
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="#fff"
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="2"
          paintOrder="stroke"
        >
          {car.isYou ? t("you") : car.name}
        </text>
        {crashed && reducedMotion && (
          <text
            y={labelY - 9}
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#fff"
            stroke="#dc2626"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {t("stop")}
          </text>
        )}
      </g>
    </g>
  );
}

/** The whole circuit in a corner, everyone as a dot and the camera's view as a box. */
function WholeCircuit({
  cars,
  laps,
  progressOf,
  box,
}: {
  cars: readonly RacingCar[];
  laps: number;
  progressOf: (car: RacingCar) => number;
  box: ReturnType<typeof cameraBox>;
}) {
  const t = useTranslations("RacingTheme");

  return (
    <svg
      viewBox={`0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`}
      className="absolute top-2 left-2 w-32 rounded-lg bg-black/55 ring-1 ring-white/30 sm:w-40"
      role="img"
      aria-label={t("wholeCircuit")}
    >
      <polyline
        points={CENTRE}
        fill="none"
        stroke="#d4d4d8"
        strokeWidth={26}
        strokeLinejoin="round"
      />
      <rect {...box} fill="none" stroke="#fde047" strokeWidth={6} />
      {[...cars].reverse().map((car) => {
        const place = placeOnTrack(progressOf(car), laps, 0);
        return (
          <circle
            key={car.id}
            cx={place.x.toFixed(1)}
            cy={place.y.toFixed(1)}
            r={car.isYou ? 22 : 16}
            fill={colourOf(seatOf(car, cars))}
            opacity={car.dropped ? 0.35 : 1}
            stroke={car.isYou ? "#fff" : "none"}
            strokeWidth={7}
          />
        );
      })}
    </svg>
  );
}

function RaceOrder({
  order,
  cars,
}: {
  order: readonly RacingCar[];
  cars: readonly RacingCar[];
}) {
  const t = useTranslations("RacingTheme");
  const leader = order[0];

  const status = (car: RacingCar) => {
    if (car.dropped) {
      return t("left");
    }
    if (car.finished) {
      return t("finished");
    }
    if (carMood(car) === "crashed") {
      return t("crashed");
    }
    if (!leader || car === leader) {
      return t("leader");
    }

    return t("gap", { letters: leader.position - car.position });
  };

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-neutral-950 p-2 font-mono text-xs text-white">
      <ol className="flex flex-col gap-1" aria-label={t("raceOrder")}>
        {order.map((car, i) => (
          <li
            key={car.id}
            className={cn(
              "flex items-center gap-2 rounded px-1 py-0.5",
              car.isYou && "bg-white/15 font-bold",
              car.dropped && "opacity-50",
            )}
          >
            <span className="w-4 text-white/50">{i + 1}</span>
            <span
              className="h-3 w-1 rounded"
              style={{ background: colourOf(seatOf(car, cars)) }}
            />
            <span className="flex-1 truncate">
              {car.isYou ? t("you") : car.name}
            </span>
            <span className="text-white/60">{status(car)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-[10px] text-white/40">{t("gapNote")}</p>
    </div>
  );
}
