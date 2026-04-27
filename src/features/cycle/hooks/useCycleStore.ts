import { create } from "zustand";
import { deriveUiState } from "../domain/cycleStateMachine";
import type { Cycle, UiState } from "../domain/cycleStateMachine";

type CycleStore = {
  isLoading: boolean;
  currentCycle: Cycle | null;
  uiState: UiState;
  /** Solo para uso interno desde useCurrentCycle — no llamar desde UI. */
  _setLoading: (loading: boolean) => void;
  /** Solo para uso interno desde useCurrentCycle — recalcula uiState. */
  _setCycle: (cycle: Cycle | null, now: string) => void;
};

export const useCycleStore = create<CycleStore>()((set) => ({
  isLoading: true,
  currentCycle: null,
  uiState: "NO_RING",

  _setLoading: (isLoading) => set({ isLoading }),

  _setCycle: (cycle, now) =>
    set({
      currentCycle: cycle,
      uiState: deriveUiState(cycle, now),
    }),
}));
