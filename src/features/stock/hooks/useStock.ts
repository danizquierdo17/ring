import { useCallback, useMemo } from "react";

import { useSettings } from "../../settings/hooks/useSettings";
import { useCycleStore } from "../../cycle/hooks/useCycleStore";
import { planBuyReminders } from "../../notifications/domain/notificationPlanner";
import {
  buyBy,
  daysPerRing,
  needsBuyWarning,
  stockRunOut,
  type StockSettings,
} from "../domain/stock";

export type StockProjection = {
  readonly low: boolean;          // low-stock warnings apply (configured and at/below threshold)
  readonly buyByAt: string;       // ISO UTC
  readonly runOutAt: string;      // ISO UTC
  readonly reminderTimes: readonly string[]; // ISO UTC, buy reminders that would be scheduled
};

// Only the trigger times are shown in the preview, so the texts are irrelevant here.
const PREVIEW_COPY = { title: "", body: () => "" };

/**
 * Ring stock as stored in Settings, its projection (buy-by date, run-out date,
 * reminder times), and `project` to preview a draft of it. Shared by Inicio
 * and Ajustes.
 */
export function useStock() {
  const { settings, saveStock } = useSettings();
  const cycle = useCycleStore((s) => s.currentCycle);

  const stock = useMemo<StockSettings | null>(
    () =>
      settings === null
        ? null
        : {
            count: settings.stockCount,
            threshold: settings.stockThreshold,
            buyReminderHours: settings.buyReminderHours,
          },
    [settings],
  );

  /** `configured` defaults to true: a draft is previewed as it will be once saved. */
  const project = useCallback(
    (draft: StockSettings, configured = true): StockProjection | null => {
      if (settings === null) return null;
      const now = new Date().toISOString();
      const ringDays = daysPerRing(settings.regimen, settings.continuousDays);
      const reminders = planBuyReminders(
        cycle,
        { ...draft, daysPerRing: ringDays, configured },
        now,
        (iso) => -new Date(iso).getTimezoneOffset(),
        PREVIEW_COPY,
      );
      return {
        low: needsBuyWarning(draft.count, draft.threshold, configured),
        buyByAt: buyBy(cycle, draft.count, now, ringDays),
        runOutAt: stockRunOut(cycle, draft.count, now, ringDays),
        reminderTimes: reminders.map((n) => n.triggerAt),
      };
    },
    [settings, cycle],
  );

  const projection =
    stock !== null && settings !== null ? project(stock, settings.stockConfiguredAt !== null) : null;

  return { stock, projection, project, saveStock };
}
