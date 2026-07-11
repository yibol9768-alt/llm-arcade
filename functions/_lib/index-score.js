export function eloToArcadeScore(elo) {
  return 100 / (1 + Math.pow(10, (1000 - Number(elo || 1000)) / 400));
}

export function averageRankToScore(averageRank, entrantCount) {
  if (!Number.isFinite(averageRank) || entrantCount < 2) return null;
  return Math.max(0, Math.min(100, 100 * (entrantCount - averageRank) / (entrantCount - 1)));
}

export function combineMethodScores(methods) {
  const available = methods.filter((method) => Number.isFinite(method.score) && method.weight > 0);
  const totalWeight = available.reduce((sum, method) => sum + method.weight, 0);
  if (!totalWeight) return { score: null, effective_weights: {} };
  const effective = Object.fromEntries(available.map((method) => [method.id, method.weight / totalWeight]));
  return {
    score: available.reduce((sum, method) => sum + method.score * effective[method.id], 0),
    effective_weights: effective,
  };
}
