import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCalendar } from '../hooks/useCalendar';
import { C } from '../../../shared/theme/colors';

const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const LEGEND = [
  { color: C.emerald,  label: 'Día inserción' },
  { color: C.indigo,   label: 'Anillo puesto' },
  { color: C.coral,    label: 'Día retirada' },
  { color: C.lavender, label: 'Retirada prevista',  border: C.coral },
  { color: C.lavender, label: 'Período libre' },
  { color: C.lavender, label: 'Inserción prevista', border: C.emerald },
];

function monthLabel(date: Date) {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function CalendarScreen() {
  const { markedDates, isLoading, error } = useCalendar();
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} edges={['top']}>
        <ActivityIndicator size="large" color={C.indigo} />
      </SafeAreaView>
    );
  }

  if (error !== null) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} edges={['top']}>
        <Text style={{ color: C.coral, textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
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
    return { key, mark: markedDates[key] ?? null, isToday: key === todayKey };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>Calendario</Text>
        </View>

        {/* Month navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
          <TouchableOpacity
            onPress={() => setViewDate(v => addMonths(v, -1))}
            style={{ backgroundColor: C.lavender, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Mes anterior"
          >
            <Text style={{ fontSize: 18, color: C.indigo, fontWeight: '700' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, textTransform: 'capitalize' }}>
            {monthLabel(viewDate)}
          </Text>
          <TouchableOpacity
            onPress={() => setViewDate(v => addMonths(v, 1))}
            style={{ backgroundColor: C.lavender, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Mes siguiente"
          >
            <Text style={{ fontSize: 18, color: C.indigo, fontWeight: '700' }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
          {DAYS_SHORT.map(d => (
            <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate400 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 12 }}>
          {Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
              {week.map((d, di) => {
                if (d === null) return <View key={di} style={{ flex: 1 }} />;
                const { mark, isToday } = getDayMark(d);

                // Determine visual style
                let bg        = 'transparent';
                let textColor = C.slate700;
                let borderStyle: object = {};
                let fontWeight: '400' | '700' = '400';

                if (mark) {
                  bg        = mark.color;
                  textColor = mark.textColor;
                  fontWeight = '700';
                  // Adjust shape for period marks
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
                  bg         = C.lavender;
                  textColor  = C.indigo;
                  fontWeight = '700';
                  borderStyle = { borderRadius: 19 };
                } else {
                  borderStyle = { borderRadius: 19 };
                }

                return (
                  <View key={di} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                    <View style={[{ width: '100%', height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }, borderStyle]}>
                      <Text style={{ fontSize: 14, fontWeight, color: textColor }}>
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ margin: 20, padding: 16, backgroundColor: C.slate100, borderRadius: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 8 }}>
            {LEGEND.map(({ color, label, border }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, width: '47%' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: border ? 2 : 0, borderColor: border ?? 'transparent', flexShrink: 0 }} />
                <Text style={{ fontSize: 11, color: C.slate700, fontWeight: '500', flexShrink: 1 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
