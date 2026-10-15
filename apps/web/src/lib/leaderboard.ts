import {
  DEFAULT_KEY_SET_CHOICE,
  findPreset,
  LANGUAGES,
  REAL_TEXT_KINDS,
  type LeaderboardEntry,
  type TextChoice,
  type TextSource,
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
  textSource: TextSource,
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

/**
 * The Leaderboard page, opened on the board of the chosen text: a Key Set's
 * for Gibberish, else the Text Source and Language.
 */
export function leaderboardHref({
  textSource,
  language,
  keySet,
  capitals,
}: TextChoice): string {
  if (textSource !== "gibberish") {
    return `/leaderboard?${new URLSearchParams({ source: textSource, language })}`;
  }
  const params = new URLSearchParams(
    "preset" in keySet ? { preset: keySet.preset } : { custom: keySet.custom },
  );
  if (capitals) {
    params.set("capitals", "true");
  }

  return `/leaderboard?${params}`;
}

/**
 * The text a Leaderboard page link stands for: Gibberish with Medium keys
 * without a valid one, and English for a Text Source without a Language.
 */
export function textChoiceOfLeaderboardHref(
  params: URLSearchParams,
): TextChoice {
  const source = params.get("source");
  const language = params.get("language");
  const preset = params.get("preset");
  const custom = params.get("custom");

  return {
    textSource: REAL_TEXT_KINDS.find((kind) => kind === source) ?? "gibberish",
    language: LANGUAGES.find((known) => known === language) ?? "en",
    keySet:
      preset !== null && findPreset(preset)
        ? { preset }
        : custom !== null
          ? { custom }
          : DEFAULT_KEY_SET_CHOICE,
    capitals: params.get("capitals") === "true",
  };
}
