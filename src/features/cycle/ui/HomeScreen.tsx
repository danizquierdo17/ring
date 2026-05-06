import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';

import { useCurrentCycle } from '../hooks/useCurrentCycle';
import { calcDayOfCycle, calcEarlyLateWarning, calcInsertionWarning } from '../domain/cycleStateMachine';
import { isOk } from '../../../shared/result';
import { C } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/useTheme';
import { CircularProgress } from '../../../shared/ui/CircularProgress';
import { DateTimePickerModal } from '../../../shared/ui/DateTimePickerModal';
import { useDateTimePicker } from '../../../shared/hooks/useDateTimePicker';
import { useT } from '../../../shared/i18n/useT';
import { planNotifications } from '../../notifications/domain/notificationPlanner';
import type { ThemeColors } from '../../../shared/theme/useTheme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BellIcon = Bell as React.ComponentType<any>;

const CYCLIC_TOTAL = 21;
const FREE_TOTAL   = 7;

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ uiState }: { uiState: string }) {
  const t = useT();
  const c = useTheme();
  const cfg = {
    RING_IN_USE: { label: t.home_status_ring_in_use, bg: '#DCFCE7', color: '#15803D' },
    NO_RING:     { label: t.home_status_no_ring,     bg: '#FFF1F2', color: c.coralDark },
    RING_FREE:   { label: t.home_status_ring_free,   bg: '#ECFDF5', color: c.emeraldDark },
  }[uiState] ?? { label: '—', bg: c.slate100, color: c.slate400 };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────

function InfoCard({ uiState, removeByDate, removeByTime, daysLeft, nextInsertDate, nextInsertTime }: {
  uiState: string;
  removeByDate: string | null;
  removeByTime: string | null;
  daysLeft: number | null;
  nextInsertDate: string | null;
  nextInsertTime: string | null;
}) {
  const t = useT();
  const c = useTheme();

  if (uiState === 'RING_IN_USE' && removeByDate !== null && daysLeft !== null) {
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
        <View>
          <Text style={{ fontSize: 10, color: c.slate400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{t.home_info_remove_by}</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.text, marginTop: 2 }}>{removeByDate}</Text>
          {removeByTime !== null && (
            <Text style={{ fontSize: 11, color: c.slate400, marginTop: 2 }}>{t.home_info_at_time} {removeByTime}</Text>
          )}
        </View>
        <View style={{ backgroundColor: c.lavender, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: c.indigo, lineHeight: 26 }}>{daysLeft}</Text>
          <Text style={{ fontSize: 9, color: c.indigo, fontWeight: '700', letterSpacing: 0.5 }}>{t.home_info_days}</Text>
        </View>
      </View>
    );
  }

  if (uiState === 'NO_RING') {
    return (
      <View style={{ backgroundColor: c.lavender, borderRadius: 18, padding: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.indigo, marginBottom: 4 }}>{t.home_info_ready_title}</Text>
        <Text style={{ fontSize: 12, color: c.indigoLight }}>{t.home_info_ready_body}</Text>
      </View>
    );
  }

  if (uiState === 'RING_FREE' && nextInsertDate !== null) {
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 10, color: c.slate400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{t.home_info_next_insert}</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.emeraldDark, marginTop: 2 }}>{nextInsertDate}</Text>
          {nextInsertTime !== null && (
            <Text style={{ fontSize: 11, color: c.slate400, marginTop: 2 }}>{t.home_info_at_time} {nextInsertTime}</Text>
          )}
        </View>
        <View style={{ backgroundColor: c.isDark ? '#0F2A1A' : '#ECFDF5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.emeraldDark }}>{t.home_info_free_period}</Text>
        </View>
      </View>
    );
  }

  return null;
}

// ── StepsIndicator ─────────────────────────────────────────────────────────

function StepsIndicator({ uiState }: { uiState: string }) {
  const t = useT();
  const c = useTheme();
  const steps = [
    { label: t.home_step_inserted, done: uiState === 'RING_IN_USE' || uiState === 'RING_FREE', active: uiState === 'RING_IN_USE' || uiState === 'RING_FREE' },
    { label: t.home_step_ongoing,  done: uiState === 'RING_FREE',  active: uiState === 'RING_IN_USE' },
    { label: t.home_step_remove,   done: false,                    active: false },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.slate100, borderRadius: 14, padding: 12 }}>
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: step.done || step.active ? c.indigo : c.slate200, alignItems: 'center', justifyContent: 'center' }}>
              {step.done
                ? <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>✓</Text>
                : <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: step.active ? '#fff' : c.slate400 }} />
              }
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: step.done || step.active ? c.indigo : c.slate400, letterSpacing: 0.3 }}>
              {step.label}
            </Text>
          </View>
          {i < 2 && (
            <View style={{ flex: 1, height: 2, backgroundColor: i === 0 && (uiState === 'RING_IN_USE' || uiState === 'RING_FREE') ? c.indigo : c.slate200, marginBottom: 14 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── ActionButton ───────────────────────────────────────────────────────────

function ActionButton({ uiState, onPress }: { uiState: string; onPress: () => void }) {
  const t = useT();
  const c = useTheme();
  const cfg = {
    RING_IN_USE: { label: t.home_action_remove,     bg: c.coral,   shadow: c.coral },
    RING_FREE:   { label: t.home_action_insert_new, bg: c.emerald, shadow: c.emerald },
    NO_RING:     { label: t.home_action_insert,     bg: c.indigo,  shadow: c.indigo },
  }[uiState] ?? { label: '—', bg: c.slate400, shadow: c.slate400 };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={cfg.label}
      accessibilityHint={t.home_action_hint}
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

// ── NotificationsSheet ─────────────────────────────────────────────────────

function NotificationsSheet({ visible, onClose, c, upcomingNotifications }: {
  visible: boolean;
  onClose: () => void;
  c: ThemeColors & { isDark: boolean };
  upcomingNotifications: { id: string; title: string; triggerAt: string }[];
}) {
  const t = useT();
  const styles = React.useMemo(() => StyleSheet.create({
    overlay:  { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet:    { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, maxHeight: '80%' },
    handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 },
    title:    { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 16 },
    empty:    { fontSize: 14, color: c.textMuted, textAlign: 'center', paddingVertical: 24 },
    row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderSubtle },
    dot:      { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    rowTitle: { fontSize: 14, fontWeight: '600', color: c.text, flex: 1 },
    rowTime:  { fontSize: 12, color: c.textMuted, marginTop: 2 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [c.isDark]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t.home_notif_sheet_title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {upcomingNotifications.length === 0 ? (
              <Text style={styles.empty}>{t.home_notif_sheet_empty}</Text>
            ) : (
              upcomingNotifications.map((n) => {
                const dt = new Date(n.triggerAt);
                const dateStr = dt.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dotColor = n.id.startsWith('removal') ? c.coral : c.emerald;
                return (
                  <View key={n.id} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{n.title}</Text>
                      <Text style={styles.rowTime}>{dateStr} · {timeStr}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── HomeScreen ─────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { isLoading, currentCycle, uiState, insertRingAction, removeRingAction } = useCurrentCycle();
  const { showActionSheetWithOptions } = useActionSheet();
  const { pickerState, showPicker, onPickerChange, onPickerAccept, onPickerCancel } = useDateTimePicker();
  const t = useT();
  const c = useTheme();
  const [notifSheetVisible, setNotifSheetVisible] = useState(false);

  const upcomingNotifications = useMemo(() => {
    if (!currentCycle) return [];
    const utcOffset = -new Date().getTimezoneOffset();
    const now = new Date();
    return planNotifications(currentCycle, utcOffset)
      .filter((n) => new Date(n.triggerAt) > now)
      .sort((a, b) => a.triggerAt.localeCompare(b.triggerAt));
  }, [currentCycle]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }} edges={['top']}>
        <ActivityIndicator size="large" color={c.indigo} />
      </SafeAreaView>
    );
  }

  const nowIso = new Date().toISOString();
  const day = currentCycle !== null
    ? uiState === 'RING_FREE' && currentCycle.removedAt
      ? calcDayOfCycle(currentCycle.removedAt, nowIso)
      : calcDayOfCycle(currentCycle.insertedAt, nowIso)
    : 1;
  const total = uiState === 'RING_FREE' ? FREE_TOTAL : CYCLIC_TOTAL;

  const removeByDate = currentCycle?.plannedRemovalAt
    ? new Date(currentCycle.plannedRemovalAt).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const removeByTime = currentCycle?.plannedRemovalAt
    ? new Date(currentCycle.plannedRemovalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const daysLeft = currentCycle?.plannedRemovalAt && uiState === 'RING_IN_USE'
    ? Math.max(0, CYCLIC_TOTAL - day + 1)
    : null;

  const nextInsertDate = currentCycle?.removedAt && uiState === 'RING_FREE'
    ? (() => {
        const d = new Date(currentCycle.removedAt);
        d.setUTCDate(d.getUTCDate() + 7);
        return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : null;

  const nextInsertTime = currentCycle?.removedAt && uiState === 'RING_FREE'
    ? (() => {
        const d = new Date(currentCycle.removedAt);
        d.setUTCDate(d.getUTCDate() + 7);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      })()
    : null;

  // ── executeAction: runs the domain action with the chosen timestamp ──────

  function executeAction(chosenDate: Date) {
    const chosenIso = chosenDate.toISOString();

    // Removal: warn if early or late
    if (uiState === 'RING_IN_USE' && currentCycle?.plannedRemovalAt) {
      const warning = calcEarlyLateWarning(currentCycle.plannedRemovalAt, chosenIso);
      if (warning !== null) {
        const title = warning.kind === 'EARLY' ? t.home_alert_early_title : t.home_alert_late_title;
        const body  = warning.kind === 'EARLY'
          ? t.home_alert_early_body(warning.hoursEarly)
          : t.home_alert_late_body(warning.hoursLate);
        Alert.alert(
          title,
          `${body}\n\n${t.home_alert_prospectus_hint}`,
          [
            { text: t.home_alert_cancel, style: 'cancel' },
            { text: t.home_alert_confirm, style: 'destructive', onPress: () => runAction(chosenIso) },
          ],
        );
        return;
      }
    }

    // Insertion in RING_FREE: warn if too early (> 5 h before planned insertion)
    if (uiState === 'RING_FREE' && currentCycle?.removedAt) {
      const plannedInsertAt = (() => {
        const d = new Date(currentCycle.removedAt);
        d.setUTCDate(d.getUTCDate() + 7);
        return d.toISOString();
      })();
      const warning = calcInsertionWarning(plannedInsertAt, chosenIso);
      if (warning !== null) {
        Alert.alert(
          t.home_alert_insert_early_title,
          `${t.home_alert_insert_early_body(warning.hoursEarly)}\n\n${t.home_alert_prospectus_hint}`,
          [
            { text: t.home_alert_cancel, style: 'cancel' },
            { text: t.home_alert_confirm, onPress: () => runAction(chosenIso) },
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
      Alert.alert(t.home_alert_error, result.error.message);
    }
  }

  // ── handlePress: opens the ActionSheet ───────────────────────────────────

  function handlePress() {
    const nowDate = new Date();
    const timeStr = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    showActionSheetWithOptions(
      {
        options: [`${t.home_sheet_now} (${timeStr})`, t.home_sheet_choose, t.home_sheet_cancel],
        cancelButtonIndex: 2,
        destructiveButtonIndex: undefined,
        title: uiState === 'RING_IN_USE' ? t.home_sheet_title_remove : t.home_sheet_title_insert,
        tintColor: c.indigo,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{t.home_title}</Text>
            <Text style={{ fontSize: 12, color: c.slate400, marginTop: 1 }}>{t.home_subtitle}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: c.lavender, borderRadius: 19, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={t.home_notifications_label}
            onPress={() => setNotifSheetVisible(true)}
          >
            <BellIcon color={c.indigo} size={17} />
            {upcomingNotifications.length > 0 && (
              <View style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: c.coral, borderWidth: 1.5, borderColor: c.surface }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Ring + Badge */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <CircularProgress day={day} total={total} uiState={uiState} size={260} />
          <StatusBadge uiState={uiState} />
        </View>

        {/* InfoCard */}
        <View style={{ marginBottom: 10 }}>
          <InfoCard uiState={uiState} removeByDate={removeByDate} removeByTime={removeByTime} daysLeft={daysLeft} nextInsertDate={nextInsertDate} nextInsertTime={nextInsertTime} />
        </View>

        {/* Steps */}
        <View style={{ marginBottom: 12 }}>
          <StepsIndicator uiState={uiState} />
        </View>

        {/* CTA Button */}
        <ActionButton uiState={uiState} onPress={handlePress} />

      </View>

      {/* Notifications sheet */}
      <NotificationsSheet
        visible={notifSheetVisible}
        onClose={() => setNotifSheetVisible(false)}
        c={c}
        upcomingNotifications={upcomingNotifications}
      />

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
