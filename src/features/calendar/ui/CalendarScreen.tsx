import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCalendar } from '../hooks/useCalendar';
import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { EditEventModal } from './EditEventModal';
import type { EditableEvent } from '../domain/buildMarkedDates';
import { useCurrentCycle } from '../../cycle/hooks/useCurrentCycle';

const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function monthLabel(date: Date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function CalendarScreen() {
  const { markedDates, editableEvents, isLoading, error, refresh } = useCalendar();
  const { refreshCycle } = useCurrentCycle();
  const c = useTheme();
  const t = useT();
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);

  const LEGEND = [
    { color: c.emerald,  label: t.calendar_legend_insert },
    { color: c.indigo,   label: t.calendar_legend_ring },
    { color: c.coral,    label: t.calendar_legend_remove },
    { color: c.lavender, label: t.calendar_legend_planned_remove,  border: c.coral },
    { color: c.lavender, label: t.calendar_legend_free },
    { color: c.lavender, label: t.calendar_legend_planned_insert, border: c.emerald },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }} edges={['top']}>
        <ActivityIndicator size="large" color={c.indigo} />
      </SafeAreaView>
    );
  }

  if (error !== null) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }} edges={['top']}>
        <Text style={{ color: c.coral, textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build grid (Monday-first)
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset    = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayKey = [
    today.getUTCFullYear(),
    String(today.getUTCMonth() + 1).padStart(2, '0'),
    String(today.getUTCDate()).padStart(2, '0'),
  ].join('-');

  function getDayMark(d: number) {
    const key = [
      String(year),
      String(month + 1).padStart(2, '0'),
      String(d).padStart(2, '0'),
    ].join('-');
    return { key, mark: markedDates[key] ?? null, isToday: key === todayKey, editableEvent: editableEvents[key] ?? null };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{t.calendar_title}</Text>
        </View>

        {/* Month navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
          <TouchableOpacity
            onPress={() => setViewDate(v => addMonths(v, -1))}
            style={{ backgroundColor: c.lavender, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Mes anterior"
          >
            <Text style={{ fontSize: 18, color: c.indigo, fontWeight: '700' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, textTransform: 'capitalize' }}>
            {monthLabel(viewDate)}
          </Text>
          <TouchableOpacity
            onPress={() => setViewDate(v => addMonths(v, 1))}
            style={{ backgroundColor: c.lavender, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Mes siguiente"
          >
            <Text style={{ fontSize: 18, color: c.indigo, fontWeight: '700' }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
          {DAYS_SHORT.map(d => (
            <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 12 }}>
          {Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
              {week.map((d, di) => {
                if (d === null) return <View key={di} style={{ flex: 1 }} />;
                const { mark, isToday, editableEvent } = getDayMark(d);

                let bg        = 'transparent';
                let textColor = c.slate700;
                let borderStyle: object = {};
                let fontWeight: '400' | '700' = '400';

                if (mark) {
                  bg        = mark.color;
                  textColor = mark.textColor;
                  fontWeight = '700';
                  if (mark.startingDay && mark.endingDay) {
                    borderStyle = { borderRadius: 19, ...(mark.borderColor ? { borderWidth: 2, borderColor: mark.borderColor } : {}) };
                  } else if (mark.startingDay) {
                    borderStyle = { borderTopLeftRadius: 19, borderBottomLeftRadius: 19, borderTopRightRadius: 4, borderBottomRightRadius: 4 };
                  } else if (mark.endingDay) {
                    borderStyle = { borderTopRightRadius: 19, borderBottomRightRadius: 19, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 };
                  } else {
                    borderStyle = { borderRadius: 0 };
                  }
                } else if (isToday) {
                  bg         = c.lavender;
                  textColor  = c.indigo;
                  fontWeight = '700';
                  borderStyle = { borderRadius: 19 };
                } else {
                  borderStyle = { borderRadius: 19 };
                }

                const isEditable = editableEvent !== null;
                const CellWrapper = isEditable ? TouchableOpacity : View;
                const cellProps = isEditable
                  ? {
                      onPress: () => setEditingEvent(editableEvent),
                      accessibilityRole: 'button' as const,
                      accessibilityLabel: `Editar día ${d}`,
                      activeOpacity: 0.75,
                    }
                  : {};

                return (
                  <View key={di} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                    <CellWrapper
                      {...cellProps}
                      style={[{ width: '100%', height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }, borderStyle]}
                    >
                      <Text style={{ fontSize: 14, fontWeight, color: textColor }}>
                        {d}
                      </Text>
                      {isEditable && (
                        <View style={{
                          position: 'absolute', bottom: 3,
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: textColor, opacity: 0.55,
                        }} />
                      )}
                    </CellWrapper>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ margin: 20, padding: 16, backgroundColor: c.slate100, borderRadius: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 8 }}>
            {LEGEND.map(({ color, label, border }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, width: '47%' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: border ? 2 : 0, borderColor: border ?? 'transparent', flexShrink: 0 }} />
                <Text style={{ fontSize: 11, color: c.slate700, fontWeight: '500', flexShrink: 1 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {editingEvent !== null && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => {
            setEditingEvent(null);
            refreshCycle();
            refresh();
          }}
        />
      )}
    </SafeAreaView>
  );
}
