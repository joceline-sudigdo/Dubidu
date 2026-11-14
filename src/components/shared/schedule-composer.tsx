import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';

export type ScheduleOffer = { title: string; date: string; hours: string; place: string };

const TYPES = ['Sesi Observasi Pertama', 'Sesi Uji Coba (Trial)', 'Sesi Pendampingan Rutin'];
const SLOTS = ['08:00 - 11:00', '09:00 - 12:00', '13:00 - 16:00', '15:00 - 17:00'];
const PLACES = ['Sekolah anak', 'Rumah anak', 'Online (video call)'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// 10 hari ke depan mulai besok
const nextDays = () =>
  Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

// lembar bawah pilih jadwal (semua pilihan, tanpa ketik manual kecuali detail lokasi).
// default untuk tawaran jadwal teacher di chat, bisa diubah lewat props (misal interview psikolog)
export function ScheduleComposer({
  visible,
  onClose,
  onSend,
  heading = 'Tawarkan Jadwal',
  submitText = 'Kirim Tawaran',
  types = TYPES,
  slots = SLOTS,
  places = PLACES,
  withDetail = true,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (offer: ScheduleOffer) => void;
  heading?: string;
  submitText?: string;
  types?: string[];
  slots?: string[];
  places?: string[];
  withDetail?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const days = nextDays();
  const [type, setType] = useState(types[Math.min(1, types.length - 1)]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(slots[0]);
  const [place, setPlace] = useState(places[0]);
  const [detail, setDetail] = useState('');

  const send = () => {
    const d = days[day];
    onSend({
      title: type,
      date: `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      hours: `${slot} WIB`,
      place: detail.trim() ? `${place} · ${detail.trim()}` : place,
    });
    setDetail('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <AppText style={styles.title}>{heading}</AppText>
            <Pressable accessibilityLabel="Tutup" hitSlop={8} onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Label text="Jenis sesi" />
            <View style={styles.wrap}>
              {types.map((t) => (
                <Chip key={t} label={t} on={type === t} onPress={() => setType(t)} />
              ))}
            </View>

            <Label text="Tanggal" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {days.map((d, i) => {
                const on = day === i;
                return (
                  <Pressable key={i} onPress={() => setDay(i)} style={[styles.day, on && styles.dayOn]}>
                    <AppText style={[styles.dayName, on && styles.white]}>{DAYS[d.getDay()].slice(0, 3)}</AppText>
                    <AppText style={[styles.dayNum, on && styles.white]}>{d.getDate()}</AppText>
                    <AppText style={[styles.dayName, on && styles.white]}>{MONTHS[d.getMonth()].slice(0, 3)}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Label text="Jam" />
            <View style={styles.wrap}>
              {slots.map((s) => (
                <Chip key={s} label={s} on={slot === s} onPress={() => setSlot(s)} />
              ))}
            </View>

            <Label text="Lokasi" />
            <View style={styles.wrap}>
              {places.map((p) => (
                <Chip key={p} label={p} on={place === p} onPress={() => setPlace(p)} />
              ))}
            </View>
            {withDetail && (
            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="Detail lokasi (opsional), misal SDN Klojen 01"
              placeholderTextColor={Colors.placeholder}
              style={styles.input}
            />
            )}
          </ScrollView>

          <PrimaryButton title={submitText} icon="send" onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({ text }: { text: string }) {
  return <AppText style={styles.label}>{text}</AppText>;
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <AppText style={[styles.chipText, on && styles.white]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(34, 50, 74, 0.45)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    gap: 10,
    paddingBottom: 4,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  white: {
    color: '#FFFFFF',
  },
  days: {
    gap: 8,
  },
  day: {
    width: 58,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
  },
  dayOn: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dayNum: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text,
  },
  input: {
    minHeight: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
});
