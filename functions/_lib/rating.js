// Rating math: Elo replay and Bradley-Terry. Pure functions, no I/O, so they
// can be unit-tested under plain Node.
import { CONFIG } from "./config.js";

/**
 * Replay votes in chronological order and compute Elo ratings.
 * votes: [{a_dir, b_dir, winner}] already sorted by created_at then id.
 * dirs: array of entrant dirs to include (all start at ELO_INITIAL).
 * Returns Map(dir -> elo). Votes referencing unknown dirs are skipped.
 */
export function computeElo(votes, dirs) {
  const rating = new Map(dirs.map((d) => [d, CONFIG.ELO_INITIAL]));
  for (const v of votes) {
    if (!rating.has(v.a_dir) || !rating.has(v.b_dir)) continue;
    const ra = rating.get(v.a_dir);
    const rb = rating.get(v.b_dir);
    const expectedA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    const scoreA = v.winner === "A" ? 1 : v.winner === "B" ? 0 : 0.5;
    rating.set(v.a_dir, ra + CONFIG.ELO_K * (scoreA - expectedA));
    rating.set(v.b_dir, rb + CONFIG.ELO_K * ((1 - scoreA) - (1 - expectedA)));
  }
  return rating;
}

/**
 * Bradley-Terry strengths via the standard MM (minorization-maximization)
 * iteration, capped at BT_MAX_ITERATIONS. Ties count as half a win for each
 * side. Scores are normalized to sum to 1 across entrants that played at
 * least one game; entrants with zero games get null.
 * Returns { scores: Map(dir -> number|null), converged: boolean }.
 */
export function computeBradleyTerry(votes, dirs) {
  const idx = new Map(dirs.map((d, i) => [d, i]));
  const n = dirs.length;
  // wins[i]: total win credit for i (ties add 0.5); games[i][j]: head-to-head games.
  const wins = new Array(n).fill(0);
  const games = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const v of votes) {
    const i = idx.get(v.a_dir);
    const j = idx.get(v.b_dir);
    if (i === undefined || j === undefined || i === j) continue;
    games[i][j] += 1;
    games[j][i] += 1;
    if (v.winner === "A") wins[i] += 1;
    else if (v.winner === "B") wins[j] += 1;
    else { wins[i] += 0.5; wins[j] += 0.5; }
  }

  const played = dirs.map((_, i) => games[i].some((g) => g > 0));
  const active = [];
  for (let i = 0; i < n; i++) if (played[i]) active.push(i);

  const scores = new Map(dirs.map((d) => [d, null]));
  if (active.length < 2) return { scores, converged: false };

  let p = new Array(n).fill(1);
  let converged = false;
  for (let iter = 0; iter < CONFIG.BT_MAX_ITERATIONS; iter++) {
    const next = p.slice();
    let maxDelta = 0;
    for (const i of active) {
      let denom = 0;
      for (const j of active) {
        if (i === j || games[i][j] === 0) continue;
        denom += games[i][j] / (p[i] + p[j]);
      }
      // wins[i] can be 0 (all losses); clamp so the entrant keeps a tiny
      // positive strength instead of collapsing to exactly 0.
      const w = Math.max(wins[i], 1e-9);
      next[i] = denom > 0 ? w / denom : p[i];
    }
    // Normalize so the active strengths sum to 1 (fixes the scale).
    const sum = active.reduce((s, i) => s + next[i], 0);
    for (const i of active) next[i] /= sum;
    for (const i of active) {
      maxDelta = Math.max(maxDelta, Math.abs(next[i] - p[i]));
    }
    p = next;
    if (maxDelta < CONFIG.BT_EPSILON) { converged = true; break; }
  }

  for (const i of active) scores.set(dirs[i], p[i]);
  return { scores, converged };
}

/**
 * Per-entrant tallies. Returns Map(dir -> {wins, losses, ties, games}).
 */
export function tallyRecords(votes, dirs) {
  const rec = new Map(
    dirs.map((d) => [d, { wins: 0, losses: 0, ties: 0, games: 0 }]),
  );
  for (const v of votes) {
    const a = rec.get(v.a_dir);
    const b = rec.get(v.b_dir);
    if (!a || !b) continue;
    a.games += 1;
    b.games += 1;
    if (v.winner === "A") { a.wins += 1; b.losses += 1; }
    else if (v.winner === "B") { b.wins += 1; a.losses += 1; }
    else { a.ties += 1; b.ties += 1; }
  }
  return rec;
}
