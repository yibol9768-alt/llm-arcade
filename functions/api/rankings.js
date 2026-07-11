// GET/POST /api/rankings?track=<track>
// Stores one complete ordering per pseudonymous visitor and aggregates average rank.
import { jsonResponse, errorResponse, readJsonBody } from "../_lib/http.js";
import { getActiveParticipants } from "../_lib/db.js";
import { getVoterHash } from "../_lib/voter.js";
import { aggregateCompleteRankings, validateCompleteRanking } from "../_lib/ranking.js";

function readTrack(request) {
  const track = new URL(request.url).searchParams.get("track");
  return track && /^[a-z0-9_-]{1,64}$/i.test(track) ? track : null;
}

async function readBallots(db, track) {
  const { results } = await db.prepare(
    "SELECT ranking_json FROM ranking_ballots WHERE track = ?1 ORDER BY updated_at, voter_hash",
  ).bind(track).all();
  return results.map((row) => {
    try { return JSON.parse(row.ranking_json); } catch { return null; }
  }).filter(Boolean);
}

async function responseFor(context, track, voterHash, status = 200) {
  const dirs = await getActiveParticipants(context.env.DB, track);
  if (dirs.length < 2) return errorResponse("track_not_ready", `track '${track}' has fewer than 2 active participants`, 409);
  const [ballots, mine] = await Promise.all([
    readBallots(context.env.DB, track),
    context.env.DB.prepare(
      "SELECT ranking_json, updated_at FROM ranking_ballots WHERE track = ?1 AND voter_hash = ?2",
    ).bind(track, voterHash).first(),
  ]);
  const aggregate = aggregateCompleteRankings(ballots, dirs);
  let myOrder = null;
  try { myOrder = mine ? JSON.parse(mine.ranking_json) : null; } catch { myOrder = null; }
  return jsonResponse({
    track,
    ...aggregate,
    my_order: validateCompleteRanking(myOrder, dirs) ? myOrder : null,
    my_updated_at: mine ? mine.updated_at : null,
  }, status);
}

export async function onRequestGet(context) {
  const track = readTrack(context.request);
  if (!track) return errorResponse("bad_request", "missing or invalid 'track' query parameter", 400);
  if (!context.env.SALT) return errorResponse("config_error", "SALT is not configured", 500);
  try {
    return await responseFor(context, track, await getVoterHash(context.request, context.env.SALT));
  } catch (error) {
    console.error("rankings GET error:", error);
    return errorResponse("internal", "internal error", 500);
  }
}

export async function onRequestPost(context) {
  const track = readTrack(context.request);
  if (!track) return errorResponse("bad_request", "missing or invalid 'track' query parameter", 400);
  if (!context.env.SALT) return errorResponse("config_error", "SALT is not configured", 500);
  const body = await readJsonBody(context.request, 8192);
  if (!body) return errorResponse("bad_request", "body must be a JSON object", 400);
  try {
    const dirs = await getActiveParticipants(context.env.DB, track);
    if (dirs.length < 2) return errorResponse("track_not_ready", `track '${track}' has fewer than 2 active participants`, 409);
    if (!validateCompleteRanking(body.order, dirs)) {
      return errorResponse("invalid_ranking", "order must contain every active participant exactly once", 400);
    }
    const voterHash = await getVoterHash(context.request, context.env.SALT);
    const now = Math.floor(Date.now() / 1000);
    await context.env.DB.prepare(
      "INSERT INTO ranking_ballots (track, voter_hash, ranking_json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4) " +
      "ON CONFLICT(track, voter_hash) DO UPDATE SET ranking_json = excluded.ranking_json, updated_at = excluded.updated_at",
    ).bind(track, voterHash, JSON.stringify(body.order), now).run();
    return await responseFor(context, track, voterHash, 201);
  } catch (error) {
    console.error("rankings POST error:", error);
    return errorResponse("internal", "internal error", 500);
  }
}
