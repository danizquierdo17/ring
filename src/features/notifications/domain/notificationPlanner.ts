import type { Cycle } from "../../cycle/domain/cycleStateMachine";
import { CYCLIC_FREE_DAYS } from "../../cycle/domain/cycleStateMachine";
import { buyBy, needsBuyWarning, type StockSettings } from "../../stock/domain/stock";

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

const DAY_BEFORE_NOTIFY_HOUR = 12; // 12:00 local time
const SAME_DAY_NOTIFY_HOUR   = 9;  // 09:00 local time
const PRE_EVENT_HOURS        = 1;  // 1h before the planned time
const FOLLOW_UP_1H           = 1;  // 1h after, if not yet done
const FOLLOW_UP_3H           = 3;  // 3h after, if not yet done

function atLocalHourOnUtcDate(
  isoUtc: string,
  utcOffsetMinutes: number,
  hour: number,
  minute = 0,
): string {
  const d = new Date(isoUtc);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  const utcOfLocalTime =
    Date.UTC(y, m, day, hour, minute, 0) - utcOffsetMinutes * 60_000;

  return new Date(utcOfLocalTime).toISOString();
}

function addDaysUtc(isoUtc: string, days: number): string {
  const d = new Date(isoUtc);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function addHoursUtc(isoUtc: string, hours: number): string {
  return new Date(new Date(isoUtc).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function isBefore(aIso: string, bIso: string): boolean {
  return new Date(aIso).getTime() < new Date(bIso).getTime();
}

function buildRemovalNotifications(
  cycle: Cycle,
  utcOffsetMinutes: number,
): ScheduledNotification[] {
  const targetAt   = cycle.plannedRemovalAt;
  const dayBeforeAt = atLocalHourOnUtcDate(addDaysUtc(targetAt, -1), utcOffsetMinutes, DAY_BEFORE_NOTIFY_HOUR);
  const sameDayAt   = atLocalHourOnUtcDate(targetAt, utcOffsetMinutes, SAME_DAY_NOTIFY_HOUR);
  const preAt       = addHoursUtc(targetAt, -PRE_EVENT_HOURS);
  const followUp1At = addHoursUtc(targetAt, FOLLOW_UP_1H);
  const followUp3At = addHoursUtc(targetAt, FOLLOW_UP_3H);

  const notifications: ScheduledNotification[] = [
    {
      id: `removal-${cycle.id}-day-before`,
      triggerAt: dayBeforeAt,
      title: "Mañana retiras el anillo",
      body: "Recuerda que mañana debes retirar tu anillo.",
    },
    {
      id: `removal-${cycle.id}-due`,
      triggerAt: targetAt,
      title: "Es momento de retirar el anillo",
      body: "Marca la retirada en la app cuando lo hayas hecho.",
    },
    {
      id: `removal-${cycle.id}-follow-up-1h`,
      triggerAt: followUp1At,
      title: "¿Has retirado ya el anillo?",
      body: "Si ya lo has retirado, regístralo en la app. Si no, hazlo cuanto antes.",
    },
    {
      id: `removal-${cycle.id}-follow-up-3h`,
      triggerAt: followUp3At,
      title: "Recuerda retirar el anillo",
      body: "Han pasado 3 horas desde el momento previsto. Retíralo cuando puedas.",
    },
  ];

  if (isBefore(sameDayAt, targetAt)) {
    notifications.push({
      id: `removal-${cycle.id}-same-day-morning`,
      triggerAt: sameDayAt,
      title: "Hoy retiras el anillo",
      body: "Hoy es el día previsto para retirar tu anillo.",
    });
  }
  if (isBefore(preAt, targetAt)) {
    notifications.push({
      id: `removal-${cycle.id}-pre`,
      triggerAt: preAt,
      title: "Retira el anillo en 1 hora",
      body: "En aproximadamente una hora deberías retirar el anillo.",
    });
  }

  return notifications;
}

function buildInsertionNotifications(
  cycle: Cycle,
  utcOffsetMinutes: number,
): ScheduledNotification[] {
  const targetAt    = addDaysUtc(cycle.removedAt!, CYCLIC_FREE_DAYS);
  const dayBeforeAt = atLocalHourOnUtcDate(addDaysUtc(targetAt, -1), utcOffsetMinutes, DAY_BEFORE_NOTIFY_HOUR);
  const sameDayAt   = atLocalHourOnUtcDate(targetAt, utcOffsetMinutes, SAME_DAY_NOTIFY_HOUR);
  const preAt       = addHoursUtc(targetAt, -PRE_EVENT_HOURS);
  const followUp1At = addHoursUtc(targetAt, FOLLOW_UP_1H);
  const followUp3At = addHoursUtc(targetAt, FOLLOW_UP_3H);

  const notifications: ScheduledNotification[] = [
    {
      id: `insertion-${cycle.id}-day-before`,
      triggerAt: dayBeforeAt,
      title: "Mañana insertas el anillo",
      body: "Recuerda que mañana debes insertar el nuevo anillo.",
    },
    {
      id: `insertion-${cycle.id}-due`,
      triggerAt: targetAt,
      title: "Es momento de insertar el anillo",
      body: "Inserta el nuevo anillo y márcalo en la app cuando lo hayas hecho.",
    },
    {
      id: `insertion-${cycle.id}-follow-up-1h`,
      triggerAt: followUp1At,
      title: "¿Has insertado ya el anillo?",
      body: "Si ya lo has insertado, regístralo en la app. Si no, hazlo cuanto antes.",
    },
    {
      id: `insertion-${cycle.id}-follow-up-3h`,
      triggerAt: followUp3At,
      title: "Recuerda insertar el anillo",
      body: "Han pasado 3 horas desde el momento previsto. Insértalo cuando puedas.",
    },
  ];

  if (isBefore(sameDayAt, targetAt)) {
    notifications.push({
      id: `insertion-${cycle.id}-same-day-morning`,
      triggerAt: sameDayAt,
      title: "Hoy insertas el anillo",
      body: "Hoy debes insertar el nuevo anillo según tu planificación.",
    });
  }
  if (isBefore(preAt, targetAt)) {
    notifications.push({
      id: `insertion-${cycle.id}-pre`,
      triggerAt: preAt,
      title: "Inserta el anillo en 1 hora",
      body: "En aproximadamente una hora deberías insertar el nuevo anillo.",
    });
  }

  return notifications;
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
 */
export function planNotifications(
  cycle: Cycle,
  utcOffsetMinutes: number,
): ScheduledNotification[] {
  if (cycle.status === "ACTIVE") {
    return buildRemovalNotifications(cycle, utcOffsetMinutes);
  }

  if (
    cycle.status === "COMPLETED" &&
    cycle.regimen === "CYCLIC_21_7" &&
    cycle.removedAt !== null
  ) {
    return buildInsertionNotifications(cycle, utcOffsetMinutes);
  }

  return [];
}

// ---------------------------------------------------------------------------
// Buy reminders (ring stock)
// ---------------------------------------------------------------------------

export const BUY_REMINDER_ID_PREFIX = "buy-rings-";
const BUY_REMINDER_HOUR = 10; // 10:00 local time on the buy-by day

export type BuyReminderStock = StockSettings & {
  readonly daysPerRing: number;
  readonly configured: boolean; // the user has saved her stock at least once
};

/** Localised texts, injected so the planner stays pure. */
export type BuyReminderCopy = {
  readonly title: string;
  readonly body: (count: number, buyByAt: string) => string;
};

/** Device UTC offset in minutes in force at a given instant (differs across DST changes). */
export type UtcOffsetAt = (isoUtc: string) => number;

type LocalDate = { readonly y: number; readonly m: number; readonly d: number };

function localDateOf(isoUtc: string, offsetAt: UtcOffsetAt): LocalDate {
  const local = new Date(new Date(isoUtc).getTime() + offsetAt(isoUtc) * 60_000);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
}

/** `hour`:00 local on the calendar day `daysOffset` days from `date`, using the offset in force then. */
function atLocalHour(date: LocalDate, daysOffset: number, hour: number, offsetAt: UtcOffsetAt): string {
  const wallClock = Date.UTC(date.y, date.m, date.d + daysOffset, hour);
  const approx = wallClock - offsetAt(new Date(wallClock).toISOString()) * 60_000;
  return new Date(wallClock - offsetAt(new Date(approx).toISOString()) * 60_000).toISOString();
}

/**
 * Pure function. When the stock has been configured and is low, returns one
 * reminder per chosen lead time before the buy-by day at 10:00 local,
 * skipping those already past. "N h antes" means N/24 calendar days before at
 * 10:00 local, so a DST change in between never moves it to 9:00 or 11:00.
 * IDs are fixed per lead time so the reconciler replaces or cancels them.
 */
export function planBuyReminders(
  cycle: Cycle | null,
  stock: BuyReminderStock,
  now: string,
  offsetAt: UtcOffsetAt,
  copy: BuyReminderCopy,
): ScheduledNotification[] {
  if (!needsBuyWarning(stock.count, stock.threshold, stock.configured)) return [];

  const buyByDate = localDateOf(buyBy(cycle, stock.count, now, stock.daysPerRing), offsetAt);
  const body = copy.body(stock.count, atLocalHour(buyByDate, 0, BUY_REMINDER_HOUR, offsetAt));

  return stock.buyReminderHours
    .map((hours) => ({
      id: `${BUY_REMINDER_ID_PREFIX}${hours}h`,
      triggerAt: atLocalHour(buyByDate, -hours / 24, BUY_REMINDER_HOUR, offsetAt),
      title: copy.title,
      body,
    }))
    .filter((n) => isBefore(now, n.triggerAt));
}

// Made with Bob
