export function validateCompleteRanking(order, activeDirs) {
  if (!Array.isArray(order) || order.length !== activeDirs.length) return false;
  if (order.some((dir) => typeof dir !== "string" || dir.length > 128)) return false;
  const expected = new Set(activeDirs);
  const actual = new Set(order);
  if (actual.size !== order.length || actual.size !== expected.size) return false;
  return order.every((dir) => expected.has(dir));
}

export function aggregateCompleteRankings(ballots, activeDirs) {
  const stats = new Map(activeDirs.map((dir) => [dir, { dir, rankSum: 0, appearances: 0 }]));
  let validBallots = 0;
  for (const order of ballots) {
    if (!validateCompleteRanking(order, activeDirs)) continue;
    validBallots++;
    order.forEach((dir, index) => {
      const row = stats.get(dir);
      row.rankSum += index + 1;
      row.appearances++;
    });
  }
  return {
    total_ballots: validBallots,
    entries: [...stats.values()].map((row) => ({
      dir: row.dir,
      average_rank: row.appearances ? row.rankSum / row.appearances : null,
      appearances: row.appearances,
    })).sort((a, b) => {
      if (a.average_rank === null) return b.average_rank === null ? a.dir.localeCompare(b.dir) : 1;
      if (b.average_rank === null) return -1;
      return a.average_rank - b.average_rank || a.dir.localeCompare(b.dir);
    }),
  };
}
