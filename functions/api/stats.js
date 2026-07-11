// GET /api/stats
// Vote totals per track. Cheap single query, served uncached.
import { jsonResponse, errorResponse } from "../_lib/http.js";
import { getTrackStats } from "../_lib/db.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const rows = await getTrackStats(env.DB);
    const tracks = rows.map((r) => ({ track: r.track, votes: r.votes }));
    const totalVotes = tracks.reduce((s, t) => s + t.votes, 0);
    return jsonResponse({ tracks, total_votes: totalVotes });
  } catch (err) {
    console.error("stats error:", err);
    return errorResponse("internal", "internal error", 500);
  }
}
