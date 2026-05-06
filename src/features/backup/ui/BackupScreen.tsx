import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight, Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../../shared/theme/useTheme';
import { useT } from '../../../shared/i18n/useT';
import { encodeBackup, decodeBackup } from '../domain/backupCodec';
import type { CycleRow, EventRow, SettingsRow } from '../../../infra/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChevronRightIcon    = ChevronRight    as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DownloadIcon        = Download        as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UploadIcon          = Upload          as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShieldCheckIcon     = ShieldCheck     as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AlertTriangleIcon   = AlertTriangle   as React.ComponentType<any>;

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: NativeStackNavigationProp<any>;
};

type Status = 'idle' | 'exporting' | 'importing';

// ── Luna row types (not in schema.ts yet) ────────────────────────────────────
type LunaConfigRow   = { cycle_start_date: string | null };
type LunaDayRow = {
  day_number: number;
  color: string | null; color_name: string | null;
  emoji: string | null; tags: string | null;
  notes: string | null; dreams: string | null;
};

export function BackupScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const t = useT();
  const c = useTheme();
  const [status, setStatus] = useState<Status>('idle');

  // ── EXPORT ────────────────────────────────────────────────────────────────

  async function handleExport() {
    setStatus('exporting');
    try {
      const settings = db.getFirstSync<SettingsRow>('SELECT * FROM Settings WHERE id = 1');
      const cycles   = db.getAllSync<CycleRow>('SELECT * FROM Cycles ORDER BY inserted_at');
      const events   = db.getAllSync<EventRow>('SELECT * FROM Events ORDER BY occurred_at');
      const lunaCfg  = db.getFirstSync<LunaConfigRow>('SELECT cycle_start_date FROM LunaConfig WHERE id = 1');
      const lunaDays = db.getAllSync<LunaDayRow>('SELECT * FROM LunaDays ORDER BY day_number');

      if (!settings) throw new Error(t.backup_error_no_settings);

      const json = encodeBackup({
        settings: {
          regimen:         settings.regimen,
          continuous_days: settings.continuous_days,
        },
        cycles,
        events,
        luna_config: { cycle_start_date: lunaCfg?.cycle_start_date ?? null },
        luna_days:   lunaDays,
      });

      const date     = new Date().toISOString().slice(0, 10);
      const filename = `lua-ring-backup-${date}.json`;
      const path     = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(path, json, { encoding: 'utf8' });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t.backup_error_export, t.backup_error_no_share);
        return;
      }
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: t.backup_export_title });
    } catch (e) {
      Alert.alert(t.backup_error_export, e instanceof Error ? e.message : String(e));
    } finally {
      setStatus('idle');
    }
  }

  // ── IMPORT ────────────────────────────────────────────────────────────────

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const uri = result.assets[0]!.uri;

    Alert.alert(
      t.backup_confirm_title,
      t.backup_confirm_body,
      [
        { text: t.backup_confirm_cancel, style: 'cancel' },
        {
          text: t.backup_confirm_restore,
          style: 'destructive',
          onPress: () => void performImport(uri),
        },
      ],
    );
  }

  async function performImport(uri: string) {
    setStatus('importing');
    try {
      const raw     = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
      const backup  = decodeBackup(raw);

      db.withTransactionSync(() => {
        // Clear all tables
        db.execSync('DELETE FROM Events');
        db.execSync('DELETE FROM Cycles');
        db.execSync('DELETE FROM LunaDays');
        db.execSync('UPDATE LunaConfig SET cycle_start_date = NULL WHERE id = 1');

        // Restore settings
        db.runSync(
          `UPDATE Settings SET regimen = ?, continuous_days = ?, updated_at = datetime('now') WHERE id = 1`,
          backup.settings.regimen, backup.settings.continuous_days,
        );

        // Restore cycles
        for (const c of backup.cycles) {
          db.runSync(
            `INSERT OR REPLACE INTO Cycles (id, regimen, inserted_at, removed_at, planned_removal_at, status, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            c.id, c.regimen, c.inserted_at, c.removed_at, c.planned_removal_at,
            c.status, c.notes, c.created_at, c.updated_at,
          );
        }

        // Restore events
        for (const e of backup.events) {
          db.runSync(
            `INSERT OR REPLACE INTO Events (id, cycle_id, type, occurred_at, recorded_at, payload)
             VALUES (?, ?, ?, ?, ?, ?)`,
            e.id, e.cycle_id, e.type, e.occurred_at, e.recorded_at, e.payload,
          );
        }

        // Restore luna config
        db.runSync(
          `UPDATE LunaConfig SET cycle_start_date = ?, updated_at = datetime('now') WHERE id = 1`,
          backup.luna_config.cycle_start_date,
        );

        // Restore luna days
        for (const d of backup.luna_days) {
          db.runSync(
            `INSERT OR REPLACE INTO LunaDays (day_number, color, color_name, emoji, tags, notes, dreams, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            d.day_number, d.color, d.color_name, d.emoji, d.tags, d.notes, d.dreams,
          );
        }
      });

      Alert.alert(t.backup_success_title, t.backup_success_body);
    } catch (e) {
      Alert.alert(
        t.backup_error_import,
        e instanceof Error ? e.message : t.backup_error_invalid,
      );
    } finally {
      setStatus('idle');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const busy = status !== 'idle';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: c.lavender,
            alignItems: 'center', justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={t.backup_back}
        >
          <ChevronRightIcon color={c.indigo} size={20} style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: c.text, letterSpacing: -0.3 }}>
            {t.backup_title}
          </Text>
          <Text style={{ fontSize: 11, color: c.slate400, marginTop: 1 }}>
            {t.backup_subtitle}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>

        {/* Export card */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={busy}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t.backup_export_title}
          style={{
            backgroundColor: c.indigo,
            borderRadius: 18,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: busy ? 0.6 : 1,
            shadowColor: c.indigo,
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {status === 'exporting'
              ? <ActivityIndicator color="#fff" />
              : <DownloadIcon color="#fff" size={22} />
            }
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>
              {t.backup_export_title}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 17 }}>
              {t.backup_export_body}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Import card */}
        <TouchableOpacity
          onPress={handleImport}
          disabled={busy}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={t.backup_import_title}
          style={{
            backgroundColor: c.surface,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: c.coral,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: c.coral + '18',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {status === 'importing'
              ? <ActivityIndicator color={c.coral} />
              : <UploadIcon color={c.coral} size={22} />
            }
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>
              {t.backup_import_title}
            </Text>
            <Text style={{ fontSize: 12, color: c.slate400, lineHeight: 17 }}>
              {t.backup_import_body}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Warning */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: c.isDark ? '#1F1500' : '#FFF8E7',
          borderRadius: 14,
          padding: 14,
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <AlertTriangleIcon color={c.isDark ? '#E8A020' : '#C8860A'} size={18} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={{ fontSize: 12, color: c.isDark ? '#E8A020' : '#7A5200', lineHeight: 18, flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>{t.backup_warning_bold}</Text>
            {t.backup_warning_body}
          </Text>
        </View>

        {/* Privacy note */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: c.lavender,
          borderRadius: 14,
          padding: 14,
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <ShieldCheckIcon color={c.indigo} size={18} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={{ fontSize: 12, color: c.indigoLight, lineHeight: 18, flex: 1 }}>
            {t.backup_privacy_body}
          </Text>
        </View>

        {/* Format note */}
        <View style={{ backgroundColor: c.slate100, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 11, color: c.slate400, lineHeight: 16 }}>
            <Text style={{ fontWeight: '700' }}>{t.backup_format_label}</Text>
            {t.backup_format_body}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
