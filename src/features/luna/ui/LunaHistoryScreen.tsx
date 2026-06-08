import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { listLunaSnapshots, type LunaSnapshotSummary } from '../data/lunaRepo';

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) => d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${fmt(start)} — ${fmt(end)} · ${start.getFullYear()}`;
}

export function LunaHistoryScreen() {
  const db = useSQLiteContext();
  const c = useTheme();
  const t = useT();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  const [snapshots, setSnapshots] = useState<LunaSnapshotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setSnapshots(listLunaSnapshots(db));
    setIsLoading(false);
  }, [db]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgLuna, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={c.indigo} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgLuna }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t.luna_history_back}
          style={{ paddingVertical: 6, paddingRight: 12 }}
        >
          <Text style={{ fontSize: 16, color: c.indigo, fontWeight: '700' }}>‹ {t.luna_history_back}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: c.text, letterSpacing: -0.3 }}>{t.luna_history_title}</Text>
      </View>

      {snapshots.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 8 }}>
            {t.luna_history_empty}
          </Text>
          <Text style={{ fontSize: 13, color: c.textSubtle, textAlign: 'center', lineHeight: 18 }}>
            {t.luna_history_empty_hint}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {snapshots.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => navigation.navigate('LunaSnapshotDetail', { snapshotId: s.id })}
              accessibilityRole="button"
              accessibilityLabel={formatRange(s.cycleStartDate, s.cycleEndDate)}
              activeOpacity={0.75}
              style={{
                backgroundColor: c.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>
                  {formatRange(s.cycleStartDate, s.cycleEndDate)}
                </Text>
                <Text style={{ fontSize: 12, color: c.textSubtle, marginTop: 4 }}>
                  {t.luna_history_filled(s.filledDays)}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: c.textSubtle, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
