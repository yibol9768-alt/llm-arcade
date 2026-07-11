// GET /api/leaderboard?track=<track>
// Recomputes the leaderboard from all votes (Elo replay + Bradley-Terry) and
// caches the response in the Cache API for LEADERBOARD_CACHE_SECONDS.
import { CONFIG } from "../_lib/config.js";
import { jsonResponse, errorResponse } from "../_lib/http.js";
import { getActiveParticipants, getVotesForTrack } from "../_lib/db.js";
import { computeElo, computeBradleyTerry, tallyRecords } from "../_lib/rating.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  if (!track || !/^[a-z0-9_-]{1,64}$/i.test(track)) {
    return errorResponse("bad_request", "missing or invalid 'track' query parameter", 400);
  }

  // Normalized cache key: same track always maps to the same cached entry.
  const cacheKey = new Request(
    `${url.origin}/api/leaderboard?track=${encodeURIComponent(track)}`,
    { method: "GET" },
  );
  let cache = null;
  try {
    cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch {
    // Cache API unavailable (some local dev setups); fall through.
  }

  try {
    const dirs = await getActiveParticipants(env.DB, track);
    if (dirs.length === 0) {
      return errorResponse("track_not_found", `unknown track '${track}'`, 404);
    }

    const votes = await getVotesForTrack(env.DB, track);
    // Ratings replay over every dir that ever appears in the vote history,
    // so retiring an entrant (active=0) does not silently rewrite everyone
    // else's Elo. Only active entrants are listed in the response.
    const allDirs = [...new Set([
      ...dirs,
      ...votes.flatMap((v) => [v.a_dir, v.b_dir]),
    ])];
    const elo = computeElo(votes, allDirs);
    const records = tallyRecords(votes, allDirs);

    const btReady = votes.length >= CONFIG.BT_MIN_VOTES;
    const bt = btReady
      ? computeBradleyTerry(votes, allDirs)
      : { scores: new Map(allDirs.map((d) => [d, null])) };

    const entries = dirs
      .map((dir) => {
        const rec = records.get(dir);
        const btScore = bt.scores.get(dir);
        return {
          dir,
          elo: Math.round(elo.get(dir) * 10) / 10,
          bt_score: btScore === null ? null : Math.round(btScore * 1e6) / 1e6,
          wins: rec.wins,
          losses: rec.losses,
          ties: rec.ties,
          games: rec.games,
        };
      })
      .sort((x, y) => y.elo - x.elo);

    const response = jsonResponse(
      {
        track,
        total_votes: votes.length,
        updated_at: Math.floor(Date.now() / 1000),
        bt_min_votes: CONFIG.BT_MIN_VOTES,
        bt_ready: btReady,
        entries,
      },
      200,
      {
        "Cache-Control": `public, max-age=${CONFIG.LEADERBOARD_CACHE_SECONDS}`,
      },
    );

    if (cache) {
      const store = cache.put(cacheKey, response.clone());
      if (typeof context.waitUntil === "function") context.waitUntil(store);
      else await store;
    }
    return response;
  } catch (err) {
    console.error("leaderboard error:", err);
    return errorResponse("internal", "internal error", 500);
  }
}
