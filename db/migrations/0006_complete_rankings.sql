-- 0006_complete_rankings.sql
-- One updateable complete-ranking ballot per pseudonymous visitor and track.

CREATE TABLE IF NOT EXISTS ranking_ballots (
  track TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  ranking_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (track, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_ranking_ballots_track_updated
  ON ranking_ballots (track, updated_at);
