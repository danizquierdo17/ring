/**
 * @jest-environment node
 */

// ---------------------------------------------------------------------------
// Mocks — deben declararse antes de cualquier import que los use
// ---------------------------------------------------------------------------

jest.mock("expo-sqlite", () => ({ useSQLiteContext: jest.fn() }));
jest.mock("../infra/scheduler", () => ({
  scheduleAll: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
  cancelByIds: jest.fn().mockResolvedValue(undefined),
  getScheduledIds: jest.fn().mockResolvedValue([]),
  initNotificationChannel: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../cycle/data/cyclesRepo", () => ({ getCurrentCycle: jest.fn() }));
jest.mock("../../settings/data/settingsRepo", () => ({ getSettings: jest.fn() }));

import type { SQLiteDatabase } from "expo-sqlite";
import { reconcileNotifications } from "./useNotificationsReconciliation";
import { scheduleAll, cancelByIds, getScheduledIds } from "../infra/scheduler";
import { getCurrentCycle } from "../../cycle/data/cyclesRepo";
import { getSettings, type Settings } from "../../settings/data/settingsRepo";
import type { Cycle } from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2026-11-01T12:00:00.000Z");
const db = {} as SQLiteDatabase;

// Anillo puesto con retirada prevista dentro de 10 días: la fecha límite de
// compra queda en el futuro sea cual sea la zona horaria de la máquina.
const inUse: Cycle = {
  id: "c1",
  regimen: "CYCLIC_21_7",
  insertedAt: "2026-10-22T12:00:00.000Z",
  removedAt: null,
  plannedRemovalAt: "2026-11-11T12:00:00.000Z",
  status: "ACTIVE",
  notes: null,
  createdAt: "2026-10-22T12:00:00.000Z",
  updatedAt: "2026-10-22T12:00:00.000Z",
};

function settings(overrides: Partial<Settings> = {}): Settings {
  return {
    regimen: "CYCLIC_21_7",
    continuousDays: 28,
    language: "es-ES",
    theme: "light",
    stockCount: 1,
    stockThreshold: 1,
    buyReminderHours: [48, 24],
    stockConfiguredAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

function scheduledIds(): string[] {
  const calls = (scheduleAll as jest.Mock).mock.calls as [{ id: string }[]][];
  return calls.flatMap(([notifs]) => notifs.map((n) => n.id));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
  (getCurrentCycle as jest.Mock).mockReturnValue({ ok: true, value: inUse });
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// reconcileNotifications — avisos de compra
// ---------------------------------------------------------------------------

describe("reconcileNotifications — avisos de compra", () => {
  it("programa los buy-rings-* junto a los de retirada si la reserva está baja", async () => {
    (getSettings as jest.Mock).mockReturnValue({ ok: true, value: settings() });

    await reconcileNotifications(db);

    const ids = scheduledIds();
    expect(ids).toEqual(expect.arrayContaining(["buy-rings-48h", "buy-rings-24h"]));
    expect(ids.some((id) => id.startsWith("removal-c1-"))).toBe(true);
  });

  it("cancela todos los buy-rings-* cuando la reserva deja de estar baja", async () => {
    (getSettings as jest.Mock).mockReturnValue({ ok: true, value: settings({ stockCount: 4 }) });
    (getScheduledIds as jest.Mock).mockResolvedValue([
      "buy-rings-72h",
      "buy-rings-24h",
      "removal-c1-due",
      "otra-app-id",
    ]);

    await reconcileNotifications(db);

    expect(cancelByIds).toHaveBeenCalledWith(["buy-rings-72h", "buy-rings-24h"]);
    expect(scheduledIds().some((id) => id.startsWith("buy-rings-"))).toBe(false);
  });

  it("no programa avisos de compra si la reserva nunca se ha guardado", async () => {
    (getSettings as jest.Mock).mockReturnValue({
      ok: true,
      value: settings({ stockCount: 0, stockConfiguredAt: null }),
    });

    await reconcileNotifications(db);

    expect(scheduledIds().some((id) => id.startsWith("buy-rings-"))).toBe(false);
  });

  it("cancela solo la antelación que se ha desmarcado", async () => {
    (getSettings as jest.Mock).mockReturnValue({ ok: true, value: settings({ buyReminderHours: [24] }) });
    (getScheduledIds as jest.Mock).mockResolvedValue(["buy-rings-48h", "buy-rings-24h"]);

    await reconcileNotifications(db);

    expect(cancelByIds).toHaveBeenCalledWith(["buy-rings-48h"]);
    expect(scheduledIds()).toContain("buy-rings-24h");
  });
});
