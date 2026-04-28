-- Tabla Settings — almacena preferencias globales del usuario.
-- Una sola fila (id = 1 por convención).
CREATE TABLE IF NOT EXISTS Settings (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  regimen           TEXT NOT NULL DEFAULT 'CYCLIC_21_7' CHECK (regimen IN ('CYCLIC_21_7', 'CONTINUOUS')),
  continuous_days   INTEGER NOT NULL DEFAULT 28 CHECK (continuous_days >= 21 AND continuous_days <= 365),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

-- Insert default row if it doesn't exist
INSERT OR IGNORE INTO Settings (id, regimen, continuous_days, created_at, updated_at)
VALUES (1, 'CYCLIC_21_7', 28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
