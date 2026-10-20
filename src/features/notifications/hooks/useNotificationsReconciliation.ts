import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import { getCurrentCycle } from "../../cycle/data/cyclesRepo";
import { getSettings, type Settings } from "../../settings/data/settingsRepo";
import { daysPerRing } from "../../stock/domain/stock";
import translations from "../../../shared/i18n/translations";
import {
  BUY_REMINDER_ID_PREFIX,
  planBuyReminders,
  planNotifications,
  type BuyReminderCopy,
} from "../domain/notificationPlanner";
import { scheduleAll, cancelByIds, getScheduledIds, initNotificationChannel } from "../infra/scheduler";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function utcOffsetAt(isoUtc: string): number {
  return -new Date(isoUtc).getTimezoneOffset();
}

const MANAGED_ID_PREFIXES = ["removal-", "insertion-", BUY_REMINDER_ID_PREFIX];

function buyReminderCopy(settings: Settings): BuyReminderCopy {
  const t = translations[settings.language];
  return {
    title: t.notif_buy_title,
    body: (count, buyByAt) => {
      const date = new Date(buyByAt).toLocaleDateString(settings.language, { day: "numeric", month: "short" });
      return count === 0 ? t.notif_buy_body_none(date) : t.notif_buy_body_some(count, date);
    },
  };
}

// ---------------------------------------------------------------------------
// reconcileNotifications
// ---------------------------------------------------------------------------

export async function reconcileNotifications(db: SQLiteDatabase): Promise<void> {
  const cycleResult = getCurrentCycle(db);
  if (!cycleResult.ok) return;

  const cycle = cycleResult.value;

  const expected = cycle !== null ? planNotifications(cycle, utcOffsetAt) : [];

  const settingsResult = getSettings(db);
  if (settingsResult.ok) {
    const settings = settingsResult.value;
    expected.push(
      ...planBuyReminders(
        cycle,
        {
          count: settings.stockCount,
          threshold: settings.stockThreshold,
          buyReminderHours: settings.buyReminderHours,
          daysPerRing: daysPerRing(settings.regimen, settings.continuousDays),
          configured: settings.stockConfiguredAt !== null,
        },
        new Date().toISOString(),
        utcOffsetAt,
        buyReminderCopy(settings),
      ),
    );
  }

  const expectedIds = new Set(expected.map((n) => n.id));

  const scheduledIds = await getScheduledIds();
  const staleIds = scheduledIds
    .filter((id) => MANAGED_ID_PREFIXES.some((prefix) => id.startsWith(prefix)))
    .filter((id) => !expectedIds.has(id));

  if (staleIds.length > 0) {
    await cancelByIds(staleIds);
  }

  if (expected.length > 0) {
    await scheduleAll(expected);
  }
}

// ---------------------------------------------------------------------------
// useNotificationsReconciliation
//
// Runs once on app mount. The channel is created here (once) before any
// scheduling happens. No AppState listener — reconciliation at mount covers
// the case where Android cancelled alarms while the app was backgrounded.
// ---------------------------------------------------------------------------

export function useNotificationsReconciliation(): void {
  const db = useSQLiteContext();

  useEffect(() => {
    void initNotificationChannel().then(() => reconcileNotifications(db));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
