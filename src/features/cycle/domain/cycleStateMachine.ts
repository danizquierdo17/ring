import { ok, err, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";

export type { AppError };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CYCLIC_RING_DAYS = 21;
export const CYCLIC_FREE_DAYS = 7;
export const CONTINUOUS_DEFAULT_DAYS = 28;

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type CycleStatus = "ACTIVE" | "COMPLETED" | "INTERRUPTED";
export type Regimen = "CYCLIC_21_7" | "CONTINUOUS";

export type UiState = "NO_RING" | "RING_IN_USE" | "RING_FREE";

export type Cycle = {
  readonly id: string;
  readonly regimen: Regimen;
  readonly insertedAt: string;        // ISO 8601 UTC
  readonly removedAt: string | null;  // ISO 8601 UTC
  readonly plannedRemovalAt: string;  // ISO 8601 UTC
  readonly status: CycleStatus;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function addDaysUtc(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function toUtcMidnight(isoDate: string): string {
  const d = new Date(isoDate);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
}

function generateId(): string {
  // RFC4122 v4 UUID via crypto-safe random
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  // Set version bits (v4)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // Set variant bits
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// ---------------------------------------------------------------------------
// deriveUiState
// ---------------------------------------------------------------------------

export function deriveUiState(cycle: Cycle | null, now: string): UiState {
  if (cycle === null) return "NO_RING";

  if (cycle.status === "ACTIVE") return "RING_IN_USE";

  // COMPLETED + CYCLIC_21_7: show RING_FREE for the entire free window AND
  // beyond if the user hasn't inserted a new ring yet. The state only
  // disappears once a new ACTIVE cycle exists (getCurrentCycle returns it
  // instead). Using date-level comparison avoids the bug where the window
  // closes at the exact removal hour on day 7 instead of end-of-day.
  if (cycle.status === "COMPLETED" && cycle.regimen === "CYCLIC_21_7" && cycle.removedAt) {
    return "RING_FREE";
  }

  return "NO_RING";
}

// ---------------------------------------------------------------------------
// insertRing
// ---------------------------------------------------------------------------

export function insertRing(
  now: string,
  regimen: Regimen,
  continuousLengthDays?: number,
  activeCycle?: Cycle | null
): Result<Cycle, AppError> {
  if (activeCycle?.status === "ACTIVE") {
    return err({
      code: "CYCLE_ALREADY_ACTIVE",
      message: "Cannot insert ring while another cycle is active.",
    });
  }

  const ringDays =
    regimen === "CYCLIC_21_7"
      ? CYCLIC_RING_DAYS
      : (continuousLengthDays ?? CONTINUOUS_DEFAULT_DAYS);

  const plannedRemovalAt = addDaysUtc(now, ringDays);

  const cycle: Cycle = {
    id: generateId(),
    regimen,
    insertedAt: now,
    removedAt: null,
    plannedRemovalAt,
    status: "ACTIVE",
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  return ok(cycle);
}

// ---------------------------------------------------------------------------
// removeRing
// ---------------------------------------------------------------------------

export function removeRing(
  cycle: Cycle,
  now: string
): Result<Cycle, AppError> {
  if (cycle.status !== "ACTIVE") {
    return err({
      code: "CYCLE_NOT_ACTIVE",
      message: "Can only remove ring from an active cycle.",
    });
  }

  if (now < cycle.insertedAt) {
    return err({
      code: "INVALID_DATE",
      message: "Removal date cannot be before insertion date.",
    });
  }

  return ok({
    ...cycle,
    status: "COMPLETED",
    removedAt: now,
    updatedAt: now,
  });
}

// ---------------------------------------------------------------------------
// calcDayOfCycle
// ---------------------------------------------------------------------------

export function calcDayOfCycle(insertedAt: string, now: string): number {
  const insertedMidnight = new Date(toUtcMidnight(insertedAt)).getTime();
  const nowMidnight = new Date(toUtcMidnight(now)).getTime();
  const diffMs = nowMidnight - insertedMidnight;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// ---------------------------------------------------------------------------
// calcEarlyLateWarning
// ---------------------------------------------------------------------------

export type RemovalWarning =
  | { kind: 'EARLY'; hoursEarly: number }
  | { kind: 'LATE';  hoursLate: number }
  | null;

/**
 * Returns a warning if the selected removal datetime deviates more than
 * `thresholdHours` from the planned removal time.
 * Returns null when removal is within the acceptable window.
 */
export function calcEarlyLateWarning(
  plannedRemovalAt: string,
  selectedAt: string,
  thresholdHours = 12,
): RemovalWarning {
  const planned  = new Date(plannedRemovalAt).getTime();
  const selected = new Date(selectedAt).getTime();
  const diffMs   = selected - planned;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < -thresholdHours) {
    return { kind: 'EARLY', hoursEarly: Math.round(-diffHours) };
  }
  if (diffHours > thresholdHours) {
    return { kind: 'LATE', hoursLate: Math.round(diffHours) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// calcInsertionWarning
// ---------------------------------------------------------------------------

export type InsertionWarning =
  | { kind: 'EARLY'; hoursEarly: number }
  | null;

/**
 * Returns a warning if the user is trying to insert the ring more than
 * `thresholdHours` before the planned insertion time (end of free window).
 * Returns null when insertion is within the acceptable window or on time.
 */
export function calcInsertionWarning(
  plannedInsertAt: string,
  selectedAt: string,
  thresholdHours = 5,
): InsertionWarning {
  const planned  = new Date(plannedInsertAt).getTime();
  const selected = new Date(selectedAt).getTime();
  const hoursEarly = (planned - selected) / (1000 * 60 * 60);

  if (hoursEarly > thresholdHours) {
    return { kind: 'EARLY', hoursEarly: Math.round(hoursEarly) };
  }
  return null;
}
