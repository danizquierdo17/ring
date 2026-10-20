export const migration007 = `
ALTER TABLE Settings ADD COLUMN ring_stock_count INTEGER NOT NULL DEFAULT 0 CHECK (ring_stock_count >= 0);
ALTER TABLE Settings ADD COLUMN ring_stock_threshold INTEGER NOT NULL DEFAULT 1 CHECK (ring_stock_threshold IN (0, 1, 2));
ALTER TABLE Settings ADD COLUMN buy_reminder_hours TEXT NOT NULL DEFAULT '[24]';
ALTER TABLE Settings ADD COLUMN ring_stock_configured_at TEXT;
`;
