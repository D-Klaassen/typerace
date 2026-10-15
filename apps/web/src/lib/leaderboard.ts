import {
  DEFAULT_KEY_SET_CHOICE,
  findPreset,
  type KeySet,
  type KeySetChoice,
  type LeaderboardEntry,
} from "@typerace/game";
import {
  LEADERBOARD_PATH,
  leaderboardSearch,
  type LeaderboardResponse,
  type LeaderboardSubmission,
} from "@typerace/protocol";
import { roomsOrigin } from "./rooms-host";

export async function fetchLeaderboard(
  host: string,
  keySet: KeySet,
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  const response = await fetch(
    `${roomsOrigin(host)}${LEADERBOARD_PATH}?${leaderboardSearch(keySet)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Leaderboard: ${response.status}`);
  }

  return ((await response.json()) as LeaderboardResponse).entries;
}

/** Sends a Shared Keyboard's finished Time Trial; Rooms record their own. */
export async function submitToLeaderboard(
  host: string,
  submission: LeaderboardSubmission,
): Promise<void> {
  const response = await fetch(`${roomsOrigin(host)}${LEADERBOARD_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  if (!response.ok) {
    throw new Error(`Leaderboard: ${response.status}`);
  }
}

/** The Leaderboard page, opened on the board of a Key Set. */
export function leaderboardHref(
  keySet: KeySetChoice,
  capitals: boolean,
): string {
  const params = new URLSearchParams(
    "preset" in keySet ? { preset: keySet.preset } : { custom: keySet.custom },
  );
  if (capitals) {
    params.set("capitals", "true");
  }

  return `/leaderboard?${params}`;
}

/** The Key Set a Leaderboard page link stands for; Medium without a valid one. */
export function keySetOfLeaderboardHref(params: URLSearchParams): {
  keySet: KeySetChoice;
  capitals: boolean;
} {
  const preset = params.get("preset");
  const custom = params.get("custom");

  return {
    keySet:
      preset !== null && findPreset(preset)
        ? { preset }
        : custom !== null
          ? { custom }
          : DEFAULT_KEY_SET_CHOICE,
    capitals: params.get("capitals") === "true",
  };
}
