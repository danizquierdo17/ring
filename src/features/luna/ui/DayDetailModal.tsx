import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme, type ThemeColors } from '../../../shared/theme/useTheme';
import { getMoonPhaseDay } from '../domain/moonPhase';
import type { DayData } from '../data/lunaRepo';
import { useT } from '../../../shared/i18n/useT';

// ── Palettes ──────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#FAC9C9','#F9956A','#F7E07B','#A8D5A2','#87CEEB','#B5A0D4','#F0B8CC',
  '#C8A882','#7BBFBA','#E8D5C0','#C94040','#9B8EC4','#3A3CF6','#2ECC9A',
];

const MOOD_EMOJIS = ['🌸','🌙','⚡','🌊','🔥','🌿','☁️','✨','🥀','🌺','💫','🌑'];


type Section = 'color' | 'feelings' | 'notes' | 'dreams';

function useMoonPhaseLabel(phaseDay: number): string {
  const t = useT();
  const p = ((phaseDay % 29.53) + 29.53) % 29.53;
  if (p < 1.5 || p > 28) return `🌑 ${t.day_moon_new}`;
  if (p < 7.4)  return `🌒 ${t.day_moon_waxing}`;
  if (p < 14.8) return `🌕 ${t.day_moon_full}`;
  if (p < 22.1) return `🌘 ${t.day_moon_waning}`;
  return `🌑 ${t.day_moon_new}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  day: number;
  date: Date | null;
  data: DayData;
  onSave: (data: DayData) => void;
  onClose: () => void;
};

export function DayDetailModal({ visible, day, date, data, onSave, onClose }: Props) {
  const t = useT();
  const c = useTheme();
  const styles = createStyles(c);
  const [section, setSection]     = useState<Section>('color');
  const [color, setColor]         = useState(data.color ?? '');
  const [colorName, setColorName] = useState(data.colorName ?? '');
  const [emoji, setEmoji]         = useState(data.emoji ?? '');
  const [tags, setTags]           = useState<string[]>(data.tags ?? []);
  const [notes, setNotes]         = useState(data.notes ?? '');
  const [dreams, setDreams]       = useState(data.dreams ?? '');

  React.useEffect(() => {
    if (visible) {
      setSection('color');
      setColor(data.color ?? '');
      setColorName(data.colorName ?? '');
      setEmoji(data.emoji ?? '');
      setTags(data.tags ?? []);
      setNotes(data.notes ?? '');
      setDreams(data.dreams ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, day]);

  function toggleTag(id: string) {
    setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  function handleSave() {
    onSave({ color, colorName, emoji, tags, notes, dreams });
  }

  const moonPhase = date ? getMoonPhaseDay(date) : 0;
  const moonLabel = useMoonPhaseLabel(moonPhase);
  const dateStr = date
    ? date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  const sections: Section[] = ['color', 'feelings', 'notes', 'dreams'];
  const sectionLabels: Record<Section, string> = {
    color: t.day_tab_color, feelings: t.day_tab_feelings, notes: t.day_tab_notes, dreams: t.day_tab_dreams,
  };

  const DAY_TAGS = [
    { id:'energy_high', label: t.tag_energy_high },
    { id:'energy_low',  label: t.tag_energy_low },
    { id:'pain',        label: t.tag_pain },
    { id:'cramps',      label: t.tag_cramps },
    { id:'joy',         label: t.tag_joy },
    { id:'sadness',     label: t.tag_sadness },
    { id:'irritable',   label: t.tag_irritable },
    { id:'calm',        label: t.tag_calm },
    { id:'libido_high', label: t.tag_libido_high },
    { id:'libido_low',  label: t.tag_libido_low },
    { id:'sleep_good',  label: t.tag_sleep_good },
    { id:'sleep_bad',   label: t.tag_sleep_bad },
    { id:'bloating',    label: t.tag_bloating },
    { id:'clear_mind',  label: t.tag_clear_mind },
  ];

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.dayDot, { backgroundColor: color || c.slate100 }]}>
                {emoji ? <Text style={styles.dayEmoji}>{emoji}</Text> : null}
              </View>
              <View>
                <Text style={styles.dayTitle}>{t.day_modal_day(day)}</Text>
                <Text style={styles.dateStr}>{dateStr}</Text>
              </View>
            </View>
            <Text style={styles.moonLabel}>{moonLabel}</Text>
          </View>

          {/* Section tabs */}
          <View style={styles.tabs}>
            {sections.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setSection(s)}
                style={[styles.tab, section === s && styles.tabActive]}
              >
                <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
                  {sectionLabels[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {section === 'color' && (
              <View style={{ gap: 14 }}>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(hex => (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => setColor(hex)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: hex },
                        color === hex && styles.colorDotSelected,
                      ]}
                    />
                  ))}
                </View>
                <TextInput
                  value={colorName}
                  onChangeText={setColorName}
                  placeholder={t.day_color_name_placeholder}
                  placeholderTextColor={c.slate400}
                  style={styles.textInput}
                />
                {color ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.colorPreviewDot, { backgroundColor: color }]} />
                    <Text style={{ flex: 1, fontSize: 13, color: c.text, fontStyle: 'italic' }}>
                      {colorName || t.day_color_no_name}
                    </Text>
                    <TouchableOpacity onPress={() => { setColor(''); setColorName(''); }}>
                      <Text style={styles.clearText}>{t.day_color_clear}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            {section === 'feelings' && (
              <View style={{ gap: 18 }}>
                <View>
                  <Text style={styles.sectionLabel}>{t.day_symbol_label}</Text>
                  <View style={styles.emojiRow}>
                    {MOOD_EMOJIS.map(e => (
                      <TouchableOpacity
                        key={e}
                        onPress={() => setEmoji(prev => prev === e ? '' : e)}
                        style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                      >
                        <Text style={styles.emojiChar}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={styles.sectionLabel}>{t.day_tags_label}</Text>
                  <View style={styles.tagWrap}>
                    {DAY_TAGS.map(({ id, label }) => {
                      const selected = tags.includes(id);
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => toggleTag(id)}
                          style={[styles.tag, selected && styles.tagActive]}
                        >
                          <Text style={[styles.tagText, selected && styles.tagTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {section === 'notes' && (
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t.day_notes_placeholder}
                placeholderTextColor={c.slate400}
                multiline
                style={[styles.textInput, styles.textArea]}
                textAlignVertical="top"
              />
            )}

            {section === 'dreams' && (
              <View style={{ gap: 8 }}>
                <Text style={styles.dreamsSubtitle}>
                  {t.day_dreams_subtitle}
                </Text>
                <TextInput
                  value={dreams}
                  onChangeText={setDreams}
                  placeholder={t.day_dreams_placeholder}
                  placeholderTextColor={c.slate400}
                  multiline
                  style={[styles.textInput, styles.textArea, styles.textAreaItalic]}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} accessibilityRole="button">
            <Text style={styles.saveBtnText}>{t.day_modal_save(day)}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(c: ThemeColors & { isDark: boolean }) {
  const subtleText = c.isDark ? '#7A6E78' : '#9090a8';
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheetWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 36,
      maxHeight: '90%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.slate200,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dayDot: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 2,
      borderColor: c.slate200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayEmoji: {
      fontSize: 18,
    },
    dayTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
    },
    dateStr: {
      fontSize: 11,
      color: subtleText,
      textTransform: 'capitalize',
    },
    moonLabel: {
      fontSize: 11,
      color: subtleText,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 14,
    },
    tab: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: c.slate100,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: c.indigo,
    },
    tabText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.slate400,
    },
    tabTextActive: {
      color: '#fff',
    },
    content: {
      flex: 1,
    },
    textInput: {
      borderWidth: 1.5,
      borderColor: c.slate200,
      borderRadius: 12,
      padding: 12,
      fontSize: 13,
      color: c.text,
      backgroundColor: c.bgSubtle,
    },
    textArea: {
      minHeight: 160,
    },
    textAreaItalic: {
      fontStyle: 'italic',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    colorDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorDotSelected: {
      borderColor: c.text,
      transform: [{ scale: 1.12 }],
    },
    colorPreviewDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.slate200,
    },
    clearText: {
      fontSize: 12,
      color: c.slate400,
      fontWeight: '600',
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.slate400,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    emojiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    emojiBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.slate100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emojiBtnActive: {
      backgroundColor: c.lavender,
    },
    emojiChar: {
      fontSize: 20,
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: c.slate200,
    },
    tagActive: {
      borderColor: c.indigo,
      backgroundColor: c.lavender,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: c.slate400,
    },
    tagTextActive: {
      color: c.indigo,
    },
    dreamsSubtitle: {
      fontSize: 12,
      color: subtleText,
      fontStyle: 'italic',
    },
    saveBtn: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.indigo,
      alignItems: 'center',
      shadowColor: c.indigo,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
