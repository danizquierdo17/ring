import { create } from "zustand";
import type { Settings } from "../data/settingsRepo";

// Shared so every mounted screen (Inicio, Ajustes) and the insert action see
// the same settings, e.g. the ring stock after an insertion.
type SettingsStore = {
  settings: Settings | null;
  isLoading: boolean;
  /** Solo para uso interno desde useSettings / useCurrentCycle — no llamar desde UI. */
  _setSettings: (settings: Settings | null) => void;
};

export const useSettingsStore = create<SettingsStore>()((set) => ({
  settings: null,
  isLoading: true,
  _setSettings: (settings) => set({ settings, isLoading: false }),
}));
