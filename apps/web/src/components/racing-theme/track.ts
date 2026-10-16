/**
 * The Racing Theme's circuit, seen from above (see CONTEXT.md: Racing Theme).
 * Pure geometry in SVG units; the race is drawn from it.
 */

const CHARACTERS_PER_LAP = 100;

/** How many laps a text of `textLength` characters is: about one per 100. */
export function lapsFor(textLength: number): number {
  return Math.max(1, Math.round(textLength / CHARACTERS_PER_LAP));
}

/** Which lap (from 1) a car `progress` (0–1) of the way through `laps` laps is on. */
export function lapOf(progress: number, laps: number): number {
  return Math.min(laps, Math.floor(progress * laps) + 1);
}

/** The SVG box the whole circuit fits in. */
export const TRACK_WIDTH = 960;
export const TRACK_HEIGHT = 500;
const SAMPLES = 720;

/** The centre line, sampled once, with the distance along it at each sample. */
const CENTRE_LINE = (() => {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const a = (i / SAMPLES) * Math.PI * 2;
    points.push({
      x: 470 + 390 * Math.cos(a) + 40 * Math.cos(2 * a),
      y: 245 + 165 * Math.sin(a) + 45 * Math.sin(3 * a),
    });
  }
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    const q = points[i - 1]!;
    lengths.push(lengths[i - 1]! + Math.hypot(p.x - q.x, p.y - q.y));
  }

  return { points, lengths, total: lengths.at(-1)! };
})();

export interface TrackPlace {
  x: number;
  y: number;
  /** Direction of travel, in radians. */
  angle: number;
}

/**
 * Where a car `progress` (0–1) of the way through a text of `laps` laps is,
 * `offset` units to the right of the centre line. 0 and 1 are both on the
 * start line.
 */
export function placeOnTrack(
  progress: number,
  laps: number,
  offset: number,
): TrackPlace {
  const lap = (((progress * laps) % 1) + 1) % 1;
  const target = lap * CENTRE_LINE.total;
  let i = 1;
  while (
    i < CENTRE_LINE.lengths.length - 1 &&
    CENTRE_LINE.lengths[i]! < target
  ) {
    i++;
  }
  const a = CENTRE_LINE.points[i - 1]!;
  const b = CENTRE_LINE.points[i]!;
  const from = CENTRE_LINE.lengths[i - 1]!;
  const k = (target - from) / (CENTRE_LINE.lengths[i]! - from || 1);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);

  return {
    x: a.x + (b.x - a.x) * k - Math.sin(angle) * offset,
    y: a.y + (b.y - a.y) * k + Math.cos(angle) * offset,
    angle,
  };
}

/** The centre line (moved `offset` to the right) from lap position `from` to `to`, as SVG points. */
export function trackPoints(offset: number, from = 0, to = 1): string {
  const steps = Math.max(2, Math.round((to - from) * 240));

  return Array.from({ length: steps + 1 }, (_, i) => {
    const place = placeOnTrack(from + ((to - from) * i) / steps, 1, offset);
    return `${place.x.toFixed(1)},${place.y.toFixed(1)}`;
  }).join(" ");
}
