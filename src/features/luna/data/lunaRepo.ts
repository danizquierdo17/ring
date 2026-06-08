import { useSQLiteContext } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

export type DayData = {
  color?: string;
  colorName?: string;
  emoji?: string;
  tags?: string[];
  notes?: string;
  dreams?: string;
};

export type LunaState = {
  cycleStartDate: string | null;
  days: Record<number, DayData>;
};

type LunaDayRow = {
  day_number: number;
  color: string | null;
  color_name: string | null;
  emoji: string | null;
  tags: string | null;
  notes: string | null;
  dreams: string | null;
};

type LunaConfigRow = {
  cycle_start_date: string | null;
};

export function useLunaRepo() {
  const db = useSQLiteContext();

  function loadState(): LunaState {
    const config = db.getFirstSync<LunaConfigRow>(
      'SELECT cycle_start_date FROM LunaConfig WHERE id = 1'
    );
    const rows = db.getAllSync<LunaDayRow>(
      'SELECT day_number, color, color_name, emoji, tags, notes, dreams FROM LunaDays'
    );

    const days: Record<number, DayData> = {};
    for (const row of rows) {
      days[row.day_number] = {
        color: row.color ?? undefined,
        colorName: row.color_name ?? undefined,
        emoji: row.emoji ?? undefined,
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
        notes: row.notes ?? undefined,
        dreams: row.dreams ?? undefined,
      };
    }

    return {
      cycleStartDate: config?.cycle_start_date ?? null,
      days,
    };
  }

  function saveCycleStartDate(isoDate: string): void {
    // If there's a previous cycle with at least one filled day, snapshot it before overwriting.
    snapshotCurrentCycleIfNeeded(db);
    db.runSync(
      'UPDATE LunaConfig SET cycle_start_date = ?, updated_at = datetime(\'now\') WHERE id = 1',
      isoDate
    );
  }

  function saveDayData(dayNumber: number, data: DayData): void {
    db.runSync(
      `INSERT INTO LunaDays (day_number, color, color_name, emoji, tags, notes, dreams, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(day_number) DO UPDATE SET
         color      = excluded.color,
         color_name = excluded.color_name,
         emoji      = excluded.emoji,
         tags       = excluded.tags,
         notes      = excluded.notes,
         dreams     = excluded.dreams,
         updated_at = excluded.updated_at`,
      dayNumber,
      data.color ?? null,
      data.colorName ?? null,
      data.emoji ?? null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.notes ?? null,
      data.dreams ?? null
    );
  }

  return { loadState, saveCycleStartDate, saveDayData };
}

// ---------------------------------------------------------------------------
// Snapshots (history)
// ---------------------------------------------------------------------------

export type LunaSnapshotSummary = {
  id: string;
  cycleStartDate: string;
  cycleEndDate: string;
  createdAt: string;
  filledDays: number;
};

export type LunaSnapshotDetail = LunaSnapshotSummary & {
  days: Record<number, DayData>;
};

function snapshotCurrentCycleIfNeeded(db: SQLiteDatabase): void {
  const config = db.getFirstSync<{ cycle_start_date: string | null }>(
    'SELECT cycle_start_date FROM LunaConfig WHERE id = 1',
  );
  const prevStart = config?.cycle_start_date ?? null;
  if (prevStart === null) return;

  const rows = db.getAllSync<LunaDayRow>(
    'SELECT day_number, color, color_name, emoji, tags, notes, dreams FROM LunaDays',
  );
  if (rows.length === 0) return;

  const snapshotId = generateId();
  const start = new Date(prevStart);
  const end = new Date(start.getTime() + 27 * 86_400_000).toISOString();

  db.withTransactionSync(() => {
    db.runSync(
      'INSERT INTO LunaSnapshots (id, cycle_start_date, cycle_end_date) VALUES (?, ?, ?)',
      snapshotId,
      prevStart,
      end,
    );
    for (const row of rows) {
      db.runSync(
        `INSERT INTO LunaSnapshotDays (snapshot_id, day_number, color, color_name, emoji, tags, notes, dreams)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        snapshotId,
        row.day_number,
        row.color,
        row.color_name,
        row.emoji,
        row.tags,
        row.notes,
        row.dreams,
      );
    }
    db.runSync('DELETE FROM LunaDays');
  });
}

function generateId(): string {
  // Lightweight ULID-ish: timestamp + random suffix. No deps.
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rnd}`;
}

export function listLunaSnapshots(db: SQLiteDatabase): LunaSnapshotSummary[] {
  type Row = {
    id: string;
    cycle_start_date: string;
    cycle_end_date: string;
    created_at: string;
    filled_days: number;
  };
  const rows = db.getAllSync<Row>(
    `SELECT s.id, s.cycle_start_date, s.cycle_end_date, s.created_at,
            (SELECT COUNT(*) FROM LunaSnapshotDays d WHERE d.snapshot_id = s.id) AS filled_days
     FROM LunaSnapshots s
     ORDER BY s.cycle_start_date DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    cycleStartDate: r.cycle_start_date,
    cycleEndDate: r.cycle_end_date,
    createdAt: r.created_at,
    filledDays: r.filled_days,
  }));
}

export function getLunaSnapshot(db: SQLiteDatabase, id: string): LunaSnapshotDetail | null {
  type HeadRow = {
    id: string;
    cycle_start_date: string;
    cycle_end_date: string;
    created_at: string;
  };
  const head = db.getFirstSync<HeadRow>(
    'SELECT id, cycle_start_date, cycle_end_date, created_at FROM LunaSnapshots WHERE id = ?',
    id,
  );
  if (head === null) return null;

  const rows = db.getAllSync<LunaDayRow>(
    `SELECT day_number, color, color_name, emoji, tags, notes, dreams
     FROM LunaSnapshotDays WHERE snapshot_id = ?`,
    id,
  );
  const days: Record<number, DayData> = {};
  for (const row of rows) {
    days[row.day_number] = {
      color: row.color ?? undefined,
      colorName: row.color_name ?? undefined,
      emoji: row.emoji ?? undefined,
      tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
      notes: row.notes ?? undefined,
      dreams: row.dreams ?? undefined,
    };
  }

  return {
    id: head.id,
    cycleStartDate: head.cycle_start_date,
    cycleEndDate: head.cycle_end_date,
    createdAt: head.created_at,
    filledDays: rows.length,
    days,
  };
}
