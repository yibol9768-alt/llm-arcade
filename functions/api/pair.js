// GET /api/pair?track=<track>
// Serve a signed random pairing, lightly balanced toward least-voted pairs.
import { jsonResponse, errorResponse } from "../_lib/http.js";
import { getActiveParticipants, getPairCounts } from "../_lib/db.js";
import { pickPair } from "../_lib/sampling.js";
import { signPairToken } from "../_lib/hmac.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.PAIR_SECRET) {
    return errorResponse("config_error", "PAIR_SECRET is not configured", 500);
  }

  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  if (!track || !/^[a-z0-9_-]{1,64}$/i.test(track)) {
    return errorResponse("bad_request", "missing or invalid 'track' query parameter", 400);
  }

  try {
    const dirs = await getActiveParticipants(env.DB, track);
    if (dirs.length < 2) {
      return errorResponse(
        "track_not_found",
        `track '${track}' has fewer than 2 active participants`,
        404,
      );
    }

    const counts = await getPairCounts(env.DB, track);
    const { aDir, bDir } = pickPair(dirs, counts);
    const issuedAt = Math.floor(Date.now() / 1000);
    const pairId = await signPairToken(env.PAIR_SECRET, {
      track,
      aDir,
      bDir,
      issuedAt,
    });

    return jsonResponse({
      pair_id: pairId,
      track,
      a: { slot: "A", dir: aDir },
      b: { slot: "B", dir: bDir },
      issued_at: issuedAt,
    });
  } catch (err) {
    console.error("pair error:", err);
    return errorResponse("internal", "internal error", 500);
  }
}
