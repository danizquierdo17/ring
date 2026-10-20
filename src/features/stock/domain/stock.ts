import { ok, err, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import {
  CYCLIC_FREE_DAYS,
  CYCLIC_RING_DAYS,
  deriveUiState,
  type Cycle,
  type Regimen,
} from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type StockThreshold = 0 | 1 | 2;
export type BuyReminderHours = 24 | 48 | 72;

export const STOCK_THRESHOLDS: readonly StockThreshold[] = [0, 1, 2];
export const BUY_REMINDER_HOURS: readonly BuyReminderHours[] = [24, 48, 72];

export const DEFAULT_STOCK_COUNT = 0;
export const DEFAULT_STOCK_THRESHOLD: StockThreshold = 1;
export const DEFAULT_BUY_REMINDER_HOURS: readonly BuyReminderHours[] = [24];

export type StockSettings = {
  readonly count: number;
  readonly threshold: StockThreshold;
  readonly buyReminderHours: readonly BuyReminderHours[]; // sorted high → low
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isStockThreshold(value: unknown): value is StockThreshold {
  return STOCK_THRESHOLDS.includes(value as StockThreshold);
}

export function isBuyReminderHours(value: unknown): value is BuyReminderHours {
  return BUY_REMINDER_HOURS.includes(value as BuyReminderHours);
}

export function validateStockCount(count: number): Result<number, AppError> {
  if (!Number.isInteger(count) || count < 0) {
    return err({ code: "INVALID_STOCK_COUNT", message: "Stock count must be an integer >= 0" });
  }
  return ok(count);
}

export function validateStockThreshold(threshold: number): Result<StockThreshold, AppError> {
  if (!isStockThreshold(threshold)) {
    return err({ code: "INVALID_STOCK_THRESHOLD", message: "Stock threshold must be 0, 1 or 2" });
  }
  return ok(threshold);
}

/**
 * Accepts a non-empty list of distinct values from {24, 48, 72} and returns it
 * sorted from highest to lowest, which is the persisted order.
 */
export function validateBuyReminderHours(
  hours: readonly number[],
): Result<BuyReminderHours[], AppError> {
  const invalid = (message: string): Result<BuyReminderHours[], AppError> =>
    err({ code: "INVALID_BUY_REMINDER_HOURS", message });

  if (hours.length === 0) return invalid("At least one reminder is required");
  if (new Set(hours).size !== hours.length) return invalid("Reminder hours must be unique");

  const valid: BuyReminderHours[] = [];
  for (const h of hours) {
    if (!isBuyReminderHours(h)) return invalid(`Reminder hours must be one of ${BUY_REMINDER_HOURS.join(", ")}`);
    valid.push(h);
  }
  return ok(valid.sort((a, b) => b - a));
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

function addDaysUtc(isoUtc: string, days: number): string {
  const d = new Date(isoUtc);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function latest(aIso: string, bIso: string): string {
  return new Date(aIso).getTime() >= new Date(bIso).getTime() ? aIso : bIso;
}

/** Days a single ring lasts in the given regimen, rest week included. */
export function daysPerRing(regimen: Regimen, continuousDays: number): number {
  return regimen === "CONTINUOUS" ? continuousDays : CYCLIC_RING_DAYS + CYCLIC_FREE_DAYS;
}

/**
 * When the next ring from the stock will be inserted. Never earlier than `now`:
 * if the planned date already passed, the ring is needed right away.
 */
export function nextInsertDate(cycle: Cycle | null, now: string): string {
  const uiState = deriveUiState(cycle, now);
  if (cycle === null || uiState === "NO_RING") return now;

  if (uiState === "RING_IN_USE") {
    const restDays = cycle.regimen === "CYCLIC_21_7" ? CYCLIC_FREE_DAYS : 0;
    return latest(addDaysUtc(cycle.plannedRemovalAt, restDays), now);
  }

  return latest(addDaysUtc(cycle.removedAt ?? now, CYCLIC_FREE_DAYS), now);
}

/** Date until which the rings at home last. */
export function stockRunOut(cycle: Cycle | null, count: number, now: string, ringDays: number): string {
  return addDaysUtc(nextInsertDate(cycle, now), count * ringDays);
}

/** Last day to buy: the day the last ring at home gets inserted. */
export function buyBy(cycle: Cycle | null, count: number, now: string, ringDays: number): string {
  if (count === 0) return nextInsertDate(cycle, now);
  return addDaysUtc(stockRunOut(cycle, count, now, ringDays), -ringDays);
}

export function isLowStock(count: number, threshold: StockThreshold): boolean {
  return count <= threshold;
}

/**
 * Low-stock warnings (Inicio notice, buy reminders) only apply once the user
 * has saved her stock at least once; until then 0 means "not set", not "none".
 */
export function needsBuyWarning(count: number, threshold: StockThreshold, configured: boolean): boolean {
  return configured && isLowStock(count, threshold);
}
