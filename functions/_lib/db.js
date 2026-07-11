// Thin D1 query helpers. All queries are parameterized.
import { pairKey } from "./sampling.js";

let voterClaimsReady = false;

/** Runtime-safe schema initialization, also backfills historical votes. */
export async function ensureVoterPairClaims(db) {
  if (voterClaimsReady) return;
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS voter_pair_claims (" +
        "voter_hash TEXT NOT NULL, track TEXT NOT NULL, pair_key TEXT NOT NULL, created_at INTEGER NOT NULL, " +
        "PRIMARY KEY (voter_hash, track, pair_key))",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO voter_pair_claims (voter_hash, track, pair_key, created_at) " +
        "SELECT voter_hash, track, CASE WHEN a_dir < b_dir THEN a_dir || '|' || b_dir ELSE b_dir || '|' || a_dir END, MIN(created_at) " +
        "FROM votes GROUP BY voter_hash, track, CASE WHEN a_dir < b_dir THEN a_dir || '|' || b_dir ELSE b_dir || '|' || a_dir END",
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_voter_pair_claims_track ON voter_pair_claims (track, pair_key)",
    ),
  ]);
  voterClaimsReady = true;
}

/** Active entrant dirs for a track, alphabetical. */
export async function getActiveParticipants(db, track) {
  const { results } = await db
    .prepare(
      "SELECT dir FROM participants WHERE track = ?1 AND active = 1 ORDER BY dir",
    )
    .bind(track)
    .all();
  return results.map((r) => r.dir);
}

/** Map(unordered pairKey -> vote count) for a track. */
export async function getPairCounts(db, track) {
  const { results } = await db
    .prepare(
      "SELECT a_dir, b_dir, COUNT(*) AS c FROM votes WHERE track = ?1 GROUP BY a_dir, b_dir",
    )
    .bind(track)
    .all();
  const counts = new Map();
  for (const r of results) {
    const key = pairKey(r.a_dir, r.b_dir);
    counts.set(key, (counts.get(key) || 0) + r.c);
  }
  return counts;
}

/** Matchups this visitor has already judged in one track. */
export async function getVoterPairKeys(db, voterHash, track) {
  const { results } = await db
    .prepare(
      "SELECT pair_key FROM voter_pair_claims WHERE voter_hash = ?1 AND track = ?2 ORDER BY created_at",
    )
    .bind(voterHash, track)
    .all();
  return new Set(results.map((row) => row.pair_key));
}

/** All votes for a track in chronological order (created_at, then id). */
export async function getVotesForTrack(db, track) {
  const { results } = await db
    .prepare(
      "SELECT a_dir, b_dir, winner FROM votes WHERE track = ?1 ORDER BY created_at, id",
    )
    .bind(track)
    .all();
  return results;
}

/** Number of votes by this voter since the given unix timestamp. */
export async function countVotesSince(db, voterHash, sinceTs) {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM votes WHERE voter_hash = ?1 AND created_at >= ?2",
    )
    .bind(voterHash, sinceTs)
    .first();
  return row ? row.c : 0;
}

/**
 * Insert a vote. Returns { ok: true } or { ok: false, duplicate: true } when
 * the pair_id was already used (UNIQUE constraint).
 */
export async function insertVote(db, vote) {
  try {
    const pairClaim = db
      .prepare(
        "INSERT INTO voter_pair_claims (voter_hash, track, pair_key, created_at) VALUES (?1, ?2, ?3, ?4)",
      )
      .bind(vote.voterHash, vote.track, pairKey(vote.aDir, vote.bDir), vote.createdAt);
    const voteInsert = db.prepare(
        "INSERT INTO votes (track, a_dir, b_dir, winner, pair_id, voter_hash, created_at) " +
          "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      )
      .bind(
        vote.track,
        vote.aDir,
        vote.bDir,
        vote.winner,
        vote.pairId,
        vote.voterHash,
        vote.createdAt,
      );
    await db.batch([pairClaim, voteInsert]);
    return { ok: true };
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (msg.includes("voter_pair_claims")) {
      return { ok: false, repeatedPair: true };
    }
    if (msg.includes("UNIQUE constraint failed")) {
      return { ok: false, duplicate: true };
    }
    throw err;
  }
}

/** Vote counts per registered track (tracks with zero votes included). */
export async function getTrackStats(db) {
  const { results } = await db
    .prepare(
      "SELECT p.track AS track, COUNT(v.id) AS votes " +
        "FROM (SELECT DISTINCT track FROM participants) p " +
        "LEFT JOIN votes v ON v.track = p.track " +
        "GROUP BY p.track ORDER BY p.track",
    )
    .all();
  return results;
}
