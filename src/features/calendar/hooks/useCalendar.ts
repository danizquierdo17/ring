import { useState, useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getAllCycles } from "../../cycle/data/cyclesRepo";
import { buildMarkedDates, buildEditableEvents, type MarkedDates, type EditableEvent, type MarkPalette } from "../domain/buildMarkedDates";
import { useCycleStore } from "../../cycle/hooks/useCycleStore";
import { useTheme } from "../../../shared/theme/useTheme";

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
  const c = useTheme();
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

    const palette: MarkPalette = {
      insert: c.emerald,
      ring: c.indigo,
      remove: c.coral,
      lavender: c.lavender,
      textOnLavender: c.isDark ? c.text : c.indigo,
      textOnAccent: '#ffffff',
    };

    if (result.ok) {
      setState({
        markedDates: buildMarkedDates(result.value, now, palette),
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
  }, [db, currentCycle, version, c.isDark]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, refresh };
}
