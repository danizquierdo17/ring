import type { SQLiteDatabase } from "expo-sqlite";

import { ok, err, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { SettingsRow } from "../../../infra/db/schema";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";
import type { Locale } from "../../../shared/i18n/translations";
import type { ThemePreference } from "../../../shared/theme/themeStore";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Settings = {
  readonly regimen: Regimen;
  readonly continuousDays: number;
  readonly language: Locale;
  readonly theme: ThemePreference;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const VALID_LOCALES: readonly Locale[] = ['es-ES', 'es-419', 'en-US'];
const VALID_THEMES: readonly ThemePreference[] = ['light', 'dark'];

function rowToSettings(row: SettingsRow): Settings {
  const lang = VALID_LOCALES.includes(row.language as Locale)
    ? (row.language as Locale)
    : 'es-ES';
  const theme = VALID_THEMES.includes(row.theme as ThemePreference)
    ? (row.theme as ThemePreference)
    : 'light';
  return {
    regimen: row.regimen as Regimen,
    continuousDays: row.continuous_days,
    language: lang,
    theme,
  };
}

function dbError(e: unknown): AppError {
  return {
    code: "DB_ERROR",
    message: e instanceof Error ? e.message : String(e),
  };
}

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

export function getSettings(db: SQLiteDatabase): Result<Settings, AppError> {
  try {
    const row = db.getFirstSync<SettingsRow>(
      "SELECT id, regimen, continuous_days, language, theme, created_at, updated_at FROM Settings WHERE id = 1"
    );

    if (row === null) {
      // Should never happen due to INSERT OR IGNORE in migration, but provide sensible defaults
      return ok({
        regimen: "CYCLIC_21_7" as const,
        continuousDays: 28,
        language: 'es-ES' as const,
        theme: 'light' as const,
      });
    }

    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateRegimen
// ---------------------------------------------------------------------------

const VALID_REGIMENS: readonly Regimen[] = ["CYCLIC_21_7", "CONTINUOUS"];

export function updateRegimen(
  db: SQLiteDatabase,
  regimen: Regimen
): Result<Settings, AppError> {
  if (!VALID_REGIMENS.includes(regimen)) {
    return err({
      code: "INVALID_REGIMEN",
      message: `Regimen must be one of ${VALID_REGIMENS.join(", ")}`,
    });
  }

  try {
    const now = new Date().toISOString();
    db.runSync(
      "UPDATE Settings SET regimen = ?, updated_at = ? WHERE id = 1",
      regimen,
      now
    );

    // Fetch and return the updated settings
    const row = db.getFirstSync<SettingsRow>(
      "SELECT id, regimen, continuous_days, language, theme, created_at, updated_at FROM Settings WHERE id = 1"
    );

    if (row === null) {
      return err({
        code: "DB_ERROR",
        message: "Settings row not found after update",
      });
    }

    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateContinuousDays
// ---------------------------------------------------------------------------

const MIN_CONTINUOUS_DAYS = 21;
const MAX_CONTINUOUS_DAYS = 365;

export function updateContinuousDays(
  db: SQLiteDatabase,
  days: number
): Result<Settings, AppError> {
  if (days < MIN_CONTINUOUS_DAYS || days > MAX_CONTINUOUS_DAYS) {
    return err({
      code: "INVALID_CONTINUOUS_DAYS",
      message: `continuous_days must be between ${MIN_CONTINUOUS_DAYS} and ${MAX_CONTINUOUS_DAYS}`,
    });
  }

  try {
    const now = new Date().toISOString();
    db.runSync(
      "UPDATE Settings SET continuous_days = ?, updated_at = ? WHERE id = 1",
      days,
      now
    );

    // Fetch and return the updated settings
    const row = db.getFirstSync<SettingsRow>(
      "SELECT id, regimen, continuous_days, language, theme, created_at, updated_at FROM Settings WHERE id = 1"
    );

    if (row === null) {
      return err({
        code: "DB_ERROR",
        message: "Settings row not found after update",
      });
    }

    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateLanguage
// ---------------------------------------------------------------------------

export function updateLanguage(
  db: SQLiteDatabase,
  language: Locale,
): Result<Settings, AppError> {
  if (!VALID_LOCALES.includes(language)) {
    return err({ code: 'INVALID_LOCALE', message: `Unknown locale: ${language}` });
  }
  try {
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE Settings SET language = ?, updated_at = ? WHERE id = 1',
      language,
      now,
    );
    const row = db.getFirstSync<SettingsRow>(
      'SELECT id, regimen, continuous_days, language, theme, created_at, updated_at FROM Settings WHERE id = 1',
    );
    if (row === null) {
      return err({ code: 'DB_ERROR', message: 'Settings row not found after update' });
    }
    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateTheme
// ---------------------------------------------------------------------------

export function updateTheme(
  db: SQLiteDatabase,
  theme: ThemePreference,
): Result<Settings, AppError> {
  if (!VALID_THEMES.includes(theme)) {
    return err({ code: 'DB_ERROR', message: `Unknown theme: ${theme}` });
  }
  try {
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE Settings SET theme = ?, updated_at = ? WHERE id = 1',
      theme,
      now,
    );
    const row = db.getFirstSync<SettingsRow>(
      'SELECT id, regimen, continuous_days, language, theme, created_at, updated_at FROM Settings WHERE id = 1',
    );
    if (row === null) {
      return err({ code: 'DB_ERROR', message: 'Settings row not found after update' });
    }
    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}
