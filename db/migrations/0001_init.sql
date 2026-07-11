-- 0001_init.sql
-- Core schema for the LLM Arcade voting backend.

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track TEXT NOT NULL,
  a_dir TEXT NOT NULL,
  b_dir TEXT NOT NULL,
  winner TEXT NOT NULL CHECK (winner IN ('A', 'B', 'tie')),
  pair_id TEXT NOT NULL UNIQUE,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_votes_track_created
  ON votes (track, created_at);

CREATE INDEX IF NOT EXISTS idx_votes_voter_created
  ON votes (voter_hash, created_at);

-- Registered entrants per track; /api/pair samples from active rows only.
CREATE TABLE IF NOT EXISTS participants (
  track TEXT NOT NULL,
  dir TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (track, dir)
);
