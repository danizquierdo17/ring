import { ok, err, type Result } from "../../../shared/result";

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

export type AppError = {
  readonly code:
    | "CYCLE_ALREADY_ACTIVE"
    | "CYCLE_NOT_ACTIVE"
    | "INVALID_DATE";
  readonly message: string;
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

  if (cycle.status === "COMPLETED" && cycle.regimen === "CYCLIC_21_7") {
    const removedAt = cycle.removedAt!;
    const freeWindowEnd = addDaysUtc(removedAt, CYCLIC_FREE_DAYS);
    if (now < freeWindowEnd) return "RING_FREE";
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
