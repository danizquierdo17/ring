import { useState, useCallback } from 'react';
import { useLunaRepo, type DayData, type LunaState } from '../data/lunaRepo';

export function useLunaData() {
  const repo = useLunaRepo();
  const [state, setState] = useState<LunaState>(() => repo.loadState());

  const setCycleStartDate = useCallback((isoDate: string) => {
    repo.saveCycleStartDate(isoDate);
    setState(prev => ({ ...prev, cycleStartDate: isoDate }));
  }, [repo]);

  const saveDayData = useCallback((dayNumber: number, data: DayData) => {
    repo.saveDayData(dayNumber, data);
    setState(prev => ({
      ...prev,
      days: { ...prev.days, [dayNumber]: data },
    }));
  }, [repo]);

  return { state, setCycleStartDate, saveDayData };
}
