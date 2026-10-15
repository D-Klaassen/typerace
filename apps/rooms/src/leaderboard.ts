import {
  addToLeaderboard,
  leaderboardBoard,
  type KeySet,
  type LeaderboardEntry,
  type LeaderboardRecord,
} from "@typerace/game";
import {
  parseLeaderboardSearch,
  parseLeaderboardSubmission,
  type LeaderboardResponse,
} from "@typerace/protocol";
import { DurableObject } from "cloudflare:workers";

/**
 * The one Leaderboard for everyone: a single Durable Object that keeps every
 * board in its storage. A Durable Object handles one request at a time, so
 * reading a board and writing it back can't lose a concurrent record.
 */
export class Leaderboard extends DurableObject<Env> {
  async top(keySet: KeySet): Promise<LeaderboardEntry[]> {
    return (
      (await this.ctx.storage.get<LeaderboardEntry[]>(
        leaderboardBoard(keySet),
      )) ?? []
    );
  }

  async record(
    keySet: KeySet,
    records: readonly LeaderboardRecord[],
  ): Promise<void> {
    await this.ctx.storage.put(
      leaderboardBoard(keySet),
      addToLeaderboard(await this.top(keySet), records, Date.now()),
    );
  }
}

export function leaderboardOf(env: Env) {
  return env.Leaderboard.get(env.Leaderboard.idFromName("global"));
}

/** The web app runs on another origin, and the boards are public anyway. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * GET a Key Set's board, or POST a Shared Keyboard's finished Time Trial.
 * Online Time Trials are recorded by their Room, which timed them itself.
 */
export async function leaderboardResponse(
  request: Request,
  env: Env,
): Promise<Response> {
  switch (request.method) {
    case "OPTIONS":
      return new Response(null, { status: 204, headers: CORS_HEADERS });

    case "GET": {
      const keySet = parseLeaderboardSearch(new URL(request.url).searchParams);
      if (!keySet) {
        return text("Bad Request", 400);
      }
      const body: LeaderboardResponse = {
        entries: await leaderboardOf(env).top(keySet),
      };

      return Response.json(body, { headers: CORS_HEADERS });
    }

    case "POST": {
      const submission = parseLeaderboardSubmission(
        await request.json().catch(() => null),
      );
      if (!submission) {
        return text("Bad Request", 400);
      }
      await leaderboardOf(env).record(submission.keySet, submission.records);

      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    default:
      return text("Method Not Allowed", 405);
  }
}

function text(body: string, status: number): Response {
  return new Response(body, { status, headers: CORS_HEADERS });
}
