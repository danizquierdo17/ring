import type { Cycle } from "../../cycle/domain/cycleStateMachine";
import { CYCLIC_FREE_DAYS } from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScheduledNotification = {
  readonly id: string;
  readonly triggerAt: string; // ISO 8601 UTC
  readonly title: string;
  readonly body: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const NOTIFY_HOUR = 9; // 09:00 local time

/**
 * Returns the ISO UTC string for 09:00 local time on the **UTC calendar date**
 * of `isoUtc`, given a UTC offset in minutes (positive = east, e.g. UTC+1 = 60).
 *
 * We intentionally use the UTC date parts (not the local date) so that a
 * `plannedRemovalAt` of "2025-01-22T00:00:00Z" always fires on Jan 22 at
 * 09:00 local — even for users in UTC-5 where that midnight UTC falls on
 * Jan 21 local time.
 */
function at09Local(isoUtc: string, utcOffsetMinutes: number): string {
  const d = new Date(isoUtc);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  // 09:00 on the UTC date, shifted to local time
  const utcOf9amLocal = Date.UTC(y, m, day, NOTIFY_HOUR, 0, 0) - utcOffsetMinutes * 60_000;
  return new Date(utcOf9amLocal).toISOString();
}

function addDaysUtc(isoUtc: string, days: number): string {
  const d = new Date(isoUtc);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure function — no expo-*, no React, no side effects.
 *
 * Given a Cycle and the device's UTC offset in minutes, returns the list of
 * ScheduledNotifications that should be active for that cycle.
 *
 * IDs are deterministic so the reconciler can diff without querying the OS.
 *
 * @param cycle           The cycle to plan notifications for.
 * @param utcOffsetMinutes Device UTC offset (e.g. 60 for UTC+1, -300 for UTC-5).
 */
export function planNotifications(
  cycle: Cycle,
  utcOffsetMinutes: number,
): ScheduledNotification[] {
  const notifications: ScheduledNotification[] = [];

  if (cycle.status === "ACTIVE") {
    // T-24h: day before plannedRemovalAt at 09:00 local
    const dayBefore = addDaysUtc(cycle.plannedRemovalAt, -1);
    notifications.push({
      id: `removal-${cycle.id}-24h`,
      triggerAt: at09Local(dayBefore, utcOffsetMinutes),
      title: "Mañana retiras el anillo",
      body: "Recuerda retirar tu anillo mañana según lo planificado.",
    });

    // T-0h: day of plannedRemovalAt at 09:00 local
    notifications.push({
      id: `removal-${cycle.id}-0h`,
      triggerAt: at09Local(cycle.plannedRemovalAt, utcOffsetMinutes),
      title: "Hoy retiras el anillo",
      body: "Hoy es el día de retirar tu anillo anticonceptivo.",
    });
  }

  if (
    cycle.status === "COMPLETED" &&
    cycle.regimen === "CYCLIC_21_7" &&
    cycle.removedAt !== null
  ) {
    // Planned insertion day = removedAt + CYCLIC_FREE_DAYS
    const plannedInsertionAt = addDaysUtc(cycle.removedAt, CYCLIC_FREE_DAYS);
    const dayBeforeInsertion = addDaysUtc(plannedInsertionAt, -1);

    // T-24h: day before planned insertion at 09:00 local
    notifications.push({
      id: `insertion-${cycle.id}-24h`,
      triggerAt: at09Local(dayBeforeInsertion, utcOffsetMinutes),
      title: "Mañana insertas el anillo",
      body: "Tu descanso termina mañana. Prepárate para insertar el nuevo anillo.",
    });

    // T-0h: day of planned insertion at 09:00 local
    notifications.push({
      id: `insertion-${cycle.id}-0h`,
      triggerAt: at09Local(plannedInsertionAt, utcOffsetMinutes),
      title: "Hoy insertas el nuevo anillo",
      body: "Tu período de descanso ha terminado. Es el momento de insertar tu nuevo anillo.",
    });
  }

  return notifications;
}
