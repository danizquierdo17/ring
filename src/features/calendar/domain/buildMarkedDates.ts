import type { Cycle } from "../../cycle/domain/cycleStateMachine";
import { CYCLIC_FREE_DAYS } from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayMark = {
  color: string;
  textColor: string;
  startingDay: boolean;
  endingDay: boolean;
  /** Optional border rendered on top of the background (for "planned" days). */
  borderColor?: string;
};

export type MarkedDates = Record<string, DayMark>;

// ---------------------------------------------------------------------------
// Color tokens — kept local so this pure domain file has zero UI imports
// and runs cleanly in the node jest environment.
// ---------------------------------------------------------------------------

const COLOR_INSERT          = "#2ECC9A"; // emerald: confirmed insertion
const COLOR_RING            = "#3A3CF6"; // indigo:  active ring band
const COLOR_REMOVE          = "#FF6B7A"; // coral:   confirmed removal
const COLOR_PLANNED_REMOVAL = "#E7E6FF"; // lavender: planned removal bg
const COLOR_FREE            = "#E7E6FF"; // lavender: free-window band
const COLOR_PLANNED_INSERT  = "#E7E6FF"; // lavender: planned insertion bg
const BORDER_PLANNED_REMOVE = "#FF6B7A"; // coral border on planned removal
const BORDER_PLANNED_INSERT = "#2ECC9A"; // emerald border on planned insertion
const TEXT_DARK             = "#3A3CF6"; // indigo on light backgrounds
const TEXT_LIGHT            = "#ffffff";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toDateKey(isoUtc: string): string {
  const d = new Date(isoUtc);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysUtc(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function utcMidnight(isoDate: string): string {
  const d = new Date(isoDate);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function daysBetween(startIso: string, endIso: string): number {
  return Math.round(
    (new Date(utcMidnight(endIso)).getTime() - new Date(utcMidnight(startIso)).getTime()) / 86_400_000,
  );
}

function singleDay(marks: MarkedDates, isoDate: string, color: string, textColor: string, borderColor?: string): void {
  marks[toDateKey(isoDate)] = { color, textColor, startingDay: true, endingDay: true, borderColor };
}

function fillPeriod(marks: MarkedDates, startIso: string, endIso: string, color: string, textColor: string): void {
  const days = daysBetween(startIso, endIso);
  if (days < 0) return;
  for (let i = 0; i <= days; i++) {
    const key = toDateKey(addDaysUtc(utcMidnight(startIso), i));
    marks[key] = { color, textColor, startingDay: i === 0, endingDay: i === days };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produces CalendarScreen marks from a list of Cycle records.
 *
 * Active cycle:
 *   - Emerald dot on insertedAt
 *   - Indigo band from day+1 to today (exclusive of endpoints)
 *   - Lavender+coral-border dot on plannedRemovalAt (future)
 *
 * Completed cycle:
 *   - Emerald dot on insertedAt
 *   - Indigo band between insertion and removal (exclusive)
 *   - Coral dot on removedAt
 *   - Lavender band for 7-day free window (CYCLIC_21_7 only)
 */
export function buildMarkedDates(cycles: Cycle[], now: string): MarkedDates {
  const marks: MarkedDates = {};

  for (const cycle of cycles) {
    if (cycle.status === "ACTIVE") {
      // Indigo band: day after insertion up to today (ring is in use today)
      const dayAfter = addDaysUtc(utcMidnight(cycle.insertedAt), 1);
      if (daysBetween(dayAfter, now) >= 0) {
        fillPeriod(marks, dayAfter, now, COLOR_RING, TEXT_LIGHT);
      }

      // Insertion day: emerald (overrides band start)
      singleDay(marks, cycle.insertedAt, COLOR_INSERT, TEXT_LIGHT);

      // Planned removal: lavender with coral border
      if (cycle.plannedRemovalAt) {
        singleDay(marks, cycle.plannedRemovalAt, COLOR_PLANNED_REMOVAL, TEXT_DARK, BORDER_PLANNED_REMOVE);
      }

      // Planned insertion: lavender with emerald border (removedAt would be + FREE_DAYS,
      // but for ACTIVE cycles we derive it from plannedRemovalAt + FREE_DAYS)
      if (cycle.regimen === "CYCLIC_21_7" && cycle.plannedRemovalAt) {
        const plannedInsertAt = addDaysUtc(utcMidnight(cycle.plannedRemovalAt), CYCLIC_FREE_DAYS);
        singleDay(marks, plannedInsertAt, COLOR_PLANNED_INSERT, TEXT_DARK, BORDER_PLANNED_INSERT);
      }
    } else {
      // COMPLETED
      if (!cycle.removedAt) continue;

      // Indigo band between insertion and removal (exclusive endpoints)
      const dayAfter = addDaysUtc(utcMidnight(cycle.insertedAt), 1);
      const dayBeforeRemoval = addDaysUtc(utcMidnight(cycle.removedAt), -1);
      if (daysBetween(dayAfter, dayBeforeRemoval) >= 0) {
        fillPeriod(marks, dayAfter, dayBeforeRemoval, COLOR_RING, TEXT_LIGHT);
      }

      // Insertion day: emerald
      singleDay(marks, cycle.insertedAt, COLOR_INSERT, TEXT_LIGHT);

      // Actual removal day: coral
      singleDay(marks, cycle.removedAt, COLOR_REMOVE, TEXT_LIGHT);

      // Free window + planned insertion day (CYCLIC_21_7 only)
      if (cycle.regimen === "CYCLIC_21_7") {
        // Lavender band for rest days (day+1 through day+(FREE_DAYS-1))
        const freeStart      = addDaysUtc(utcMidnight(cycle.removedAt), 1);
        const freeEnd        = addDaysUtc(utcMidnight(cycle.removedAt), CYCLIC_FREE_DAYS - 1);
        const plannedInsertAt = addDaysUtc(utcMidnight(cycle.removedAt), CYCLIC_FREE_DAYS);
        fillPeriod(marks, freeStart, freeEnd, COLOR_FREE, TEXT_DARK);
        // Planned insertion day: lavender with emerald border (overrides band end)
        singleDay(marks, plannedInsertAt, COLOR_PLANNED_INSERT, TEXT_DARK, BORDER_PLANNED_INSERT);
      }
    }
  }

  return marks;
}
