// POST /api/vote  body: { pair_id, winner: "A" | "B" | "tie" }
// Validates the signed pair token, enforces anti-abuse rules, stores the
// vote, and only then reveals which entrant was in which slot.
import { CONFIG } from "../_lib/config.js";
import { jsonResponse, errorResponse, readJsonBody } from "../_lib/http.js";
import { verifyPairToken, sha256Hex } from "../_lib/hmac.js";
import { countVotesSince, insertVote } from "../_lib/db.js";

const WINNERS = new Set(["A", "B", "tie"]);

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.PAIR_SECRET || !env.SALT) {
    return errorResponse("config_error", "PAIR_SECRET or SALT is not configured", 500);
  }

  const body = await readJsonBody(request);
  if (!body) {
    return errorResponse("bad_request", "body must be a JSON object", 400);
  }
  const { pair_id: pairId, winner } = body;
  if (typeof pairId !== "string" || pairId.length === 0) {
    return errorResponse("bad_request", "'pair_id' is required", 400);
  }
  if (typeof winner !== "string" || !WINNERS.has(winner)) {
    return errorResponse("bad_request", "'winner' must be 'A', 'B' or 'tie'", 400);
  }

  const payload = await verifyPairToken(env.PAIR_SECRET, pairId);
  if (!payload) {
    return errorResponse("invalid_pair", "pair_id signature is invalid", 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - payload.issuedAt;
  if (age > CONFIG.MAX_PAIR_AGE_SECONDS) {
    return errorResponse("pair_expired", "pair_id has expired, request a new pair", 400);
  }

  try {
    // voter_hash: server-side fingerprint; the raw IP is never stored.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown-ip";
    const ua = request.headers.get("User-Agent") || "unknown-ua";
    const voterHash = await sha256Hex(`${ip}|${ua}|${env.SALT}`);

    const utcDayStart = Math.floor(now / 86400) * 86400;
    const todayCount = await countVotesSince(env.DB, voterHash, utcDayStart);
    if (todayCount >= CONFIG.DAILY_VOTE_LIMIT) {
      return errorResponse(
        "rate_limited",
        `daily vote limit reached (${CONFIG.DAILY_VOTE_LIMIT} per day)`,
        429,
      );
    }

    const inserted = await insertVote(env.DB, {
      track: payload.track,
      aDir: payload.aDir,
      bDir: payload.bDir,
      winner,
      pairId,
      voterHash,
      createdAt: now,
    });
    if (!inserted.ok && inserted.duplicate) {
      return errorResponse("already_voted", "this pair_id has already been used", 409);
    }

    return jsonResponse({
      ok: true,
      revealed: { a_dir: payload.aDir, b_dir: payload.bDir },
    });
  } catch (err) {
    console.error("vote error:", err);
    return errorResponse("internal", "internal error", 500);
  }
}
