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
};

export type MarkedDates = Record<string, DayMark>;

// ---------------------------------------------------------------------------
// Color tokens (matches tailwind indigo/rose palette)
// ---------------------------------------------------------------------------

const COLOR_RING_IN_USE = "#4f46e5"; // indigo-600
const COLOR_RING_FREE   = "#f43f5e"; // rose-500
const TEXT_ON_COLOR     = "#ffffff";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toLocalDateKey(isoUtc: string): string {
  // Use UTC date parts so markings are consistent regardless of device timezone
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
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  ).toISOString();
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(utcMidnight(startIso)).getTime();
  const end = new Date(utcMidnight(endIso)).getTime();
  return Math.round((end - start) / 86_400_000);
}

function fillPeriod(
  marks: MarkedDates,
  startIso: string,
  endIso: string,
  color: string,
): void {
  const days = daysBetween(startIso, endIso);
  if (days < 0) return;

  for (let i = 0; i <= days; i++) {
    const dayIso = addDaysUtc(utcMidnight(startIso), i);
    const key = toLocalDateKey(dayIso);
    marks[key] = {
      color,
      textColor: TEXT_ON_COLOR,
      startingDay: i === 0,
      endingDay: i === days,
    };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts an array of Cycle records into MarkedDates for react-native-calendars
 * (markingType="period").
 *
 * - ACTIVE cycle: indigo band from insertedAt to today (now)
 * - COMPLETED cycle: indigo band from insertedAt to removedAt
 * - CYCLIC_21_7 COMPLETED cycle: rose band for the 7-day free window after removedAt
 */
export function buildMarkedDates(cycles: Cycle[], now: string): MarkedDates {
  const marks: MarkedDates = {};

  for (const cycle of cycles) {
    const ringEnd =
      cycle.status === "ACTIVE"
        ? now
        : (cycle.removedAt ?? now);

    // Active / completed ring period
    fillPeriod(marks, cycle.insertedAt, ringEnd, COLOR_RING_IN_USE);

    // Free window for CYCLIC_21_7 completed cycles
    if (cycle.status === "COMPLETED" && cycle.regimen === "CYCLIC_21_7" && cycle.removedAt) {
      const freeStart = addDaysUtc(utcMidnight(cycle.removedAt), 1);
      const freeEnd   = addDaysUtc(utcMidnight(cycle.removedAt), CYCLIC_FREE_DAYS);
      fillPeriod(marks, freeStart, freeEnd, COLOR_RING_FREE);
    }
  }

  return marks;
}
