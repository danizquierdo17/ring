import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Circle } from 'lucide-react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import type { StockSettings } from '../domain/stock';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CircleIcon = Circle as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChevronRightIcon = ChevronRight as React.ComponentType<any>;

type Props = {
  stock: StockSettings;
  onPress: () => void;
};

/** Ajustes › Reserva de anillos: "N anillos en casa · Aviso al quedar X · 24/48h antes". */
export function StockSettingsRow({ stock, onPress }: Props) {
  const t = useT();
  const c = useTheme();
  const hoursLabel = [...stock.buyReminderHours].sort((a, b) => a - b).join('/');
  const title = t.stock_row_title(stock.count);
  const subtitle = t.stock_row_subtitle(stock.threshold, hoursLabel);

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
        {t.settings_section_stock}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityHint={t.stock_open_hint}
        style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
      >
        <CircleIcon color={c.indigo} size={22} strokeWidth={3} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{title}</Text>
          <Text style={{ fontSize: 12, color: c.slate400, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <ChevronRightIcon color={c.slate400} size={18} />
      </TouchableOpacity>
    </View>
  );
}
