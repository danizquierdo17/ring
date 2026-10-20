import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';

type Props = {
  count: number;
  low: boolean;
  onChange: (count: number) => void;
};

/** "−  N  +" stepper with "+1 caja" / "+3 (pack 3)" quick-add chips. */
export function StockStepper({ count, low, onChange }: Props) {
  const t = useT();
  const c = useTheme();
  const numberColor = low ? (c.isDark ? c.coral : c.coralDark) : c.indigo;
  const stepBg = c.isDark ? c.surfaceRaised : c.slate100;

  const step = (delta: number) => onChange(Math.max(0, count + delta));

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
        <TouchableOpacity
          onPress={() => step(-1)}
          disabled={count === 0}
          accessibilityRole="button"
          accessibilityLabel={t.stock_sheet_decrease}
          accessibilityState={{ disabled: count === 0 }}
          style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: stepBg, alignItems: 'center', justifyContent: 'center', opacity: count === 0 ? 0.4 : 1 }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: c.text, lineHeight: 28 }}>−</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', minWidth: 72 }} accessible accessibilityLiveRegion="polite">
          <Text style={{ fontSize: 56, fontWeight: '900', color: numberColor, lineHeight: 62 }}>{count}</Text>
          <Text style={{ fontSize: 13, color: c.slate400 }}>{t.stock_sheet_unit(count)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => step(+1)}
          accessibilityRole="button"
          accessibilityLabel={t.stock_sheet_increase}
          style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: stepBg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: c.text, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { label: t.stock_sheet_add_box, delta: 1 },
          { label: t.stock_sheet_add_pack, delta: 3 },
        ].map(({ label, delta }) => (
          <TouchableOpacity
            key={label}
            onPress={() => step(delta)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
