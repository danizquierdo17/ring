import { useState, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getAllCycles } from "../../cycle/data/cyclesRepo";
import { buildMarkedDates, type MarkedDates } from "../domain/buildMarkedDates";
import { useCycleStore } from "../../cycle/hooks/useCycleStore";

type CalendarState = {
  markedDates: MarkedDates;
  isLoading: boolean;
  error: string | null;
};

export function useCalendar(): CalendarState {
  const db = useSQLiteContext();
  const currentCycle = useCycleStore((s) => s.currentCycle);
  const [state, setState] = useState<CalendarState>({
    markedDates: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const now = new Date().toISOString();
    const result = getAllCycles(db);

    if (result.ok) {
      setState({
        markedDates: buildMarkedDates(result.value, now),
        isLoading: false,
        error: null,
      });
    } else {
      setState({
        markedDates: {},
        isLoading: false,
        error: result.error.message,
      });
    }
  }, [db, currentCycle]);

  return state;
}
