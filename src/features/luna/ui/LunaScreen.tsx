import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { useLunaData } from '../hooks/useLunaData';
import { addDays, daysBetween } from '../domain/moonPhase';
import type { DayData } from '../data/lunaRepo';
import { Mandala } from './Mandala';
import { DayDetailModal } from './DayDetailModal';
import { PeriodStartModal } from './PeriodStartModal';

const DEFAULT_PERIOD_DAYS = [1, 2, 3, 4, 5];

export function LunaScreen() {
  const { state, setCycleStartDate, saveDayData } = useLunaData();
  const t = useT();
  const c = useTheme();

  const [selectedDay, setSelectedDay]       = useState<number | null>(null);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const cycleStartDate: Date | null = useMemo(() => {
    if (!state.cycleStartDate) return null;
    return new Date(state.cycleStartDate);
  }, [state.cycleStartDate]);

  const todayDay: number | null = useMemo(() => {
    if (!cycleStartDate) return null;
    const d = Math.floor(daysBetween(cycleStartDate, new Date())) + 1;
    return Math.max(1, Math.min(28, d));
  }, [cycleStartDate]);

  const cycleLabel = cycleStartDate
    ? t.luna_cycle_from(cycleStartDate.toLocaleDateString([], { day: 'numeric', month: 'long' }))
    : t.luna_no_cycle;

  const selectedDayDate: Date | null = useMemo(() => {
    if (selectedDay === null) return null;
    if (cycleStartDate) return addDays(cycleStartDate, selectedDay - 1);
    return addDays(new Date(), selectedDay - 15);
  }, [selectedDay, cycleStartDate]);

  function handlePeriodConfirm(date: Date) {
    setCycleStartDate(date.toISOString());
    setShowPeriodPicker(false);
  }

  function handleSaveDay(data: DayData) {
    if (selectedDay === null) return;
    saveDayData(selectedDay, data);
    setSelectedDay(null);
  }

  const subtleText = c.isDark ? '#7A6E78' : '#a09098';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgLuna }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <View>
          <Text style={{ fontSize: 19, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{t.luna_title}</Text>
          <Text style={{ fontSize: 11, color: subtleText, marginTop: 1 }}>{cycleLabel}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowPeriodPicker(true)}
          style={{ backgroundColor: '#C94040', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, shadowColor: '#C94040', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          accessibilityRole="button"
          accessibilityLabel={t.luna_period_btn_a11y}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>{t.luna_period_btn}</Text>
        </TouchableOpacity>
      </View>

      {/* Today indicator */}
      {todayDay !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 20, marginTop: 6, marginBottom: 2 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.indigo }} />
          <Text style={{ fontSize: 10, color: c.indigo, fontWeight: '700' }}>{t.luna_today_label(todayDay!)}</Text>
        </View>
      )}

      {/* Mandala */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Mandala
          days={state.days}
          cycleStartDate={cycleStartDate}
          todayDay={todayDay}
          periodDays={DEFAULT_PERIOD_DAYS}
          onDayTap={setSelectedDay}
        />
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap', paddingHorizontal: 20, paddingVertical: 10 }}>
        {[
          { color: '#C94040',        label: t.luna_legend_period },
          { color: `${c.indigo}55`,  label: t.luna_legend_today, border: c.indigo },
          { color: c.isDark ? '#2A261E' : '#f0ece4', label: t.luna_legend_tap, border: c.isDark ? '#4A4438' : '#dedad0' },
        ].map(({ color, label, border }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color, borderColor: border, borderWidth: border ? 1.5 : 0 }} />
            <Text style={{ fontSize: 9, color: subtleText, fontWeight: '500' }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day detail modal */}
      <DayDetailModal
        visible={selectedDay !== null}
        day={selectedDay ?? 1}
        date={selectedDayDate}
        data={selectedDay !== null ? (state.days[selectedDay] ?? {}) : {}}
        onSave={handleSaveDay}
        onClose={() => setSelectedDay(null)}
      />

      {/* Period start modal */}
      <PeriodStartModal
        visible={showPeriodPicker}
        onConfirm={handlePeriodConfirm}
        onClose={() => setShowPeriodPicker(false)}
      />
    </SafeAreaView>
  );
}
