import {
  LANGUAGES,
  REAL_TEXT_KINDS,
  TEXT_LENGTHS,
  type LeaderboardBoard,
  type LeaderboardEntry,
} from "@typerace/game";
import {
  LEADERBOARD_PATH,
  leaderboardSearch,
  leaderboardSubmissionBody,
  type LeaderboardResponse,
  type LeaderboardSubmission,
} from "@typerace/protocol";
import { roomsOrigin } from "./rooms-host";

export async function fetchLeaderboard(
  host: string,
  board: LeaderboardBoard,
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  const response = await fetch(
    `${roomsOrigin(host)}${LEADERBOARD_PATH}?${leaderboardSearch(board)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Leaderboard: ${response.status}`);
  }

  return ((await response.json()) as LeaderboardResponse).entries;
}

/**
 * Sends a Shared Keyboard's finished Hot Seat Match or solo race; Rooms
 * record their own.
 */
export async function submitToLeaderboard(
  host: string,
  submission: LeaderboardSubmission,
): Promise<void> {
  const response = await fetch(`${roomsOrigin(host)}${LEADERBOARD_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leaderboardSubmissionBody(submission)),
  });
  if (!response.ok) {
    throw new Error(`Leaderboard: ${response.status}`);
  }
}

/** The Leaderboard page, opened on a board. */
export function leaderboardHref({
  kind,
  language,
  textLength,
}: LeaderboardBoard): string {
  return `/leaderboard?${new URLSearchParams({ source: kind, language, length: textLength })}`;
}

/**
 * The board a Leaderboard page link stands for: English for a link without
 * a valid Language, Words without a valid Text Source, like the old links to
 * Gibberish boards, and Medium without a valid Text Length, like the links
 * from before boards had one.
 */
export function boardOfLeaderboardHref(
  params: URLSearchParams,
): LeaderboardBoard {
  const source = params.get("source");
  const language = params.get("language");
  const length = params.get("length");

  return {
    kind: REAL_TEXT_KINDS.find((kind) => kind === source) ?? "words",
    language: LANGUAGES.find((known) => known === language) ?? "en",
    textLength: TEXT_LENGTHS.find((known) => known === length) ?? "medium",
  };
}
