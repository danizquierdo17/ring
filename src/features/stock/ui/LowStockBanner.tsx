import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { useLanguageStore } from '../../../shared/i18n/languageStore';

type Props = {
  count: number;
  buyByAt: string; // ISO UTC
  onBought: () => void;
};

/** Low-stock notice shown above the primary button on Inicio. */
export function LowStockBanner({ count, buyByAt, onBought }: Props) {
  const t = useT();
  const c = useTheme();
  const locale = useLanguageStore((s) => s.locale);
  const fg = c.isDark ? c.coral : c.coralDark;
  const buyByLabel = new Date(buyByAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: c.coralBg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: fg }}>{t.stock_banner_title(count)}</Text>
        <Text style={{ fontSize: 12, color: fg, marginTop: 2, opacity: 0.85 }}>{t.stock_banner_buy_by(buyByLabel)}</Text>
      </View>
      <TouchableOpacity
        onPress={onBought}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t.stock_banner_bought}
        accessibilityHint={t.stock_open_hint}
        style={{ backgroundColor: c.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: fg }}>{t.stock_banner_bought}</Text>
      </TouchableOpacity>
    </View>
  );
}
