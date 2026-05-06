import { useSQLiteContext } from 'expo-sqlite';

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
