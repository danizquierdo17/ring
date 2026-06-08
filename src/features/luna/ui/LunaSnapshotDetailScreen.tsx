import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { getLunaSnapshot } from '../data/lunaRepo';
import { Mandala } from './Mandala';

type ParamList = {
  LunaSnapshotDetail: { snapshotId: string };
};

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) => d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${fmt(start)} — ${fmt(end)} · ${start.getFullYear()}`;
}

export function LunaSnapshotDetailScreen() {
  const db = useSQLiteContext();
  const c = useTheme();
  const t = useT();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'LunaSnapshotDetail'>>();
  const { snapshotId } = route.params;

  const snapshot = useMemo(() => getLunaSnapshot(db, snapshotId), [db, snapshotId]);

  if (snapshot === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bgLuna, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Text style={{ color: c.coral }}>{t.luna_history_empty}</Text>
      </SafeAreaView>
    );
  }

  const cycleStartDate = new Date(snapshot.cycleStartDate);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bgLuna }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t.luna_history_back}
          style={{ paddingVertical: 6, paddingRight: 12 }}
        >
          <Text style={{ fontSize: 16, color: c.indigo, fontWeight: '700' }}>‹ {t.luna_history_back}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: c.text, letterSpacing: -0.3 }}>
            {formatRange(snapshot.cycleStartDate, snapshot.cycleEndDate)}
          </Text>
          <Text style={{ fontSize: 11, color: c.textSubtle, marginTop: 1 }}>
            {t.luna_snapshot_subtitle(snapshot.filledDays)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}>
        <Mandala
          days={snapshot.days}
          cycleStartDate={cycleStartDate}
          todayDay={null}
          periodDays={[]}
          onDayTap={() => { /* read-only */ }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
