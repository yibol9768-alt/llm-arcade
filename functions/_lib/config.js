// Central knobs for anti-abuse and scoring. Every threshold lives here so it
// can be tuned in one place. All time values are in seconds unless noted.
export const CONFIG = {
  // A pair token expires after this long.
  MAX_PAIR_AGE_SECONDS: 2 * 60 * 60,

  // Leaderboard responses are cached in the Cache API for this long.
  LEADERBOARD_CACHE_SECONDS: 60,

  // Elo replay parameters.
  ELO_K: 32,
  ELO_INITIAL: 1000,

  // Bradley-Terry: below this many total votes on a track, bt_score is null.
  BT_MIN_VOTES: 20,
  BT_MAX_ITERATIONS: 100,
  BT_EPSILON: 1e-6,

};
