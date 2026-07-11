-- 0005_seed_solar_system.sql
-- Generated only from verified archived artifacts; review before applying.
-- A single participant may be registered, but pairing requires at least two active participants.

INSERT OR IGNORE INTO participants (track, dir, active) VALUES
  ('solar-system', 'glm5.2', 1);
