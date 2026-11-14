import Feather from '@expo/vector-icons/Feather';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';

type Props = {
  label: string;
  placeholder?: string;
  /** format DD/MM/YYYY */
  value: string;
  onChange: (value: string) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');
const format = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function parse(value: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

/** "21/05/2016" → "2016-05-21" (format yang diterima backend); kosong/tidak valid → undefined */
export function toIsoDate(value?: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value : undefined;
}

export function DateField({ label, placeholder = 'Pilih tanggal', value, onChange }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(() => parse(value) ?? new Date(2018, 0, 1));
  const today = new Date();

  const open = () => {
    const current = parse(value) ?? new Date(2018, 0, 1);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: today,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(format(date));
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  // date picker native belum ada di web, jadi pakai ketikan
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <View style={styles.field}>
          <Feather name="calendar" size={22} color={Colors.textSecondary} />
          <TextInput
            value={value}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, '').slice(0, 8);
              onChange([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/'));
            }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={Colors.placeholder}
            style={styles.webInput}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} style={styles.field}>
        <Feather name="calendar" size={22} color={Colors.textSecondary} />
        <AppText style={[styles.value, !value && { color: Colors.placeholder }]}>{value || placeholder}</AppText>
        <Feather name="chevron-down" size={20} color={Colors.textSecondary} />
      </Pressable>

      <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
        <View style={styles.sheet}>
          <AppText style={styles.sheetTitle}>{label}</AppText>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            maximumDate={today}
            locale="id-ID"
            themeVariant="light"
            onChange={(_, date) => date && setDraft(date)}
          />
          <PrimaryButton
            title="Simpan"
            onPress={() => {
              onChange(format(draft));
              setIosOpen(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
  },
  field: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  value: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
  },
  webInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(34, 50, 74, 0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 8,
  },
  sheetTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    textAlign: 'center',
  },
});
