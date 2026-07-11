-- 0002_seed_mario.sql
-- Seed the original 9 mario-track entrants (dirs match tracks/mario/<dir>/).

INSERT OR IGNORE INTO participants (track, dir, active) VALUES
  ('mario', '5.6luna', 1),
  ('mario', '5.6sol', 1),
  ('mario', '5.6terra', 1),
  ('mario', 'composer2.5', 1),
  ('mario', 'fable5', 1),
  ('mario', 'glm5.2', 1),
  ('mario', 'gpt5.5', 1),
  ('mario', 'grok4.5', 1),
  ('mario', 'k2.7code', 1);
