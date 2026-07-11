-- One visitor can judge a matchup only once per track.
-- Backfill existing votes without changing historical leaderboard data.

CREATE TABLE IF NOT EXISTS voter_pair_claims (
  voter_hash TEXT NOT NULL,
  track TEXT NOT NULL,
  pair_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (voter_hash, track, pair_key)
);

INSERT OR IGNORE INTO voter_pair_claims (voter_hash, track, pair_key, created_at)
SELECT voter_hash,
       track,
       CASE WHEN a_dir < b_dir THEN a_dir || '|' || b_dir ELSE b_dir || '|' || a_dir END,
       MIN(created_at)
FROM votes
GROUP BY voter_hash, track,
         CASE WHEN a_dir < b_dir THEN a_dir || '|' || b_dir ELSE b_dir || '|' || a_dir END;

CREATE INDEX IF NOT EXISTS idx_voter_pair_claims_track
  ON voter_pair_claims (track, pair_key);
