import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Circle } from 'lucide-react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CircleIcon = Circle as React.ComponentType<any>;

type Props = {
  count: number;
  low: boolean;
  onPress: () => void;
};

/** Header pill on Inicio: "◯ N en casa", coral when the stock is low. */
export function StockPill({ count, low, onPress }: Props) {
  const t = useT();
  const c = useTheme();
  const bg = low ? c.coralBg : c.lavender;
  const fg = low ? (c.isDark ? c.coral : c.coralDark) : c.indigo;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t.stock_row_title(count)}
      accessibilityHint={t.stock_open_hint}
      style={{ height: 38, borderRadius: 19, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg }}
    >
      <CircleIcon color={fg} size={15} strokeWidth={3} />
      <Text style={{ fontSize: 14, fontWeight: '800', color: fg }}>{t.stock_pill_label(count)}</Text>
    </TouchableOpacity>
  );
}
