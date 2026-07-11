-- 0005_seed_solar_system.sql
-- Generated only from verified archived artifacts; review before applying.
-- A single participant may be registered, but pairing requires at least two active participants.

INSERT OR IGNORE INTO participants (track, dir, active) VALUES
  ('solar-system', 'gpt5.4mini', 1),
  ('solar-system', 'composer2.5', 1),
  ('solar-system', 'glm5.2', 1),
  ('solar-system', 'grok4.5', 1),
  ('solar-system', 'kimi-k2.7code', 1),
  ('solar-system', 'gemini3.1pro', 1),
  ('solar-system', 'deepseek-v4-pro', 1);
