import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getAllCycles } from "../../cycle/data/cyclesRepo";
import { buildMarkedDates, buildEditableEvents, type MarkedDates, type EditableEvent } from "../domain/buildMarkedDates";
import { useCycleStore } from "../../cycle/hooks/useCycleStore";

type CalendarState = {
  markedDates: MarkedDates;
  editableEvents: Record<string, EditableEvent>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useCalendar(): CalendarState {
  const db = useSQLiteContext();
  const currentCycle = useCycleStore((s) => s.currentCycle);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<CalendarState, 'refresh'>>({
    markedDates: {},
    editableEvents: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const now = new Date().toISOString();
    const result = getAllCycles(db);

    if (result.ok) {
      setState({
        markedDates: buildMarkedDates(result.value, now),
        editableEvents: buildEditableEvents(result.value),
        isLoading: false,
        error: null,
      });
    } else {
      setState({
        markedDates: {},
        editableEvents: {},
        isLoading: false,
        error: result.error.message,
      });
    }
  }, [db, currentCycle, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, refresh };
}
