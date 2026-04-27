-- Migration 001 — esquema inicial RingCare
-- SchemaMigrations se crea fuera de aquí (runner bootstrap).
-- NUNCA editar este fichero; añadir 002_... para cambios futuros.

CREATE TABLE Cycles (
  id                 TEXT PRIMARY KEY,
  regimen            TEXT NOT NULL CHECK (regimen IN ('CYCLIC_21_7', 'CONTINUOUS')),
  inserted_at        TEXT NOT NULL,
  removed_at         TEXT,
  planned_removal_at TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'INTERRUPTED')),
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Invariante: máximo un ciclo ACTIVE a la vez
CREATE UNIQUE INDEX idx_cycles_active_unique
  ON Cycles(status) WHERE status = 'ACTIVE';

CREATE INDEX idx_cycles_inserted_at ON Cycles(inserted_at);

CREATE TABLE Events (
  id          TEXT PRIMARY KEY,
  cycle_id    TEXT,
  type        TEXT NOT NULL CHECK (type IN (
                'RING_INSERTED',
                'RING_REMOVED',
                'BLEEDING',
                'SPOTTING',
                'SIDE_EFFECT',
                'SYMPTOM',
                'NOTE',
                'NOTIFICATION_FIRED',
                'NOTIFICATION_ACKED',
                'CORRECTION'
              )),
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  payload     TEXT,
  FOREIGN KEY (cycle_id) REFERENCES Cycles(id) ON DELETE SET NULL
);

CREATE INDEX idx_events_cycle       ON Events(cycle_id);
CREATE INDEX idx_events_occurred_at ON Events(occurred_at);
CREATE INDEX idx_events_type        ON Events(type);

CREATE TABLE Settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
