import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";

import { ok, err, isOk, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { SettingsRow } from "../../../infra/db/schema";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";
import type { Locale } from "../../../shared/i18n/translations";
import type { ThemePreference } from "../../../shared/theme/themeStore";
import {
  DEFAULT_BUY_REMINDER_HOURS,
  DEFAULT_STOCK_COUNT,
  DEFAULT_STOCK_THRESHOLD,
  isStockThreshold,
  validateBuyReminderHours,
  validateStockCount,
  validateStockThreshold,
  type BuyReminderHours,
  type StockThreshold,
} from "../../stock/domain/stock";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Settings = {
  readonly regimen: Regimen;
  readonly continuousDays: number;
  readonly language: Locale;
  readonly theme: ThemePreference;
  readonly stockCount: number;
  readonly stockThreshold: StockThreshold;
  readonly buyReminderHours: readonly BuyReminderHours[];
  /** ISO UTC of the first time the user saved her stock; null until then. */
  readonly stockConfiguredAt: string | null;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const VALID_LOCALES: readonly Locale[] = ['es-ES', 'es-419', 'en-US'];
const VALID_THEMES: readonly ThemePreference[] = ['light', 'dark'];

const SELECT_SETTINGS =
  "SELECT id, regimen, continuous_days, language, theme, ring_stock_count, ring_stock_threshold, buy_reminder_hours, ring_stock_configured_at, created_at, updated_at FROM Settings WHERE id = 1";

const BuyReminderHoursJsonSchema = z.array(z.number());

function parseBuyReminderHours(raw: string | undefined): readonly BuyReminderHours[] {
  try {
    const parsed = BuyReminderHoursJsonSchema.safeParse(JSON.parse(raw ?? ""));
    if (!parsed.success) return DEFAULT_BUY_REMINDER_HOURS;
    const result = validateBuyReminderHours(parsed.data);
    return isOk(result) ? result.value : DEFAULT_BUY_REMINDER_HOURS;
  } catch {
    return DEFAULT_BUY_REMINDER_HOURS;
  }
}

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
    stockCount: isOk(validateStockCount(row.ring_stock_count)) ? row.ring_stock_count : DEFAULT_STOCK_COUNT,
    stockThreshold: isStockThreshold(row.ring_stock_threshold) ? row.ring_stock_threshold : DEFAULT_STOCK_THRESHOLD,
    buyReminderHours: parseBuyReminderHours(row.buy_reminder_hours),
    stockConfiguredAt: row.ring_stock_configured_at ?? null,
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
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);

    if (row === null) {
      // Should never happen due to INSERT OR IGNORE in migration, but provide sensible defaults
      return ok({
        regimen: "CYCLIC_21_7" as const,
        continuousDays: 28,
        language: 'es-ES' as const,
        theme: 'light' as const,
        stockCount: DEFAULT_STOCK_COUNT,
        stockThreshold: DEFAULT_STOCK_THRESHOLD,
        buyReminderHours: DEFAULT_BUY_REMINDER_HOURS,
        stockConfiguredAt: null,
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
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);

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
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);

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
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);
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
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);
    if (row === null) {
      return err({ code: 'DB_ERROR', message: 'Settings row not found after update' });
    }
    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateStockSettings
// Updates any subset of count / threshold / buy reminder hours in one write.
// The first save also marks the stock as configured (ring_stock_configured_at).
// ---------------------------------------------------------------------------

export type StockSettingsPatch = {
  readonly count?: number;
  readonly threshold?: number;
  readonly buyReminderHours?: readonly number[];
};

export function updateStockSettings(
  db: SQLiteDatabase,
  patch: StockSettingsPatch,
): Result<Settings, AppError> {
  const current = getSettings(db);
  if (!isOk(current)) return current;

  const count = validateStockCount(patch.count ?? current.value.stockCount);
  if (!isOk(count)) return count;
  const threshold = validateStockThreshold(patch.threshold ?? current.value.stockThreshold);
  if (!isOk(threshold)) return threshold;
  const hours = validateBuyReminderHours(patch.buyReminderHours ?? current.value.buyReminderHours);
  if (!isOk(hours)) return hours;

  try {
    const now = new Date().toISOString();
    db.runSync(
      `UPDATE Settings
         SET ring_stock_count = ?, ring_stock_threshold = ?, buy_reminder_hours = ?,
             ring_stock_configured_at = COALESCE(ring_stock_configured_at, ?), updated_at = ?
       WHERE id = 1`,
      count.value,
      threshold.value,
      JSON.stringify(hours.value),
      now,
      now,
    );
    const row = db.getFirstSync<SettingsRow>(SELECT_SETTINGS);
    if (row === null) {
      return err({ code: 'DB_ERROR', message: 'Settings row not found after update' });
    }
    return ok(rowToSettings(row));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// consumeStockRing
// Subtracts one ring from the stock, never below 0. Throws on failure so it
// can run inside another write's transaction (see insertCycle) and roll it back.
// ---------------------------------------------------------------------------

export function consumeStockRing(db: SQLiteDatabase): void {
  db.runSync(
    "UPDATE Settings SET ring_stock_count = MAX(0, ring_stock_count - 1), updated_at = ? WHERE id = 1",
    new Date().toISOString(),
  );
}
