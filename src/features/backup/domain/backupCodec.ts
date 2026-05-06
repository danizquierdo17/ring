import { z } from 'zod';

// ── Backup format version ─────────────────────────────────────────────────────
export const BACKUP_VERSION = 1;

// ── Zod schemas (validate on import) ─────────────────────────────────────────

const CycleRowSchema = z.object({
  id:                 z.string(),
  regimen:            z.string(),
  inserted_at:        z.string(),
  removed_at:         z.string().nullable(),
  planned_removal_at: z.string(),
  status:             z.string(),
  notes:              z.string().nullable(),
  created_at:         z.string(),
  updated_at:         z.string(),
});

const EventRowSchema = z.object({
  id:          z.string(),
  cycle_id:    z.string().nullable(),
  type:        z.string(),
  occurred_at: z.string(),
  recorded_at: z.string(),
  payload:     z.string().nullable(),
});

const SettingsSchema = z.object({
  regimen:         z.string(),
  continuous_days: z.number(),
});

const LunaConfigSchema = z.object({
  cycle_start_date: z.string().nullable(),
});

const LunaDaySchema = z.object({
  day_number:  z.number(),
  color:       z.string().nullable(),
  color_name:  z.string().nullable(),
  emoji:       z.string().nullable(),
  tags:        z.string().nullable(),
  notes:       z.string().nullable(),
  dreams:      z.string().nullable(),
});

export const BackupSchema = z.object({
  version:     z.literal(1),
  app:         z.literal('lua-ring'),
  exported_at: z.string(),
  settings:    SettingsSchema,
  cycles:      z.array(CycleRowSchema),
  events:      z.array(EventRowSchema),
  luna_config: LunaConfigSchema,
  luna_days:   z.array(LunaDaySchema),
});

export type BackupPayload = z.infer<typeof BackupSchema>;

// ── Encode: read from DB rows → JSON string ───────────────────────────────────

export function encodeBackup(data: Omit<BackupPayload, 'version' | 'app' | 'exported_at'>): string {
  const payload: BackupPayload = {
    version:     BACKUP_VERSION,
    app:         'lua-ring',
    exported_at: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}

// ── Decode: JSON string → validated BackupPayload ─────────────────────────────

export function decodeBackup(raw: string): BackupPayload {
  const parsed = JSON.parse(raw) as unknown;
  return BackupSchema.parse(parsed);
}
