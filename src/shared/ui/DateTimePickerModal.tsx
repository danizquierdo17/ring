import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { C } from '../theme/colors';

type Props = {
  visible: boolean;
  /** Current working date value. */
  value: Date;
  /** 'date' | 'time' — controls Android two-step. iOS always shows datetime. */
  mode: 'date' | 'time';
  /** Upper bound: user cannot select a date/time after this. */
  maximumDate?: Date;
  minimumDate?: Date;
  onAccept: () => void;
  onCancel: () => void;
  onChange: (date: Date) => void;
};

function formatPhaseLabel(mode: 'date' | 'time') {
  return mode === 'date' ? 'Selecciona la fecha' : 'Selecciona la hora';
}

function formatSelectedDateTime(date: Date) {
  return date.toLocaleString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function DateTimePickerModal({
  visible,
  value,
  mode,
  maximumDate,
  minimumDate,
  onAccept,
  onCancel,
  onChange,
}: Props) {
  if (!visible) return null;

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (date) onChange(date);
    // On Android the picker closes automatically on selection.
    // We advance the phase (date→time) or confirm via onAccept.
    if (Platform.OS === 'android') {
      onAccept();
    }
  }

  // ── Android: native dialog, no wrapper needed ──────────────────────────
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={handleChange}
        locale="es-ES"
      />
    );
  }

  // ── iOS: inline spinner inside a bottom-sheet modal ────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
        activeOpacity={1}
        onPress={onCancel}
      />
      <View style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
      }}>
        {/* Handle bar */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200 }} />
        </View>

        {/* Title + preview */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 4, paddingTop: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {formatPhaseLabel(mode)}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.indigo, marginTop: 4 }}>
            {formatSelectedDateTime(value)}
          </Text>
        </View>

        {/* Picker */}
        <DateTimePicker
          value={value}
          mode="datetime"
          display="spinner"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_e, date) => { if (date) onChange(date); }}
          locale="es-ES"
          style={{ width: '100%' }}
          textColor={C.text}
        />

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 14,
              backgroundColor: C.slate100, alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.slate700 }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            style={{
              flex: 2, paddingVertical: 16, borderRadius: 14,
              backgroundColor: C.indigo, alignItems: 'center',
              shadowColor: C.indigo, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
            }}
            accessibilityRole="button"
            accessibilityLabel="Confirmar fecha y hora"
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
