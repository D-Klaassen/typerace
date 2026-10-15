/**
 * Where the Rooms server lives; it also serves the Leaderboard. Only
 * development falls back to the local `wrangler dev`; a production build
 * without it can't play Online or reach the Leaderboard.
 */
export const ROOMS_HOST =
  process.env.NEXT_PUBLIC_ROOMS_HOST ??
  (process.env.NODE_ENV === "development" ? "localhost:8787" : null);

/** The Rooms server over HTTP, picking http where partysocket picks ws. */
export function roomsOrigin(host: string): string {
  const local =
    /^(localhost:|127\.0\.0\.1:|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      host,
    );

  return `${local ? "http" : "https"}://${host}`;
}
