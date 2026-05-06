import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, type ThemeColors } from '../../../shared/theme/useTheme';
import { addDays } from '../domain/moonPhase';
import { useT } from '../../../shared/i18n/useT';

type Props = {
  visible: boolean;
  onConfirm: (date: Date) => void;
  onClose: () => void;
};


function midnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function PeriodStartModal({ visible, onConfirm, onClose }: Props) {
  const t = useT();
  const c = useTheme();
  const styles = createStyles(c);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => midnight(new Date()));

  const QUICK_OPTIONS = [
    { offset: 0 as const,  label: t.period_opt_today },
    { offset: -1 as const, label: t.period_opt_yesterday },
    { offset: -2 as const, label: t.period_opt_2days },
    { offset: -3 as const, label: t.period_opt_3days },
    { offset: -4 as const, label: t.period_opt_4days },
  ];

  function handleQuick(offset: number) {
    onConfirm(midnight(addDays(new Date(), offset)));
  }

  function handlePickerChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selected) onConfirm(midnight(selected));
    } else {
      if (selected) setPickerDate(midnight(selected));
    }
  }

  function handleIOSConfirm() {
    setShowPicker(false);
    onConfirm(pickerDate);
  }

  const today = new Date();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t.period_modal_title}</Text>
        <Text style={styles.subtitle}>{t.period_modal_subtitle}</Text>

        {/* Quick options */}
        <View style={styles.options}>
          {QUICK_OPTIONS.map(({ offset, label }) => {
            const d = addDays(today, offset);
            const ds = d.toLocaleDateString([], {
              weekday: 'long', day: 'numeric', month: 'long',
            });
            return (
              <TouchableOpacity
                key={offset}
                onPress={() => handleQuick(offset)}
                style={styles.option}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <View>
                  <Text style={styles.optionLabel}>{label}</Text>
                  <Text style={styles.optionDate}>{ds}</Text>
                </View>
                {offset === 0 && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Free date picker */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.freePickerBtn}
          accessibilityRole="button"
          accessibilityLabel={t.period_opt_other}
        >
          <Text style={styles.freePickerText}>{t.period_opt_other}</Text>
        </TouchableOpacity>

        {/* iOS inline picker */}
        {showPicker && Platform.OS === 'ios' && (
          <View style={styles.iosPickerWrapper}>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              maximumDate={today}
              onChange={handlePickerChange}
            />
            <View style={styles.iosPickerActions}>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.iosBtn}>
                <Text style={styles.iosBtnCancel}>{t.period_cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleIOSConfirm} style={[styles.iosBtn, styles.iosBtnPrimary]}>
                <Text style={styles.iosBtnConfirm}>{t.period_confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Android native picker (renders natively when showPicker=true) */}
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={handlePickerChange}
          />
        )}

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} accessibilityRole="button">
          <Text style={styles.cancelText}>{t.period_cancel}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors & { isDark: boolean }) {
  const subtleText = c.isDark ? '#7A6E78' : '#a09098';
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 36,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.slate200,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 16,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: subtleText,
      marginBottom: 16,
    },
    options: {
      gap: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.slate200,
      backgroundColor: c.surface,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    optionDate: {
      fontSize: 11,
      color: subtleText,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    todayDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#C94040',
    },
    freePickerBtn: {
      marginTop: 10,
      padding: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.indigo,
      backgroundColor: c.lavender,
      alignItems: 'center',
    },
    freePickerText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.indigo,
    },
    iosPickerWrapper: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.slate200,
      overflow: 'hidden',
      backgroundColor: c.slate100,
    },
    iosPickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.slate200,
      backgroundColor: c.surface,
    },
    iosBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    iosBtnPrimary: {
      backgroundColor: c.indigo,
    },
    iosBtnCancel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.slate400,
    },
    iosBtnConfirm: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    cancelBtn: {
      marginTop: 10,
      padding: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.slate200,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.slate400,
    },
  });
}
