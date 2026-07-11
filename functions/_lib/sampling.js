// Pair sampling: fill the largest information gaps before adding more votes
// to already well-covered matchups.

/** Canonical unordered key for a pair of entrant dirs. */
export function pairKey(dirA, dirB) {
  return dirA < dirB ? `${dirA}|${dirB}` : `${dirB}|${dirA}`;
}

/**
 * Priority order:
 * 1. Never repeat a matchup already judged by this visitor.
 * 2. Lowest global matchup vote count.
 * 3. Lowest combined global entrant exposure.
 * 4. Lowest combined exposure for this visitor.
 * 5. Random tie break, then random A/B slot assignment.
 *
 * counts: Map(pairKey -> votes so far). rng: () => [0,1), injectable for tests.
 * Returns { aDir, bDir }.
 */
export function pickPair(dirs, counts, rng = Math.random, excluded = new Set()) {
  const globalExposure = new Map(dirs.map((dir) => [dir, 0]));
  for (const [key, count] of counts) {
    const [x, y] = key.split("|");
    if (globalExposure.has(x)) globalExposure.set(x, globalExposure.get(x) + count);
    if (globalExposure.has(y)) globalExposure.set(y, globalExposure.get(y) + count);
  }
  const visitorExposure = new Map(dirs.map((dir) => [dir, 0]));
  for (const key of excluded) {
    const [x, y] = key.split("|");
    if (visitorExposure.has(x)) visitorExposure.set(x, visitorExposure.get(x) + 1);
    if (visitorExposure.has(y)) visitorExposure.set(y, visitorExposure.get(y) + 1);
  }
  const pairs = [];
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const key = pairKey(dirs[i], dirs[j]);
      if (excluded.has(key)) continue;
      pairs.push({
        x: dirs[i], y: dirs[j], count: counts.get(key) || 0,
        globalExposure: globalExposure.get(dirs[i]) + globalExposure.get(dirs[j]),
        visitorExposure: visitorExposure.get(dirs[i]) + visitorExposure.get(dirs[j]),
      });
    }
  }
  if (!pairs.length) return null;
  const minCount = Math.min(...pairs.map((p) => p.count));
  let candidates = pairs.filter((p) => p.count === minCount);
  const minGlobalExposure = Math.min(...candidates.map((p) => p.globalExposure));
  candidates = candidates.filter((p) => p.globalExposure === minGlobalExposure);
  const minVisitorExposure = Math.min(...candidates.map((p) => p.visitorExposure));
  candidates = candidates.filter((p) => p.visitorExposure === minVisitorExposure);
  const pick = candidates[Math.floor(rng() * candidates.length)];
  // Random slot assignment so position A/B carries no information.
  return rng() < 0.5
    ? { aDir: pick.x, bDir: pick.y }
    : { aDir: pick.y, bDir: pick.x };
}
