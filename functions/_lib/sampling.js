// Pair sampling: prefer the least-voted pairings, with a little randomness.
import { CONFIG } from "./config.js";

/** Canonical unordered key for a pair of entrant dirs. */
export function pairKey(dirA, dirB) {
  return dirA < dirB ? `${dirA}|${dirB}` : `${dirB}|${dirA}`;
}

/**
 * Pick one pair from `dirs` (entrant dirs, length >= 2), lightly balanced:
 * candidates are all unordered pairs whose existing vote count is within
 * PAIR_COUNT_SLACK of the minimum, and one candidate is chosen uniformly.
 * Slot assignment (who is A, who is B) is then randomized.
 *
 * counts: Map(pairKey -> votes so far). rng: () => [0,1), injectable for tests.
 * Returns { aDir, bDir }.
 */
export function pickPair(dirs, counts, rng = Math.random) {
  const pairs = [];
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const key = pairKey(dirs[i], dirs[j]);
      pairs.push({ x: dirs[i], y: dirs[j], count: counts.get(key) || 0 });
    }
  }
  const minCount = Math.min(...pairs.map((p) => p.count));
  const candidates = pairs.filter(
    (p) => p.count <= minCount + CONFIG.PAIR_COUNT_SLACK,
  );
  const pick = candidates[Math.floor(rng() * candidates.length)];
  // Random slot assignment so position A/B carries no information.
  return rng() < 0.5
    ? { aDir: pick.x, bDir: pick.y }
    : { aDir: pick.y, bDir: pick.x };
}
