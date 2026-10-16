"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { carMood, carPose, SKID_MS } from "./car-motion";
import {
  lapsFor,
  placeOnTrack,
  TRACK_HEIGHT,
  TRACK_WIDTH,
  trackPoints,
} from "./track";
import {
  useRaceMotion,
  useReducedMotion,
  type CarTyping,
} from "./use-race-motion";

/** One car on the circuit: a Player's typing, as far along as they are. */
export interface RacingCar extends CarTyping {
  name: string;
  finished: boolean;
  /** Left the Room; their car stays where it was, faded. */
  dropped?: boolean;
  /** This browser's own Player. */
  you?: boolean;
}

const LANE = 16;
const LANES = 6;
/** How much the follow camera zooms in. */
const ZOOM = 1.8;
const VIEW_W = TRACK_WIDTH / ZOOM;
const VIEW_H = TRACK_HEIGHT / ZOOM;
/** A colour per car, in the Room's order, so everyone sees the same colours. */
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

function laneOffset(index: number): number {
  return ((index % LANES) - (LANES - 1) / 2) * LANE;
}

/**
 * The Racing Theme: the race from above on a circuit, every car exactly as
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
  const order = [...cars].sort((a, b) => b.position - a.position);
  const leader = order.find((car) => !car.dropped) ?? order[0];
  const followed = cars.find((car) => car.id === follow) ?? leader;
  const you = cars.find((car) => car.you);
  const youCrashed =
    you !== undefined && carMood(you) === "crashed" && !you.finished;
  const camera = placeOnTrack(followed ? progressOf(followed) : 0, laps, 0);
  const lap = followed
    ? Math.min(laps, Math.floor((followed.position / textLength) * laps) + 1)
    : 1;
  const viewBox =
    view === "whole"
      ? `0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`
      : `${(camera.x - VIEW_W / 2).toFixed(1)} ${(camera.y - VIEW_H / 2).toFixed(1)} ${VIEW_W.toFixed(1)} ${VIEW_H.toFixed(1)}`;

  return (
    <div
      className={cn(
        "grid gap-3",
        cars.length > 1 && view === "follow" && "sm:grid-cols-[1fr_11rem]",
      )}
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
          {cars.map((car, index) => (
            <Car
              key={car.id}
              car={car}
              index={index}
              progress={progressOf(car)}
              laps={laps}
              motion={motion[car.id]}
              reducedMotion={reducedMotion}
              label={car.you ? t("you") : car.name}
              stopLabel={t("stop")}
            />
          ))}
        </svg>
        {view === "follow" && (
          <WholeCircuit
            cars={cars}
            laps={laps}
            progressOf={progressOf}
            camera={camera}
            label={t("wholeCircuit")}
          />
        )}
        {view === "follow" && (
          <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
            {t("lap", { lap, laps })}
          </span>
        )}
        {youCrashed && (
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

      {cars.length > 1 && view === "follow" && (
        <RaceOrder
          order={order}
          leader={leader}
          colourOf={(car) =>
            CAR_COLOURS[cars.indexOf(car) % CAR_COLOURS.length]!
          }
        />
      )}
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
  index,
  progress,
  laps,
  motion,
  reducedMotion,
  label,
  stopLabel,
}: {
  car: RacingCar;
  index: number;
  progress: number;
  laps: number;
  motion: ReturnType<typeof useRaceMotion>[string] | undefined;
  reducedMotion: boolean;
  label: string;
  stopLabel: string;
}) {
  const mood = carMood(car);
  const pose = carPose(
    {
      skidAgeMs: mood === "skidding" ? (motion?.skidAgeMs ?? null) : null,
      crashAgeMs: mood === "crashed" ? (motion?.crashAgeMs ?? null) : null,
    },
    reducedMotion,
  );
  const offset = laneOffset(index);
  const place = placeOnTrack(progress, laps, offset + pose.slide * LANE);
  const lapPosition = progress * laps;
  const skidding =
    mood === "skidding" &&
    motion?.skidAgeMs !== null &&
    (motion?.skidAgeMs ?? SKID_MS) < SKID_MS;
  const tyreMarks = !reducedMotion && (skidding || mood === "crashed");
  const colour = CAR_COLOURS[index % CAR_COLOURS.length]!;
  // Names side by side would overlap, so every other one goes underneath.
  const labelY = index % 2 === 1 ? 16 : -11;

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
          fill={colour}
          stroke={car.you ? "#fff" : "rgba(0,0,0,0.5)"}
          strokeWidth={car.you ? 1.5 : 0.8}
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
          {label}
        </text>
        {mood === "crashed" && reducedMotion && (
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
            ⚠ {stopLabel}
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
  camera,
  label,
}: {
  cars: readonly RacingCar[];
  laps: number;
  progressOf: (car: RacingCar) => number;
  camera: { x: number; y: number };
  label: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`}
      className="absolute top-2 left-2 w-32 rounded-lg bg-black/55 ring-1 ring-white/30 sm:w-40"
      role="img"
      aria-label={label}
    >
      <polyline
        points={CENTRE}
        fill="none"
        stroke="#d4d4d8"
        strokeWidth={26}
        strokeLinejoin="round"
      />
      <rect
        x={(camera.x - VIEW_W / 2).toFixed(1)}
        y={(camera.y - VIEW_H / 2).toFixed(1)}
        width={VIEW_W.toFixed(1)}
        height={VIEW_H.toFixed(1)}
        fill="none"
        stroke="#fde047"
        strokeWidth={6}
      />
      {[...cars].reverse().map((car) => {
        const place = placeOnTrack(progressOf(car), laps, 0);
        return (
          <circle
            key={car.id}
            cx={place.x.toFixed(1)}
            cy={place.y.toFixed(1)}
            r={car.you ? 22 : 16}
            fill={CAR_COLOURS[cars.indexOf(car) % CAR_COLOURS.length]}
            opacity={car.dropped ? 0.35 : 1}
            stroke={car.you ? "#fff" : "none"}
            strokeWidth={7}
          />
        );
      })}
    </svg>
  );
}

function RaceOrder({
  order,
  leader,
  colourOf,
}: {
  order: readonly RacingCar[];
  leader: RacingCar | undefined;
  colourOf: (car: RacingCar) => string;
}) {
  const t = useTranslations("RacingTheme");

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
    if (car === leader || !leader) {
      return "–";
    }

    return t("gap", {
      letters: leader.position - car.position,
    });
  };

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-neutral-950 p-2 font-mono text-xs text-white">
      <ol className="flex flex-col gap-1" aria-label={t("raceOrder")}>
        {order.map((car, i) => (
          <li
            key={car.id}
            className={cn(
              "flex items-center gap-2 rounded px-1 py-0.5",
              car.you && "bg-white/15 font-bold",
              car.dropped && "opacity-50",
            )}
          >
            <span className="w-4 text-white/50">{i + 1}</span>
            <span
              className="h-3 w-1 rounded"
              style={{ background: colourOf(car) }}
            />
            <span className="flex-1 truncate">
              {car.you ? t("you") : car.name}
            </span>
            <span className="text-white/60">{status(car)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-[10px] text-white/40">{t("gapNote")}</p>
    </div>
  );
}
