export const migration003 = `
CREATE TABLE IF NOT EXISTS LunaConfig (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  cycle_start_date TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO LunaConfig (id, cycle_start_date, updated_at)
VALUES (1, NULL, datetime('now'));

CREATE TABLE IF NOT EXISTS LunaDays (
  day_number  INTEGER PRIMARY KEY CHECK (day_number >= 1 AND day_number <= 28),
  color       TEXT,
  color_name  TEXT,
  emoji       TEXT,
  tags        TEXT,
  notes       TEXT,
  dreams      TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
