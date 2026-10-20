import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { useLanguageStore } from '../../../shared/i18n/languageStore';
import {
  BUY_REMINDER_HOURS,
  STOCK_THRESHOLDS,
  type BuyReminderHours,
  type StockThreshold,
} from '../domain/stock';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BellIcon = Bell as React.ComponentType<any>;

type Props = {
  threshold: StockThreshold;
  hours: readonly BuyReminderHours[];
  reminderTimes: readonly string[]; // ISO UTC; shown only while the stock is low
  onThresholdChange: (threshold: StockThreshold) => void;
  onHoursChange: (hours: BuyReminderHours[]) => void;
};

/** "Avisarme cuando queden" (0/1/2) and "Recordarme comprar" (24/48/72 h, multi-select). */
export function StockReminderOptions({ threshold, hours, reminderTimes, onThresholdChange, onHoursChange }: Props) {
  const t = useT();
  const c = useTheme();
  const locale = useLanguageStore((s) => s.locale);
  const boxBg = c.isDark ? c.surfaceRaised : c.slate100;

  function toggleHours(h: BuyReminderHours) {
    const selected = hours.includes(h);
    if (selected && hours.length === 1) return; // at least one stays selected
    onHoursChange(selected ? hours.filter((x) => x !== h) : [...hours, h].sort((a, b) => b - a));
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ backgroundColor: boxBg, borderRadius: 16, padding: 14, gap: 10 }}>
        <Text style={{ fontSize: 14, color: c.slate700 }}>{t.stock_sheet_threshold}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
          {STOCK_THRESHOLDS.map((value) => {
            const selected = value === threshold;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => onThresholdChange(value)}
                accessibilityRole="radio"
                accessibilityLabel={t.stock_sheet_threshold_a11y(value)}
                accessibilityState={{ checked: selected }}
                style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.indigo : c.surface }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: selected ? '#fff' : c.text }}>{value}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ backgroundColor: boxBg, borderRadius: 16, padding: 14, gap: 10 }}>
        <Text style={{ fontSize: 14, color: c.slate700 }}>{t.stock_sheet_reminders}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {BUY_REMINDER_HOURS.map((h) => {
            const checked = hours.includes(h);
            const label = t.stock_sheet_hours_option(h);
            return (
              <TouchableOpacity
                key={h}
                onPress={() => toggleHours(h)}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked }}
                style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? c.indigo : c.surface }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: checked ? '#fff' : c.text }}>
                  {checked ? `✓ ${label}` : label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {reminderTimes.map((iso) => {
          const d = new Date(iso);
          const dateStr = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
          const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
          return (
            <View key={iso} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BellIcon color={c.indigo} size={14} />
              <Text style={{ fontSize: 13, color: c.slate700 }}>{dateStr} · {timeStr}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
