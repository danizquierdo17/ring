/**
 * @jest-environment node
 */

import { buildMarkedDates, buildEditableEvents } from "./buildMarkedDates";
import type { Cycle } from "../../cycle/domain/cycleStateMachine";

// Color values mirrored from shared/theme/colors — kept local so this
// test file has zero UI-framework imports.
const EMERALD  = "#2ECC9A";
const INDIGO   = "#3A3CF6";
const CORAL    = "#FF6B7A";
const LAVENDER = "#E7E6FF";

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
// Empty cases
// ---------------------------------------------------------------------------

describe("buildMarkedDates — empty cases", () => {
  it("returns empty object when cycles array is empty", () => {
    expect(buildMarkedDates([], "2025-01-15T12:00:00.000Z")).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// ACTIVE cycle
// ---------------------------------------------------------------------------

describe("buildMarkedDates — ACTIVE cycle", () => {
  const cycle = makeCycle({
    id: "c1",
    insertedAt: "2025-01-01T10:00:00.000Z",
    plannedRemovalAt: "2025-01-22T10:00:00.000Z",
    status: "ACTIVE",
  });

  it("insertion day is emerald (single dot)", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-01"]).toMatchObject({ color: EMERALD, startingDay: true, endingDay: true });
  });

  it("band days use indigo", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-03"]).toMatchObject({ color: INDIGO, startingDay: false, endingDay: false });
  });

  it("today is the end of the indigo band (ring in use today)", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-05"]).toMatchObject({ color: INDIGO, endingDay: true });
  });

  it("planned removal day gets lavender with coral border", () => {
    const marks = buildMarkedDates([cycle], "2025-01-05T12:00:00.000Z");
    expect(marks["2025-01-22"]).toMatchObject({ color: LAVENDER, borderColor: CORAL, startingDay: true, endingDay: true });
  });

  it("only insertion day when insertedAt and now are same day", () => {
    const marks = buildMarkedDates([cycle], "2025-01-01T22:00:00.000Z");
    expect(marks["2025-01-01"]).toMatchObject({ color: EMERALD, startingDay: true, endingDay: true });
    // No band days (no room between insertion and today)
    expect(marks["2025-01-02"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// COMPLETED cycle
// ---------------------------------------------------------------------------

describe("buildMarkedDates — COMPLETED cycle", () => {
  const cycle = makeCycle({
    id: "c2",
    insertedAt: "2025-01-01T08:00:00.000Z",
    removedAt: "2025-01-21T18:00:00.000Z",
    plannedRemovalAt: "2025-01-22T08:00:00.000Z",
    status: "COMPLETED",
  });

  it("insertion day is emerald", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-01"]).toMatchObject({ color: EMERALD, startingDay: true, endingDay: true });
  });

  it("removal day is coral (single dot)", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-21"]).toMatchObject({ color: CORAL, startingDay: true, endingDay: true });
  });

  it("day between insertion and removal is indigo band", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-10"]).toMatchObject({ color: INDIGO });
  });

  it("day before removal is end of indigo band", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-20"]).toMatchObject({ color: INDIGO, endingDay: true });
  });

  it("day after removal is NOT indigo (free window or unmarked)", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-22"]?.color).not.toBe(INDIGO);
  });
});

// ---------------------------------------------------------------------------
// CYCLIC_21_7 free window
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

  it("free window starts day after removal (Jan 22)", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-22"]).toMatchObject({ color: LAVENDER, startingDay: true });
  });

  it("free window (lavender band) ends on removedAt + 6 days (Jan 27)", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-27"]).toMatchObject({ color: LAVENDER, endingDay: true });
  });

  it("planned insertion day (removedAt + 7 = Jan 28) has emerald border when still in the future", () => {
    // now = Jan 25, so Jan 28 is still future → mark shown
    const marks = buildMarkedDates([cycle], "2025-01-25T12:00:00.000Z");
    expect(marks["2025-01-28"]).toMatchObject({ color: LAVENDER, borderColor: "#2ECC9A", startingDay: true, endingDay: true });
  });

  it("planned insertion day is NOT shown when now is a later date (past it)", () => {
    // now = Feb 1 (a different date, not Jan 28) → should not appear
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-28"]).toBeUndefined();
  });

  it("planned insertion day IS shown when now is the same day (any time)", () => {
    // now = Jan 28 at 23:59 — mark should still be visible on Jan 28
    const marks = buildMarkedDates([cycle], "2025-01-28T23:59:00.000Z");
    expect(marks["2025-01-28"]).toMatchObject({ color: LAVENDER, borderColor: "#2ECC9A" });
  });

  it("day Jan 25 is inside the free window", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-25"]).toMatchObject({ color: LAVENDER });
  });

  it("free window uses a different color from the ring band", () => {
    const marks = buildMarkedDates([cycle], "2025-02-01T12:00:00.000Z");
    expect(marks["2025-01-10"]?.color).not.toBe(marks["2025-01-22"]?.color);
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
    const marks = buildMarkedDates([continuousCycle], "2025-02-10T12:00:00.000Z");
    expect(marks["2025-01-30"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Multiple cycles
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

  it("marks both cycles insertion days", () => {
    const marks = buildMarkedDates([cycle1, cycle2], "2025-01-05T12:00:00.000Z");
    expect(marks["2024-12-01"]).toMatchObject({ color: EMERALD });
    expect(marks["2024-12-29"]).toMatchObject({ color: EMERALD });
  });

  it("marks the free window between cycle1 and cycle2", () => {
    const marks = buildMarkedDates([cycle1, cycle2], "2025-01-05T12:00:00.000Z");
    // Free band: Dec 22 (start) to Dec 27 (end, = removedAt+6)
    expect(marks["2024-12-22"]).toMatchObject({ color: LAVENDER, startingDay: true });
    expect(marks["2024-12-27"]).toMatchObject({ color: LAVENDER, endingDay: true });
    // Planned insertion (Dec 28) is in the past (now=Jan 5) and cycle2 already started →
    // the mark is not shown; Dec 28 is overwritten by cycle2's emerald insertion day
    expect(marks["2024-12-28"]).toBeUndefined();
  });

  it("cycle1 removal day is coral", () => {
    const marks = buildMarkedDates([cycle1, cycle2], "2025-01-05T12:00:00.000Z");
    expect(marks["2024-12-21"]).toMatchObject({ color: CORAL });
  });
});

// ---------------------------------------------------------------------------
// buildEditableEvents
// ---------------------------------------------------------------------------

describe("buildEditableEvents", () => {
  it("returns insertion day for active cycle", () => {
    const cycle = makeCycle({ insertedAt: "2025-01-01T10:00:00.000Z", status: "ACTIVE" });
    const events = buildEditableEvents([cycle]);
    expect(events["2025-01-01"]).toBeDefined();
    expect(events["2025-01-01"]!.field).toBe("inserted_at");
    expect(events["2025-01-01"]!.cycleId).toBe("test-id");
  });

  it("does not return removal day for active cycle", () => {
    const cycle = makeCycle({ insertedAt: "2025-01-01T10:00:00.000Z", status: "ACTIVE" });
    const events = buildEditableEvents([cycle]);
    // plannedRemovalAt is 2025-01-22 — should NOT be editable
    expect(events["2025-01-22"]).toBeUndefined();
  });

  it("returns both insertion and removal day for completed cycle", () => {
    const cycle = makeCycle({
      insertedAt: "2025-01-01T10:00:00.000Z",
      removedAt: "2025-01-21T10:00:00.000Z",
      status: "COMPLETED",
    });
    const events = buildEditableEvents([cycle]);
    expect(events["2025-01-01"]!.field).toBe("inserted_at");
    expect(events["2025-01-21"]!.field).toBe("removed_at");
  });

  it("removal event has pairedIso = insertedAt", () => {
    const cycle = makeCycle({
      insertedAt: "2025-01-01T10:00:00.000Z",
      removedAt: "2025-01-21T10:00:00.000Z",
      status: "COMPLETED",
    });
    const events = buildEditableEvents([cycle]);
    expect(events["2025-01-21"]!.pairedIso).toBe("2025-01-01T10:00:00.000Z");
  });

  it("insertion event has pairedIso = removedAt when completed", () => {
    const cycle = makeCycle({
      insertedAt: "2025-01-01T10:00:00.000Z",
      removedAt: "2025-01-21T10:00:00.000Z",
      status: "COMPLETED",
    });
    const events = buildEditableEvents([cycle]);
    expect(events["2025-01-01"]!.pairedIso).toBe("2025-01-21T10:00:00.000Z");
  });

  it("returns empty object for empty cycles", () => {
    expect(buildEditableEvents([])).toEqual({});
  });
});
