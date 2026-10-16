import {
  LANGUAGES,
  REAL_TEXT_KINDS,
  type LeaderboardEntry,
  type RealTextSource,
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
  textSource: RealTextSource,
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  const response = await fetch(
    `${roomsOrigin(host)}${LEADERBOARD_PATH}?${leaderboardSearch(textSource)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Leaderboard: ${response.status}`);
  }

  return ((await response.json()) as LeaderboardResponse).entries;
}

/** Sends a Shared Keyboard's finished Hot Seat Match; Rooms record their own. */
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

/** The Leaderboard page, opened on the board of a Text Source and Language. */
export function leaderboardHref({ kind, language }: RealTextSource): string {
  return `/leaderboard?${new URLSearchParams({ source: kind, language })}`;
}

/**
 * The board a Leaderboard page link stands for: English for a link without
 * a valid Language, and Words without a valid Text Source, like the old
 * links to Gibberish boards.
 */
export function textSourceOfLeaderboardHref(
  params: URLSearchParams,
): RealTextSource {
  const source = params.get("source");
  const language = params.get("language");

  return {
    kind: REAL_TEXT_KINDS.find((kind) => kind === source) ?? "words",
    language: LANGUAGES.find((known) => known === language) ?? "en",
  };
}
