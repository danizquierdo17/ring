export type CycleRow = {
  id: string;
  regimen: string;
  inserted_at: string;
  removed_at: string | null;
  planned_removal_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  cycle_id: string | null;
  type: string;
  occurred_at: string;
  recorded_at: string;
  payload: string | null;
};

export type SettingsRow = {
  key: string;
  value: string;
  updated_at: string;
};

export type SchemaMigrationsRow = {
  version: number;
  applied_at: string;
};
