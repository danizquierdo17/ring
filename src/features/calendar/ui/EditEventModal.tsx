import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';

import { useSQLiteContext } from 'expo-sqlite';

import { useTheme, type ThemeColors } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { useDateTimePicker } from '../../../shared/hooks/useDateTimePicker';
import { DateTimePickerModal } from '../../../shared/ui/DateTimePickerModal';
import { updateCycleTimestamp } from '../../cycle/data/cyclesRepo';
import type { EditableEvent } from '../domain/buildMarkedDates';
import type { Regimen } from '../../cycle/domain/cycleStateMachine';

// ---------------------------------------------------------------------------
// Styles — defined outside component to avoid recreation on every render
// ---------------------------------------------------------------------------

function createStyles(c: ThemeColors & { isDark: boolean }) {
  return StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    handle: {
      alignSelf: 'center', width: 40, height: 4,
      borderRadius: 2, backgroundColor: c.border, marginBottom: 20,
    },
    title:      { fontSize: 17, fontWeight: '700', color: c.text, marginBottom: 8 },
    subtitle:   { fontSize: 14, color: c.textSubtle, marginBottom: 28 },
    pickButton: {
      backgroundColor: c.bgSubtle,
      borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20,
      borderWidth: 1, borderColor: c.border,
      marginBottom: 28,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    pickLabel:  { fontSize: 13, fontWeight: '600', color: c.textSubtle, marginBottom: 2 },
    pickValue:  { fontSize: 16, fontWeight: '700', color: c.text },
    buttons:    { flexDirection: 'row', gap: 12 },
    btnCancel: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      backgroundColor: c.bgSubtle, alignItems: 'center',
    },
    btnSave: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      backgroundColor: c.indigo, alignItems: 'center',
    },
    btnCancelText: { fontSize: 15, fontWeight: '600', color: c.textSubtle },
    btnSaveText:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  event: EditableEvent;
  onClose: () => void;
  onSaved: () => void;
};

export function EditEventModal({ event, onClose, onSaved }: Props) {
  const db     = useSQLiteContext();
  const c      = useTheme();
  const t      = useT();
  const styles = createStyles(c);

  const { pickerState, showPicker, onPickerChange, onPickerAccept, onPickerCancel } = useDateTimePicker();

  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date(event.currentIso));

  const isInsert = event.field === 'inserted_at';
  const title    = isInsert ? t.calendar_edit_title_insert : t.calendar_edit_title_remove;
  const subtitle = isInsert
    ? 'Toca para cambiar la fecha y hora de inserción'
    : 'Toca para cambiar la fecha y hora de retirada';

  const maximumDate = new Date(); // never future
  const minimumDate = event.pairedIso
    ? isInsert
      ? undefined                       // insertion: no lower bound (removal is the upper bound)
      : new Date(event.pairedIso)       // removal: must be after insertion
    : undefined;
  const effectiveMaximum = event.pairedIso && isInsert
    ? new Date(event.pairedIso)         // insertion: must be before removal
    : maximumDate;

  function openPicker() {
    showPicker({
      initialDate: selectedDate,
      onConfirm: (date) => setSelectedDate(date),
    });
  }

  function validate(dt: Date): string | null {
    if (dt > new Date()) return t.calendar_edit_error_future;
    if (event.field === 'removed_at' && event.pairedIso) {
      if (dt <= new Date(event.pairedIso)) return t.calendar_edit_error_before_insert;
    }
    if (event.field === 'inserted_at' && event.pairedIso) {
      if (dt >= new Date(event.pairedIso)) return t.calendar_edit_error_after_remove;
    }
    return null;
  }

  function handleSave() {
    const validationError = validate(selectedDate);
    if (validationError) {
      Alert.alert('', validationError);
      return;
    }

    const result = updateCycleTimestamp(
      db,
      event.cycleId,
      event.field,
      selectedDate.toISOString(),
      event.regimen as Regimen,
    );

    if (!result.ok) {
      Alert.alert(t.calendar_edit_error_db);
      return;
    }
    onSaved();
  }

  const dateLabel = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeLabel = selectedDate.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TouchableOpacity
            style={styles.pickButton}
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel="Cambiar fecha y hora"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.pickLabel}>Fecha y hora seleccionada</Text>
              <Text style={styles.pickValue}>{dateLabel} · {timeLabel}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.btnCancelText}>{t.calendar_edit_cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Guardar cambios"
            >
              <Text style={styles.btnSaveText}>{t.calendar_edit_save}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      <DateTimePickerModal
        visible={pickerState.visible}
        value={pickerState.working}
        mode={pickerState.phase}
        maximumDate={effectiveMaximum}
        minimumDate={minimumDate}
        onChange={onPickerChange}
        onAccept={onPickerAccept}
        onCancel={onPickerCancel}
      />
    </Modal>
  );
}
