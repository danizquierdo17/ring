import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { useLanguageStore } from '../../../shared/i18n/languageStore';
import { GradientButton } from '../../../shared/ui/GradientButton';
import type { AppError } from '../../../shared/errors';
import type { StockSettings } from '../domain/stock';
import type { StockProjection } from '../hooks/useStock';
import { StockStepper } from './StockStepper';
import { StockReminderOptions } from './StockReminderOptions';

type Props = {
  visible: boolean;
  initial: StockSettings;
  project: (draft: StockSettings) => StockProjection | null;
  onSave: (draft: StockSettings) => AppError | null;
  onClose: () => void;
};

/** Bottom sheet to edit the rings at home, the low-stock threshold and buy reminders. */
export function StockSheet({ visible, initial, project, onSave, onClose }: Props) {
  const t = useT();
  const c = useTheme();
  const locale = useLanguageStore((s) => s.locale);
  const [draft, setDraft] = useState<StockSettings>(initial);

  // Start from the saved values every time the sheet opens.
  useEffect(() => {
    if (visible) setDraft(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const projection = project(draft);
  const runOutLabel = projection
    ? new Date(projection.runOutAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  function handleSave() {
    const error = onSave(draft);
    if (error !== null) {
      Alert.alert(t.home_alert_error, error.message);
      return;
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose} accessible={false}>
        <TouchableOpacity activeOpacity={1} accessible={false} style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 32, gap: 18 }} showsVerticalScrollIndicator={false}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' }} />

            <View style={{ gap: 4 }}>
              <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '800', color: c.text }}>{t.stock_sheet_title}</Text>
              <Text style={{ fontSize: 14, color: c.slate400 }}>{t.stock_sheet_subtitle}</Text>
            </View>

            <StockStepper
              count={draft.count}
              low={projection?.low ?? false}
              onChange={(count) => setDraft((d) => ({ ...d, count }))}
            />

            <View style={{ backgroundColor: c.isDark ? c.surfaceRaised : c.slate100, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ fontSize: 14, color: c.slate700, flexShrink: 1 }}>{t.stock_sheet_until}</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>{runOutLabel}</Text>
            </View>

            <StockReminderOptions
              threshold={draft.threshold}
              hours={draft.buyReminderHours}
              reminderTimes={projection?.reminderTimes ?? []}
              onThresholdChange={(threshold) => setDraft((d) => ({ ...d, threshold }))}
              onHoursChange={(buyReminderHours) => setDraft((d) => ({ ...d, buyReminderHours }))}
            />

            <View style={{ gap: 10, marginTop: 4 }}>
              <GradientButton label={t.stock_sheet_save} onPress={handleSave} from={c.indigo} to={c.indigoLight} />
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.stock_sheet_cancel}
                style={{ height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: c.slate400 }}>{t.stock_sheet_cancel}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
