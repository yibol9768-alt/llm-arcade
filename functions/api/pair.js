// GET /api/pair?track=<track>
// Serve a signed random pairing, lightly balanced toward least-voted pairs.
import { jsonResponse, errorResponse } from "../_lib/http.js";
import { CONFIG } from "../_lib/config.js";
import { ensureVoterPairClaims, getActiveParticipants, getPairCounts, getVoterPairKeys } from "../_lib/db.js";
import { pickPair } from "../_lib/sampling.js";
import { signPairToken } from "../_lib/hmac.js";
import { getVoterHash } from "../_lib/voter.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.PAIR_SECRET || !env.SALT) {
    return errorResponse("config_error", "PAIR_SECRET or SALT is not configured", 500);
  }

  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  if (!track || !/^[a-z0-9_-]{1,64}$/i.test(track)) {
    return errorResponse("bad_request", "missing or invalid 'track' query parameter", 400);
  }

  try {
    await ensureVoterPairClaims(env.DB);
    const dirs = await getActiveParticipants(env.DB, track);
    if (dirs.length < 2) {
      return errorResponse(
        "track_not_found",
        `track '${track}' has fewer than 2 active participants`,
        404,
      );
    }

    const voterHash = await getVoterHash(request, env.SALT);
    const judgedPairs = await getVoterPairKeys(env.DB, voterHash, track);
    if (judgedPairs.size >= CONFIG.TRACK_VOTE_LIMIT) {
      return errorResponse(
        "track_vote_limit_reached",
        `track vote limit reached (${CONFIG.TRACK_VOTE_LIMIT})`,
        429,
      );
    }

    const counts = await getPairCounts(env.DB, track);
    const picked = pickPair(dirs, counts, Math.random, judgedPairs);
    if (!picked) {
      return errorResponse("track_complete", "all matchups have been judged", 409);
    }
    const { aDir, bDir } = picked;
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
      quota: {
        limit: CONFIG.TRACK_VOTE_LIMIT,
        used: judgedPairs.size,
        remaining: CONFIG.TRACK_VOTE_LIMIT - judgedPairs.size,
      },
    });
  } catch (err) {
    console.error("pair error:", err);
    return errorResponse("internal", "internal error", 500);
  }
}
