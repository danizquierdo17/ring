import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';

import { useCurrentCycle } from '../hooks/useCurrentCycle';
import { calcDayOfCycle, calcEarlyLateWarning } from '../domain/cycleStateMachine';
import { isOk } from '../../../shared/result';
import { C } from '../../../shared/theme/colors';
import { CircularProgress } from '../../../shared/ui/CircularProgress';
import { DateTimePickerModal } from '../../../shared/ui/DateTimePickerModal';
import { useDateTimePicker } from '../../../shared/hooks/useDateTimePicker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BellIcon = Bell as React.ComponentType<any>;

const CYCLIC_TOTAL = 21;
const FREE_TOTAL   = 7;

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ uiState }: { uiState: string }) {
  const cfg = {
    RING_IN_USE: { label: 'Insertado',     bg: '#DCFCE7', color: '#15803D' },
    NO_RING:     { label: 'Sin anillo',    bg: '#FFF1F2', color: C.coralDark },
    RING_FREE:   { label: 'Período libre', bg: '#ECFDF5', color: C.emeraldDark },
  }[uiState] ?? { label: '—', bg: C.slate100, color: C.slate400 };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────

function InfoCard({ uiState, removeByDate, daysLeft, nextInsertDate }: {
  uiState: string;
  removeByDate: string | null;
  daysLeft: number | null;
  nextInsertDate: string | null;
}) {
  if (uiState === 'RING_IN_USE' && removeByDate !== null && daysLeft !== null) {
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.slate100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
        <View>
          <Text style={{ fontSize: 10, color: C.slate400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Retirar antes del</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, marginTop: 2 }}>{removeByDate}</Text>
        </View>
        <View style={{ backgroundColor: C.lavender, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.indigo, lineHeight: 26 }}>{daysLeft}</Text>
          <Text style={{ fontSize: 9, color: C.indigo, fontWeight: '700', letterSpacing: 0.5 }}>DÍAS</Text>
        </View>
      </View>
    );
  }

  if (uiState === 'NO_RING') {
    return (
      <View style={{ backgroundColor: C.lavender, borderRadius: 18, padding: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.indigo, marginBottom: 4 }}>¿Lista para empezar?</Text>
        <Text style={{ fontSize: 12, color: C.indigoLight }}>Inserta tu anillo y comienza el seguimiento de tu ciclo.</Text>
      </View>
    );
  }

  if (uiState === 'RING_FREE' && nextInsertDate !== null) {
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.slate100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 10, color: C.slate400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Próxima inserción</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: C.emeraldDark, marginTop: 2 }}>{nextInsertDate}</Text>
        </View>
        <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.emeraldDark }}>Período libre</Text>
        </View>
      </View>
    );
  }

  return null;
}

// ── StepsIndicator ─────────────────────────────────────────────────────────

function StepsIndicator({ uiState }: { uiState: string }) {
  const steps = [
    { label: 'Insertado', done: uiState === 'RING_IN_USE' || uiState === 'RING_FREE', active: uiState === 'RING_IN_USE' || uiState === 'RING_FREE' },
    { label: 'En curso',  done: uiState === 'RING_FREE',  active: uiState === 'RING_IN_USE' },
    { label: 'Retirar',   done: false,                    active: false },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.slate100, borderRadius: 14, padding: 12 }}>
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: step.done || step.active ? C.indigo : C.slate200, alignItems: 'center', justifyContent: 'center' }}>
              {step.done
                ? <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>✓</Text>
                : <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: step.active ? '#fff' : C.slate400 }} />
              }
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: step.done || step.active ? C.indigo : C.slate400, letterSpacing: 0.3 }}>
              {step.label}
            </Text>
          </View>
          {i < 2 && (
            <View style={{ flex: 1, height: 2, backgroundColor: i === 0 && (uiState === 'RING_IN_USE' || uiState === 'RING_FREE') ? C.indigo : C.slate200, marginBottom: 14 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── ActionButton ───────────────────────────────────────────────────────────

function ActionButton({ uiState, onPress }: { uiState: string; onPress: () => void }) {
  const cfg = {
    RING_IN_USE: { label: 'Registrar Retirada del Anillo', bg: C.coral,   shadow: C.coral },
    RING_FREE:   { label: 'Insertar Nuevo Anillo',         bg: C.emerald, shadow: C.emerald },
    NO_RING:     { label: 'Registrar Inserción del Anillo',bg: C.indigo,  shadow: C.indigo },
  }[uiState] ?? { label: '—', bg: C.slate400, shadow: C.slate400 };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={cfg.label}
      accessibilityHint="Abre un menú para confirmar la fecha y hora de la acción"
      style={{
        backgroundColor: cfg.bg,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: cfg.shadow,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
        {cfg.label}
      </Text>
    </TouchableOpacity>
  );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { isLoading, currentCycle, uiState, insertRingAction, removeRingAction } = useCurrentCycle();
  const { showActionSheetWithOptions } = useActionSheet();
  const { pickerState, showPicker, onPickerChange, onPickerAccept, onPickerCancel } = useDateTimePicker();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} edges={['top']}>
        <ActivityIndicator size="large" color={C.indigo} />
      </SafeAreaView>
    );
  }

  const now = new Date().toISOString();
  const day = currentCycle !== null ? calcDayOfCycle(currentCycle.insertedAt, now) : 1;
  const total = uiState === 'RING_FREE' ? FREE_TOTAL : CYCLIC_TOTAL;

  const removeByDate = currentCycle?.plannedRemovalAt
    ? new Date(currentCycle.plannedRemovalAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const daysLeft = currentCycle?.plannedRemovalAt && uiState === 'RING_IN_USE'
    ? Math.max(0, CYCLIC_TOTAL - day + 1)
    : null;

  const nextInsertDate = currentCycle?.removedAt && uiState === 'RING_FREE'
    ? (() => {
        const d = new Date(currentCycle.removedAt);
        d.setUTCDate(d.getUTCDate() + 7);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : null;

  // ── executeAction: runs the domain action with the chosen timestamp ──────

  function executeAction(chosenDate: Date) {
    const chosenIso = chosenDate.toISOString();

    // If removing: check for early/late deviation
    if (uiState === 'RING_IN_USE' && currentCycle?.plannedRemovalAt) {
      const warning = calcEarlyLateWarning(currentCycle.plannedRemovalAt, chosenIso);
      if (warning !== null) {
        const msg =
          warning.kind === 'EARLY'
            ? `Estás retirando el anillo ${warning.hoursEarly} horas antes de lo previsto. ¿Continuar?`
            : `El anillo lleva ${warning.hoursLate} horas más de lo previsto. ¿Continuar?`;
        Alert.alert(
          warning.kind === 'EARLY' ? 'Retirada temprana' : 'Retirada tardía',
          msg,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: () => runAction(chosenIso) },
          ],
        );
        return;
      }
    }

    runAction(chosenIso);
  }

  function runAction(chosenIso: string) {
    const result = uiState === 'RING_IN_USE'
      ? removeRingAction(chosenIso)
      : insertRingAction(chosenIso);
    if (!isOk(result)) {
      Alert.alert('Error', result.error.message);
    }
  }

  // ── handlePress: opens the ActionSheet ───────────────────────────────────

  function handlePress() {
    const nowDate = new Date();
    const timeStr = nowDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    showActionSheetWithOptions(
      {
        options: [`Ahora mismo (${timeStr})`, 'Elegir fecha y hora', 'Cancelar'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: undefined,
        title: uiState === 'RING_IN_USE' ? 'Registrar retirada' : 'Registrar inserción',
        tintColor: C.indigo,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          executeAction(nowDate);
        } else if (buttonIndex === 1) {
          showPicker({
            initialDate: nowDate,
            onConfirm: (date) => executeAction(date),
          });
        }
        // index 2 = Cancel — do nothing
      },
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>Hola</Text>
            <Text style={{ fontSize: 12, color: C.slate400, marginTop: 1 }}>Estado de tu anillo</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: C.lavender, borderRadius: 19, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <BellIcon color={C.indigo} size={17} />
          </TouchableOpacity>
        </View>

        {/* Ring + Badge */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <CircularProgress day={day} total={total} uiState={uiState} size={260} />
          <StatusBadge uiState={uiState} />
        </View>

        {/* InfoCard */}
        <View style={{ marginBottom: 10 }}>
          <InfoCard uiState={uiState} removeByDate={removeByDate} daysLeft={daysLeft} nextInsertDate={nextInsertDate} />
        </View>

        {/* Steps */}
        <View style={{ marginBottom: 12 }}>
          <StepsIndicator uiState={uiState} />
        </View>

        {/* CTA Button */}
        <ActionButton uiState={uiState} onPress={handlePress} />

      </View>

      {/* DateTime picker (iOS modal / Android dialog) */}
      <DateTimePickerModal
        visible={pickerState.visible}
        value={pickerState.working}
        mode={pickerState.phase}
        maximumDate={new Date()}
        onAccept={onPickerAccept}
        onCancel={onPickerCancel}
        onChange={onPickerChange}
      />
    </SafeAreaView>
  );
}
