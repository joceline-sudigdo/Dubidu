import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { DAYS, MONTHS } from '@/data/parent';
import { psychologistProfile } from '@/data/psychologist';
import { api, errorMessage } from '@/lib/api';
import { showAlert } from '@/lib/dialog';

// Psikolog membuka jam konsultasi (slot 1 jam, WIB). Orang tua hanya bisa memesan jam yang dibuka di sini.

const HOURS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '18:00', '19:00'];
const DAYS_AHEAD = 14;

type Slot = { slotId: string; time: string; status: 'open' | 'last' | 'full' };
type Day = { date: string; times: Slot[] };

const pad = (n: number) => String(n).padStart(2, '0');
// tanggal WIB "YYYY-MM-DD" untuk hari ke-i dari sekarang
function wibDate(offsetDays: number) {
  const d = new Date(Date.now() + 7 * 3600000 + offsetDays * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
const startAt = (date: string, time: string) => `${date}T${time}:00+07:00`;

export function SlotEditor() {
  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => wibDate(i + 1));
  const [date, setDate] = useState(dates[0]);
  const [existing, setExisting] = useState<Record<string, Slot[]>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!psychologistProfile.profileId) return;
    const days = await api<Day[]>(`/psychologists/${psychologistProfile.profileId}/availability?days=${DAYS_AHEAD + 1}`);
    setExisting(Object.fromEntries(days.map((d) => [d.date, d.times])));
  }, []);

  useEffect(() => {
    Promise.resolve()
      .then(load)
      .catch((e) => showAlert('Jadwal belum termuat', errorMessage(e)))
      .finally(() => setLoading(false));
  }, [load]);

  const slotsOfDay = existing[date] ?? [];
  const slotAt = (time: string) => slotsOfDay.find((s) => s.time === time);
  // jam standar + jam lain yang sudah pernah dibuka di tanggal ini (mis. 10:30)
  const hours = [...new Set([...HOURS, ...slotsOfDay.map((s) => s.time)])].sort();

  const toggle = (time: string) => {
    const slot = slotAt(time);
    if (slot?.status === 'full') {
      showAlert('Sudah dipesan', 'Jam ini sudah dibooking orang tua dan tidak bisa diubah.');
      return;
    }
    if (slot) {
      showAlert(`Tutup jam ${time}?`, 'Jam ini tidak akan bisa dipesan lagi.', [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tutup',
          style: 'destructive',
          onPress: () =>
            api(`/psychologists/me/slots/${slot.slotId}`, { method: 'DELETE' })
              .then(load)
              .catch((e) => showAlert('Jam belum ditutup', errorMessage(e))),
        },
      ]);
      return;
    }
    const key = startAt(date, time);
    setPicked((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { created } = await api<{ created: number }>('/psychologists/me/slots', { body: { startAts: picked } });
      setPicked([]);
      await load();
      showAlert('Jadwal dibuka', `${created} jam konsultasi sekarang bisa dipesan orang tua.`);
    } catch (e) {
      showAlert('Jadwal belum tersimpan', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const label = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return { day: DAYS[new Date(y, m - 1, day).getDay()].slice(0, 3), num: day, month: MONTHS[m - 1].slice(0, 3) };
  };

  return (
    <ClayCard style={styles.card}>
      <View style={styles.head}>
        <Feather name="clock" size={18} color={Colors.primary} />
        <AppText style={styles.title}>Buka jam konsultasi</AppText>
      </View>
      <AppText variant="caption">
        Pilih tanggal lalu ketuk jam yang ingin dibuka (sesi 1 jam, WIB). Ketuk jam biru untuk menutupnya lagi.
      </AppText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>
        {dates.map((d) => {
          const l = label(d);
          const active = d === date;
          const count = (existing[d]?.length ?? 0) + picked.filter((p) => p.startsWith(d)).length;
          return (
            <Pressable key={d} onPress={() => setDate(d)} style={[styles.date, active && styles.dateActive]}>
              <AppText style={[styles.dateDay, active && styles.white]}>{l.day}</AppText>
              <AppText style={[styles.dateNum, active && styles.white]}>{l.num}</AppText>
              <AppText style={[styles.dateDay, active && styles.white]}>{count ? `${count} jam` : l.month}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <View style={styles.hours}>
          {hours.map((time) => {
            const slot = slotAt(time);
            const isPicked = picked.includes(startAt(date, time));
            const booked = slot?.status === 'full';
            return (
              <Pressable
                key={time}
                accessibilityRole="button"
                onPress={() => toggle(time)}
                style={[styles.hour, slot && styles.hourOpen, booked && styles.hourBooked, isPicked && styles.hourPicked]}>
                <AppText style={[styles.hourText, (slot || isPicked) && styles.white]}>{time}</AppText>
                {booked && <Feather name="lock" size={11} color="#FFFFFF" />}
                {isPicked && <Feather name="plus" size={11} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.legend}>
        <Legend color={Colors.primary} label="Dibuka" />
        <Legend color={Colors.green} label="Akan dibuka" />
        <Legend color={Colors.red} label="Sudah dipesan" />
      </View>

      <PrimaryButton
        title={saving ? 'Menyimpan…' : picked.length ? `Buka ${picked.length} jam` : 'Pilih jam dulu'}
        icon="check"
        disabled={!picked.length || saving}
        onPress={save}
      />
    </ClayCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  dates: {
    gap: 8,
  },
  date: {
    width: 62,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
  },
  dateActive: {
    backgroundColor: Colors.primary,
  },
  dateDay: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dateNum: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text,
  },
  white: {
    color: '#FFFFFF',
  },
  hours: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hour: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
  },
  hourOpen: {
    backgroundColor: Colors.primary,
  },
  hourBooked: {
    backgroundColor: Colors.red,
  },
  hourPicked: {
    backgroundColor: Colors.green,
  },
  hourText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
