export const migration006 = `
CREATE TABLE IF NOT EXISTS LunaSnapshots (
  id                TEXT PRIMARY KEY,
  cycle_start_date  TEXT NOT NULL,
  cycle_end_date    TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_luna_snapshots_start
  ON LunaSnapshots(cycle_start_date);

CREATE TABLE IF NOT EXISTS LunaSnapshotDays (
  snapshot_id  TEXT NOT NULL,
  day_number   INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 28),
  color        TEXT,
  color_name   TEXT,
  emoji        TEXT,
  tags         TEXT,
  notes        TEXT,
  dreams       TEXT,
  PRIMARY KEY (snapshot_id, day_number),
  FOREIGN KEY (snapshot_id) REFERENCES LunaSnapshots(id) ON DELETE CASCADE
);
`;
