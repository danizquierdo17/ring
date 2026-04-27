/**
 * @jest-environment node
 */
import {
  deriveUiState,
  insertRing,
  removeRing,
  calcDayOfCycle,
  CYCLIC_RING_DAYS,
  CYCLIC_FREE_DAYS,
  CONTINUOUS_DEFAULT_DAYS,
} from "./cycleStateMachine";
import { isOk, isErr } from "../../../shared/result";
import type { Cycle } from "./cycleStateMachine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function activeCycle(insertedAt: string, regimen: Cycle["regimen"] = "CYCLIC_21_7"): Cycle {
  const plannedDays = regimen === "CYCLIC_21_7" ? CYCLIC_RING_DAYS : CONTINUOUS_DEFAULT_DAYS;
  const planned = new Date(insertedAt);
  planned.setUTCDate(planned.getUTCDate() + plannedDays);
  return {
    id: "test-id-1",
    regimen,
    insertedAt,
    removedAt: null,
    plannedRemovalAt: planned.toISOString(),
    status: "ACTIVE",
    notes: null,
    createdAt: insertedAt,
    updatedAt: insertedAt,
  };
}

function completedCycle(insertedAt: string, removedAt: string): Cycle {
  return {
    id: "test-id-2",
    regimen: "CYCLIC_21_7",
    insertedAt,
    removedAt,
    plannedRemovalAt: removedAt,
    status: "COMPLETED",
    notes: null,
    createdAt: insertedAt,
    updatedAt: removedAt,
  };
}

// ---------------------------------------------------------------------------
// deriveUiState
// ---------------------------------------------------------------------------

describe("deriveUiState", () => {
  const now = isoDate(2026, 4, 15);

  it("returns NO_RING when there is no cycle", () => {
    expect(deriveUiState(null, now)).toBe("NO_RING");
  });

  it("returns RING_IN_USE when cycle is ACTIVE", () => {
    const cycle = activeCycle(isoDate(2026, 4, 1));
    expect(deriveUiState(cycle, now)).toBe("RING_IN_USE");
  });

  it("returns RING_FREE when COMPLETED cycle is within the 7-day rest window", () => {
    const removed = isoDate(2026, 4, 10);
    // now is day 5 of free week (10 → 17, we are on 15)
    const cycle = completedCycle(isoDate(2026, 3, 20), removed);
    expect(deriveUiState(cycle, now)).toBe("RING_FREE");
  });

  it("returns NO_RING when COMPLETED cycle's 7-day free period has elapsed", () => {
    const removed = isoDate(2026, 4, 1);
    // now is April 15 — 14 days after removal, free period over
    const cycle = completedCycle(isoDate(2026, 3, 11), removed);
    expect(deriveUiState(cycle, now)).toBe("NO_RING");
  });

  it("returns NO_RING for INTERRUPTED cycle regardless of timing", () => {
    const cycle: Cycle = {
      ...activeCycle(isoDate(2026, 4, 1)),
      status: "INTERRUPTED",
      removedAt: isoDate(2026, 4, 5),
    };
    expect(deriveUiState(cycle, now)).toBe("NO_RING");
  });

  it("returns NO_RING for a COMPLETED CONTINUOUS cycle (no free week)", () => {
    const removed = isoDate(2026, 4, 10);
    const cycle: Cycle = {
      ...completedCycle(isoDate(2026, 3, 13), removed),
      regimen: "CONTINUOUS",
    };
    // CONTINUOUS never has RING_FREE — should be NO_RING immediately
    expect(deriveUiState(cycle, now)).toBe("NO_RING");
  });
});

// ---------------------------------------------------------------------------
// insertRing
// ---------------------------------------------------------------------------

describe("insertRing", () => {
  const now = isoDate(2026, 4, 15);

  it("creates a CYCLIC_21_7 cycle with plannedRemovalAt = +21 days", () => {
    const result = insertRing(now, "CYCLIC_21_7");
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const cycle = result.value;
    expect(cycle.regimen).toBe("CYCLIC_21_7");
    expect(cycle.status).toBe("ACTIVE");
    expect(cycle.insertedAt).toBe(now);
    expect(cycle.removedAt).toBeNull();

    const expected = isoDate(2026, 5, 6); // April 15 + 21 = May 6
    expect(cycle.plannedRemovalAt).toBe(expected);
  });

  it("creates a CONTINUOUS cycle with plannedRemovalAt = +28 days by default", () => {
    const result = insertRing(now, "CONTINUOUS");
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const cycle = result.value;
    expect(cycle.regimen).toBe("CONTINUOUS");

    const expected = isoDate(2026, 5, 13); // April 15 + 28 = May 13
    expect(cycle.plannedRemovalAt).toBe(expected);
  });

  it("respects a custom continuousLengthDays for CONTINUOUS regimen", () => {
    const result = insertRing(now, "CONTINUOUS", 35);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const expected = isoDate(2026, 5, 20); // April 15 + 35 = May 20
    expect(result.value.plannedRemovalAt).toBe(expected);
  });

  it("returns Err when called while a cycle is already ACTIVE", () => {
    const existing = activeCycle(isoDate(2026, 4, 1));
    const result = insertRing(now, "CYCLIC_21_7", undefined, existing);
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("CYCLE_ALREADY_ACTIVE");
  });

  it("generates a non-empty UUID for the new cycle id", () => {
    const result = insertRing(now, "CYCLIC_21_7");
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

// ---------------------------------------------------------------------------
// removeRing
// ---------------------------------------------------------------------------

describe("removeRing", () => {
  const insertedAt = isoDate(2026, 4, 1);
  const now = isoDate(2026, 4, 15);

  it("marks an ACTIVE cycle as COMPLETED and sets removedAt", () => {
    const cycle = activeCycle(insertedAt);
    const result = removeRing(cycle, now);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    expect(result.value.status).toBe("COMPLETED");
    expect(result.value.removedAt).toBe(now);
  });

  it("returns Err when the cycle is not ACTIVE", () => {
    const cycle = completedCycle(insertedAt, isoDate(2026, 4, 10));
    const result = removeRing(cycle, now);
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("CYCLE_NOT_ACTIVE");
  });

  it("returns Err when removedAt is before insertedAt", () => {
    const cycle = activeCycle(insertedAt);
    const before = isoDate(2026, 3, 28); // 3 days before insertion
    const result = removeRing(cycle, before);
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("INVALID_DATE");
  });
});

// ---------------------------------------------------------------------------
// calcDayOfCycle
// ---------------------------------------------------------------------------

describe("calcDayOfCycle", () => {
  it("returns 1 on the day of insertion", () => {
    const inserted = isoDate(2026, 4, 1);
    const now = isoDate(2026, 4, 1);
    expect(calcDayOfCycle(inserted, now)).toBe(1);
  });

  it("returns 2 the following day", () => {
    const inserted = isoDate(2026, 4, 1);
    const now = isoDate(2026, 4, 2);
    expect(calcDayOfCycle(inserted, now)).toBe(2);
  });

  it("returns 21 on day 21", () => {
    const inserted = isoDate(2026, 4, 1);
    const now = isoDate(2026, 4, 21);
    expect(calcDayOfCycle(inserted, now)).toBe(21);
  });

  it("is based on calendar days (midnight boundaries), not 24-h windows", () => {
    // inserted at 23:59 UTC, now at 00:01 next day = day 2
    const inserted = "2026-04-01T23:59:00.000Z";
    const now = "2026-04-02T00:01:00.000Z";
    expect(calcDayOfCycle(inserted, now)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Constants sanity check
// ---------------------------------------------------------------------------

describe("domain constants", () => {
  it("CYCLIC_21_7 has 21 ring days and 7 free days", () => {
    expect(CYCLIC_RING_DAYS).toBe(21);
    expect(CYCLIC_FREE_DAYS).toBe(7);
  });

  it("CONTINUOUS default is 28 days", () => {
    expect(CONTINUOUS_DEFAULT_DAYS).toBe(28);
  });
});
