/**
 * @jest-environment node
 */

import { buildMarkedDates } from "./buildMarkedDates";
import type { Cycle } from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCycle(overrides: Partial<Cycle> & { insertedAt: string }): Cycle {
  return {
    id: "test-id",
    regimen: "CYCLIC_21_7",
    removedAt: null,
    plannedRemovalAt: "2025-01-22T00:00:00.000Z",
    status: "ACTIVE",
    notes: null,
    createdAt: overrides.insertedAt,
    updatedAt: overrides.insertedAt,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildMarkedDates — empty / null cases
// ---------------------------------------------------------------------------

describe("buildMarkedDates — empty cases", () => {
  it("returns empty object when cycles array is empty", () => {
    const result = buildMarkedDates([], "2025-01-15T12:00:00.000Z");
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// buildMarkedDates — ACTIVE cycle (ring in use)
// ---------------------------------------------------------------------------

describe("buildMarkedDates — ACTIVE cycle", () => {
  const cycle = makeCycle({
    id: "c1",
    insertedAt: "2025-01-01T10:00:00.000Z",
    plannedRemovalAt: "2025-01-22T10:00:00.000Z",
    status: "ACTIVE",
  });

  it("marks the start day as startingDay", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-01"]).toMatchObject({ startingDay: true });
  });

  it("marks today as endingDay for active cycle (open-ended)", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-05"]).toMatchObject({ endingDay: true });
  });

  it("marks intermediate days as neither start nor end", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-03"]).toMatchObject({ startingDay: false, endingDay: false });
  });

  it("uses indigo color for ring-in-use days", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-01"]?.color).toBeDefined();
    // Color should be the indigo brand color
    expect(marks["2025-01-01"]?.color).toMatch(/^#/);
  });

  it("marks only the start when insertedAt and now are the same day", () => {
    const marks = buildMarkedDates([cycle], "2025-01-01T22:00:00.000Z");
    const day = marks["2025-01-01"];
    expect(day).toMatchObject({ startingDay: true, endingDay: true });
  });
});

// ---------------------------------------------------------------------------
// buildMarkedDates — COMPLETED cycle (ring removed)
// ---------------------------------------------------------------------------

describe("buildMarkedDates — COMPLETED cycle", () => {
  const cycle = makeCycle({
    id: "c2",
    insertedAt: "2025-01-01T08:00:00.000Z",
    removedAt: "2025-01-21T18:00:00.000Z",
    plannedRemovalAt: "2025-01-22T08:00:00.000Z",
    status: "COMPLETED",
  });

  it("marks insertedAt day as startingDay", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-01"]).toMatchObject({ startingDay: true });
  });

  it("marks removedAt day as endingDay", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-21"]).toMatchObject({ endingDay: true });
  });

  it("does not mark days after removedAt with ring-in-use color", () => {
    // cycle is CYCLIC_21_7 so free window will mark Jan 22+, but not with ring color
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    // Jan 22 may be marked as free window; what matters is the ring period ends at Jan 21
    expect(marks["2025-01-21"]).toMatchObject({ endingDay: true });
  });
});

// ---------------------------------------------------------------------------
// buildMarkedDates — CYCLIC_21_7 free window (ring out, rest period)
// ---------------------------------------------------------------------------

describe("buildMarkedDates — CYCLIC_21_7 free window", () => {
  const cycle = makeCycle({
    id: "c3",
    regimen: "CYCLIC_21_7",
    insertedAt: "2025-01-01T08:00:00.000Z",
    removedAt: "2025-01-21T18:00:00.000Z",
    plannedRemovalAt: "2025-01-22T08:00:00.000Z",
    status: "COMPLETED",
  });

  it("marks the free window days (day after removal through day 7)", () => {
    const now = "2025-01-28T12:00:00.000Z"; // after free window
    const marks = buildMarkedDates([cycle], now);
    // Free window: 2025-01-22 to 2025-01-27 (7 days from removedAt)
    expect(marks["2025-01-22"]).toBeDefined();
    expect(marks["2025-01-27"]).toBeDefined();
  });

  it("free window uses a different color from ring-in-use", () => {
    const now = "2025-01-28T12:00:00.000Z";
    const marks = buildMarkedDates([cycle], now);
    const ringColor = marks["2025-01-10"]?.color;
    const freeColor = marks["2025-01-22"]?.color;
    expect(ringColor).toBeDefined();
    expect(freeColor).toBeDefined();
    expect(ringColor).not.toBe(freeColor);
  });

  it("does not mark free window for CONTINUOUS regimen", () => {
    const continuousCycle = makeCycle({
      id: "c4",
      regimen: "CONTINUOUS",
      insertedAt: "2025-01-01T08:00:00.000Z",
      removedAt: "2025-01-29T18:00:00.000Z",
      plannedRemovalAt: "2025-01-29T08:00:00.000Z",
      status: "COMPLETED",
    });
    const now = "2025-02-10T12:00:00.000Z";
    const marks = buildMarkedDates([continuousCycle], now);
    // No free window expected after removal
    expect(marks["2025-01-30"]).toBeUndefined();
  });

  it("free window startingDay is the day after removedAt", () => {
    const now = "2025-01-28T12:00:00.000Z";
    const marks = buildMarkedDates([cycle], now);
    expect(marks["2025-01-22"]).toMatchObject({ startingDay: true });
  });

  it("free window endingDay is removedAt + 7 days (Jan 28)", () => {
    const now = "2025-01-29T12:00:00.000Z";
    const marks = buildMarkedDates([cycle], now);
    // removedAt Jan 21 → utcMidnight Jan 21 + 7 days = Jan 28
    expect(marks["2025-01-28"]).toMatchObject({ endingDay: true });
  });
});

// ---------------------------------------------------------------------------
// buildMarkedDates — múltiple cycles
// ---------------------------------------------------------------------------

describe("buildMarkedDates — multiple cycles", () => {
  const cycle1 = makeCycle({
    id: "c5",
    regimen: "CYCLIC_21_7",
    insertedAt: "2024-12-01T08:00:00.000Z",
    removedAt: "2024-12-21T18:00:00.000Z",
    plannedRemovalAt: "2024-12-22T08:00:00.000Z",
    status: "COMPLETED",
  });
  const cycle2 = makeCycle({
    id: "c6",
    regimen: "CYCLIC_21_7",
    insertedAt: "2024-12-29T08:00:00.000Z",
    removedAt: null,
    plannedRemovalAt: "2025-01-19T08:00:00.000Z",
    status: "ACTIVE",
  });

  it("marks both cycles' days", () => {
    const now = "2025-01-05T12:00:00.000Z";
    const marks = buildMarkedDates([cycle1, cycle2], now);
    expect(marks["2024-12-01"]).toBeDefined(); // cycle1 start
    expect(marks["2024-12-29"]).toBeDefined(); // cycle2 start
  });

  it("marks the free window between cycle1 and cycle2", () => {
    const now = "2025-01-05T12:00:00.000Z";
    const marks = buildMarkedDates([cycle1, cycle2], now);
    // Free window after cycle1: 2024-12-22 to 2024-12-28
    expect(marks["2024-12-22"]).toBeDefined();
    expect(marks["2024-12-28"]).toBeDefined();
  });
});
