-- 0004_seed_mario_additions.sql
-- Add six verified artifact directories to the existing Mario track.

INSERT OR IGNORE INTO participants (track, dir, active) VALUES
  ('mario', 'claude-sonnet', 1),
  ('mario', 'claude-haiku', 1),
  ('mario', 'claude-opus', 1),
  ('mario', 'gemini-3.1-pro', 1),
  ('mario', 'gpt-5.4-mini', 1),
  ('mario', 'deepseek-v4-pro', 1);
