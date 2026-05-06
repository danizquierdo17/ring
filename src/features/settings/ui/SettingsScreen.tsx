import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Coffee, ChevronRight, DatabaseBackup, MessageSquare, ShieldCheck, Sun, Moon } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSettings } from '../hooks/useSettings';
import type { Regimen } from '../../cycle/domain/cycleStateMachine';
import { useCycleStore } from '../../cycle/hooks/useCycleStore';
import { useTheme } from '../../../shared/theme/useTheme';
import type { ThemePreference } from '../../../shared/theme/themeStore';
import { useT } from '../../../shared/i18n/useT';
import { LOCALES, type Locale } from '../../../shared/i18n/translations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BookOpenIcon = BookOpen as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CoffeeIcon = Coffee as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChevronRightIcon = ChevronRight as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DatabaseBackupIcon = DatabaseBackup as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MessageSquareIcon = MessageSquare as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShieldCheckIcon = ShieldCheck as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SunIcon = Sun as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MoonIcon = Moon as React.ComponentType<any>;

const KOFI_URL = 'https://ko-fi.com/luaring';
const FEEDBACK_EMAIL = 'mailto:miekipo17@gmail.com?subject=%5BLUARing-Feedback%5D';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: NativeStackNavigationProp<any>;
};

export function SettingsScreen({ navigation }: Props) {
  const { settings, isLoading, setRegimen, setContinuousDays, setLanguage, setTheme } = useSettings();
  const db = useSQLiteContext();
  const t = useT();
  const c = useTheme();
  const _setCycle = useCycleStore((s) => s._setCycle);

  if (isLoading || settings === null) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }} edges={['top']}>
        <ActivityIndicator size="large" color={c.indigo} />
      </SafeAreaView>
    );
  }

  function handleRegimenChange(regimen: Regimen) {
    const error = setRegimen(regimen);
    if (error !== null) Alert.alert('Error', error.message);
  }

  function handleContinuousDaysChange(delta: number) {
    const error = setContinuousDays(settings!.continuousDays + delta);
    if (error !== null) Alert.alert('Error', error.message);
  }

  async function handleKofi() {
    const supported = await Linking.canOpenURL(KOFI_URL);
    if (supported) await Linking.openURL(KOFI_URL);
  }

  async function handleFeedback() {
    const supported = await Linking.canOpenURL(FEEDBACK_EMAIL);
    if (supported) await Linking.openURL(FEEDBACK_EMAIL);
    else Alert.alert(t.home_alert_error, t.settings_feedback_error);
  }

  function handleLanguageChange(locale: Locale) {
    setLanguage(locale);
  }

  function handleThemeChange(theme: ThemePreference) {
    setTheme(theme);
  }

  function handleDeleteAllData() {
    Alert.alert(
      t.settings_delete_title,
      t.settings_delete_body,
      [
        { text: t.settings_delete_cancel, style: 'cancel' },
        {
          text: t.settings_delete_confirm,
          style: 'destructive',
          onPress: () => {
            try {
              db.withTransactionSync(() => {
                db.execSync('DELETE FROM Events');
                db.execSync('DELETE FROM Cycles');
                db.execSync('DELETE FROM LunaDays');
                db.runSync(`UPDATE LunaConfig SET cycle_start_date = NULL, updated_at = datetime('now') WHERE id = 1`);
                db.runSync(`UPDATE Settings SET regimen = 'CYCLIC_21_7', continuous_days = 28, updated_at = datetime('now') WHERE id = 1`);
              });
              // Reset the cycle store so HomeScreen reflects the empty state immediately
              _setCycle(null, new Date().toISOString());
              Alert.alert(t.settings_delete_done_title, t.settings_delete_done_body);
            } catch (e) {
              Alert.alert(t.home_alert_error, e instanceof Error ? e.message : t.settings_delete_error);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{t.settings_title}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>

          {/* Ko-fi donation card */}
          <TouchableOpacity
            onPress={handleKofi}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t.settings_kofi_title}
            style={{
              backgroundColor: c.emerald,
              borderRadius: 18,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              shadowColor: c.emerald,
              shadowOpacity: 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CoffeeIcon color="#fff" size={22} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>
                {t.settings_kofi_title}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 17 }}>
                {t.settings_kofi_body}
              </Text>
            </View>
            <ChevronRightIcon color="rgba(255,255,255,0.7)" size={18} />
          </TouchableOpacity>

          {/* Privacy note — right below Ko-fi */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: c.lavender,
            borderRadius: 16,
            padding: 14,
            gap: 10,
            alignItems: 'flex-start',
          }}>
            <ShieldCheckIcon color={c.indigo} size={18} style={{ marginTop: 1, flexShrink: 0 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: c.indigo }}>{t.settings_privacy_title}</Text>
              <Text style={{ fontSize: 12, color: c.indigoLight, lineHeight: 18 }}>
                {t.settings_privacy_body}
              </Text>
            </View>
          </View>

          {/* Régimen section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.settings_section_regimen}
            </Text>

            <RegimenOption
              label={t.settings_regimen_cyclic_label}
              description={t.settings_regimen_cyclic_desc}
              selected={settings.regimen === 'CYCLIC_21_7'}
              onPress={() => handleRegimenChange('CYCLIC_21_7')}
            />
            <RegimenOption
              label={t.settings_regimen_continuous_label}
              description={t.settings_regimen_continuous_desc(settings.continuousDays)}
              selected={settings.regimen === 'CONTINUOUS'}
              onPress={() => handleRegimenChange('CONTINUOUS')}
            />
          </View>

          {/* Continuous days stepper */}
          {settings.regimen === 'CONTINUOUS' && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t.settings_section_duration}
              </Text>
              <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{t.settings_days_per_ring}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => handleContinuousDaysChange(-1)}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.lavender, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityRole="button" accessibilityLabel={t.settings_decrease_days}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: c.indigo, lineHeight: 24 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: c.indigo, minWidth: 32, textAlign: 'center' }}>
                    {settings.continuousDays}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleContinuousDaysChange(+1)}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.lavender, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityRole="button" accessibilityLabel={t.settings_increase_days}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: c.indigo, lineHeight: 24 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: c.slate400, textAlign: 'center' }}>{t.settings_days_range}</Text>
            </View>
          )}

          {/* Centro de ayuda row */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.settings_section_help}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProspectusCenter')}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.settings_prospectus_title}
              style={{
                backgroundColor: c.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: c.lavender,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BookOpenIcon color={c.indigo} size={20} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{t.settings_prospectus_title}</Text>
                <Text style={{ fontSize: 12, color: c.slate400 }}>{t.settings_prospectus_desc}</Text>
              </View>
              <ChevronRightIcon color={c.slate400} size={18} />
            </TouchableOpacity>

            {/* Feedback row */}
            <TouchableOpacity
              onPress={handleFeedback}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.settings_feedback_title}
              style={{
                backgroundColor: c.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: c.lavender,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageSquareIcon color={c.indigo} size={20} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{t.settings_feedback_title}</Text>
                <Text style={{ fontSize: 12, color: c.slate400 }}>{t.settings_feedback_desc}</Text>
              </View>
              <ChevronRightIcon color={c.slate400} size={18} />
            </TouchableOpacity>
          </View>

          {/* Datos section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.settings_section_data}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Backup')}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.settings_backup_title}
              style={{
                backgroundColor: c.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 11,
                backgroundColor: c.emerald + '18',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <DatabaseBackupIcon color={c.emerald} size={20} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{t.settings_backup_title}</Text>
                <Text style={{ fontSize: 12, color: c.slate400 }}>{t.settings_backup_desc}</Text>
              </View>
              <ChevronRightIcon color={c.slate400} size={18} />
            </TouchableOpacity>
          </View>

          {/* Language section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.settings_section_language}
            </Text>
            {LOCALES.map(({ id, label, flag }) => {
              const selected = settings.language === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => handleLanguageChange(id)}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ checked: selected }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selected ? c.indigo : c.border,
                    backgroundColor: selected ? c.lavender : c.surface,
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{flag}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: selected ? c.indigo : c.text }}>
                    {label}
                  </Text>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? c.indigo : c.slate200,
                    backgroundColor: selected ? c.indigo : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Appearance / theme section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.settings_section_appearance}
            </Text>
            {([
              { id: 'light' as ThemePreference, label: t.settings_theme_light, Icon: SunIcon },
              { id: 'dark'  as ThemePreference, label: t.settings_theme_dark,  Icon: MoonIcon },
            ]).map(({ id, label, Icon }) => {
              const selected = settings.theme === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => handleThemeChange(id)}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ checked: selected }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selected ? c.indigo : c.border,
                    backgroundColor: selected ? c.lavender : c.surface,
                    gap: 12,
                  }}
                >
                  <Icon color={selected ? c.indigo : c.slate400} size={18} />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: selected ? c.indigo : c.text }}>
                    {label}
                  </Text>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? c.indigo : c.slate200,
                    backgroundColor: selected ? c.indigo : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16, paddingHorizontal: 20, gap: 20 }}>

          {/* Delete all data — destructive, at the very bottom */}
          <TouchableOpacity
            onPress={handleDeleteAllData}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t.settings_delete_btn}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: c.coral,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.coral }}>
              {t.settings_delete_btn}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, letterSpacing: 1 }}>
              {t.settings_version}
            </Text>
            <Text style={{ fontSize: 10, color: c.slate200, letterSpacing: 0.5 }}>
              {t.settings_tagline}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function RegimenOption({ label, description, selected, onPress }: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? c.indigo : c.border,
        backgroundColor: selected ? c.lavender : c.surface,
        shadowColor: selected ? c.indigo : '#000',
        shadowOpacity: selected ? 0.08 : 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: selected ? c.indigo : c.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: selected ? c.indigoLight : c.slate400 }}>
          {description}
        </Text>
      </View>
      <View style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? c.indigo : c.slate200,
        backgroundColor: selected ? c.indigo : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
      }}>
        {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
      </View>
    </TouchableOpacity>
  );
}
