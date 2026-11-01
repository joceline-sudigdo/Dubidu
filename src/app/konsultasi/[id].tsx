import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { consultationTypes, finalPrice, formatRupiah, MONTHS, PROMO_CODE, psychologists } from '@/data/parent';
import { api, errorMessage } from '@/lib/api';
import { getChildren } from '@/lib/children-store';
import { showAlert } from '@/lib/dialog';

// jadwal kosong psikolog per hari (GET /psychologists/:id/availability)
type Day = {
  date: string; // YYYY-MM-DD
  day: string;
  dayOfMonth: number;
  status: 'open' | 'few' | 'full';
  times: { slotId: string; time: string; status: 'open' | 'last' | 'full' }[];
};

const TYPE_ID: Record<string, 'VIDEO' | 'CALL' | 'CHAT'> = { video: 'VIDEO', call: 'CALL', chat: 'CHAT' };

const STATUS_COLOR = { open: Colors.primary, few: Colors.yellow, full: Colors.red } as const;

export default function JadwalKonsultasiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const psychologist = psychologists.find((p) => p.id === id) ?? psychologists[0];
  const shortName = psychologist?.name.split(',')[0] ?? '';
  const [type, setType] = useState('video');
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!psychologist) return;
    api<Day[]>(`/psychologists/${psychologist.id}/availability`)
      .then((list) => {
        setDays(list);
        const first = list.find((d) => d.status !== 'full');
        if (first) {
          setDate(first.date);
          setTime(first.times.find((t) => t.status !== 'full')?.time ?? '');
        }
      })
      .catch((e) => showAlert('Jadwal belum termuat', errorMessage(e)));
  }, [psychologist]);

  const selectedDay = days.find((d) => d.date === date);
  const slot = selectedDay?.times.find((t) => t.time === time && t.status !== 'full');
  const monthLabel = selectedDay ? `${MONTHS[Number(selectedDay.date.slice(5, 7)) - 1]} ${selectedDay.date.slice(0, 4)}` : '';

  // pesan slot (dikunci 1 jam) lalu lanjut ke pembayaran
  const book = async () => {
    if (!slot) return;
    setBooking(true);
    try {
      const { payment } = await api<{ payment: { id: string } }>('/consultations', {
        body: {
          psychologistId: psychologist.id,
          slotId: slot.slotId,
          type: TYPE_ID[type],
          childId: getChildren()[0]?.id,
          complaint: note.trim() || undefined,
        },
      });
      router.push({ pathname: '/pembayaran/[id]', params: { id: payment.id } });
    } catch (e) {
      showAlert('Jadwal belum bisa dipesan', errorMessage(e));
    } finally {
      setBooking(false);
    }
  };

  if (!psychologist) {
    return (
      <Screen header={<ScreenHeader title="Konsultasi Psikolog" />}>
        <EmptyState title="Psikolog tidak ditemukan" subtitle="Belum ada psikolog yang tersedia saat ini." />
      </Screen>
    );
  }
  const total = finalPrice(psychologist);
  const discount = psychologist.basePrice - total;

  return (
    <Screen
      header={<ScreenHeader title="Konsultasi Psikolog" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <View>
            <AppText variant="caption">Total Pembayaran</AppText>
            <AppText style={styles.footerTotal}>{formatRupiah(total)}</AppText>
          </View>
          <PrimaryButton
            title={booking ? 'Memesan…' : 'Lanjut Bayar'}
            icon="arrow-right"
            style={styles.flex}
            disabled={!slot || booking}
            onPress={book}
          />
        </View>
      }>
      <View style={styles.stepRow}>
        <Pill label="Langkah 2 dari 3 : Waktu & Sesi" tone="blue" icon="circle" />
        <View style={styles.inline}>
          <Feather name="shield" size={14} color={Colors.green} />
          <AppText variant="caption" color={Colors.green}>
            Konsultasi Aman
          </AppText>
        </View>
      </View>

      <ClayCard tone="blue" style={styles.psy}>
        <View>
          <Avatar name={psychologist.name} size={64} ring="#FFFFFF" />
          <View style={styles.verified}>
            <MaterialCommunityIcons name="check-decagram" size={20} color={Colors.primary} />
          </View>
        </View>
        <View style={styles.flex}>
          <AppText style={styles.psyName}>{psychologist.name}</AppText>
          <AppText variant="caption">{psychologist.title}</AppText>
          <View style={[styles.inline, { marginTop: 6 }]}>
            <View style={styles.rating}>
              <MaterialCommunityIcons name="star" size={14} color={Colors.yellow} />
              <AppText style={styles.ratingText}>{psychologist.rating}</AppText>
              <AppText variant="caption">({psychologist.reviews} ulasan)</AppText>
            </View>
            <View style={styles.flex} />
            <Pill
              label="Ganti"
              icon="repeat"
              iconRight
              tone="gray"
              onPress={() => router.back()}
              style={styles.whitePill}
            />
          </View>
        </View>
      </ClayCard>

      <SectionHeader title="Jenis Sesi" />
      <View style={styles.row}>
        {consultationTypes.map((t) => {
          const active = t.id === type;
          return (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              style={[styles.typeCard, active ? styles.typeActive : Shadow.soft, active && Shadow.button]}>
              <Feather name={t.icon} size={24} color={active ? '#FFFFFF' : Colors.primary} />
              <AppText style={[styles.typeLabel, active && { color: '#FFFFFF' }]}>{t.label}</AppText>
              <AppText style={[styles.typeHint, active && { color: 'rgba(255,255,255,0.85)' }]}>{t.hint}</AppText>
            </Pressable>
          );
        })}
      </View>
      <ClayCard tone="gray" style={styles.info}>
        <Feather name="clock" size={20} color={Colors.primary} />
        <AppText variant="caption" color={Colors.text} style={styles.flex}>
          <AppText style={styles.infoBold}>Durasi sesi {psychologist.duration} menit</AppText> • Termasuk evaluasi rangkuman sensori &
          rencana tindak lanjut tertulis.
        </AppText>
      </ClayCard>

      <SectionHeader
        title="Pilih Tanggal"
        right={
          <View style={styles.inline}>
            <AppText variant="link">{monthLabel}</AppText>
            <Feather name="calendar" size={16} color={Colors.primary} />
          </View>
        }
      />
      <View style={styles.row}>
        {days.slice(0, 7).map((d) => {
          const active = d.date === date;
          const full = d.status === 'full';
          return (
            <Pressable
              key={d.date}
              disabled={full}
              onPress={() => {
                setDate(d.date);
                setTime(d.times.find((t) => t.status !== 'full')?.time ?? '');
              }}
              style={[styles.dateCard, active ? styles.dateActive : !full && Shadow.soft, full && styles.dateFull]}>
              <AppText style={[styles.dateDay, active && { color: '#FFFFFF' }, full && styles.strike]}>{d.day}</AppText>
              <AppText style={[styles.dateNum, active && { color: '#FFFFFF' }, full && styles.strike]}>{d.dayOfMonth}</AppText>
              <View style={[styles.dateDot, { backgroundColor: active ? '#FFFFFF' : STATUS_COLOR[d.status] }]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <LegendDot color={Colors.primary} label="Dipilih" />
        <LegendDot color={Colors.yellow} label="Sisa < 2 Slot" />
        <LegendDot color={Colors.red} label="Penuh / Libur" />
      </View>

      <SectionHeader
        title="Waktu Sesi"
        right={
          <View style={styles.inline}>
            <Feather name="clock" size={13} color={Colors.textSecondary} />
            <AppText variant="caption">WIB (UTC+7)</AppText>
          </View>
        }
      />
      <View style={styles.timeGrid}>
        {(selectedDay?.times ?? []).map((t) => {
          const active = t.time === time;
          const full = t.status === 'full';
          return (
            <Pressable
              key={t.time}
              disabled={full}
              onPress={() => setTime(t.time)}
              style={[styles.timeCard, active ? styles.timeActive : !full && Shadow.soft, full && styles.timeFull]}>
              {t.status === 'last' && (
                <View style={styles.lastSlot}>
                  <AppText style={styles.lastSlotText}>Sisa 1 Slot</AppText>
                </View>
              )}
              <View style={styles.inline}>
                <AppText
                  style={[styles.timeText, active && { color: '#FFFFFF' }, full && [styles.strike, { color: Colors.red }]]}>
                  {t.time}
                </AppText>
                {full && <Feather name="lock" size={13} color={Colors.red} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={`Catatan Tambahan untuk ${shortName}`} right={<AppText variant="caption">Opsional</AppText>} />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Contoh: Ingin konsultasi mengenai tantrum saat transisi suara bel sekolah dan respon sensori tekstur pakaian..."
        placeholderTextColor={Colors.placeholder}
        style={styles.note}
      />
      <View style={styles.inline}>
        <Feather name="lock" size={13} color={Colors.green} />
        <AppText variant="caption">Catatan dienkripsi dan hanya dibaca oleh psikolog terkait.</AppText>
      </View>

      <ClayCard style={styles.bill}>
        <View style={styles.inline}>
          <MaterialCommunityIcons name="receipt" size={22} color={Colors.primary} />
          <AppText style={styles.billTitle}>Rincian Biaya Sesi</AppText>
        </View>
        <BillRow
          label={`Biaya Sesi (${psychologist.duration} menit)`}
          value={formatRupiah(psychologist.basePrice)}
        />
        {psychologist.discountPercent > 0 && (
          <BillRow
            label={`Dubidu Plus Diskon (${psychologist.discountPercent}%)`}
            value={`-${formatRupiah(discount)}`}
            color={Colors.red}
            icon="tag"
          />
        )}
        <BillRow label={`Kode Promo: ${PROMO_CODE}`} value="-Rp0" color={Colors.primary} icon="gift" />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <View>
            <AppText style={styles.totalLabel}>Total Biaya</AppText>
            <AppText variant="caption">Sudah termasuk PPN</AppText>
          </View>
          <AppText style={styles.totalValue}>{formatRupiah(total)}</AppText>
        </View>
        <View style={styles.guarantee}>
          <Feather name="check-circle" size={18} color={Colors.green} />
          <AppText variant="caption" color={Colors.text} style={styles.flex}>
            Garansi reschedule bebas biaya s.d. 2 jam sebelum sesi berlangsung. Dukungan penuh untuk orang tua hebat!
          </AppText>
        </View>
      </ClayCard>
    </Screen>
  );
}

function BillRow({
  label,
  value,
  color = Colors.text,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: 'tag' | 'gift';
}) {
  return (
    <View style={styles.billRow}>
      <View style={[styles.inline, styles.flex]}>
        {icon && <Feather name={icon} size={15} color={color} />}
        <AppText style={[styles.billText, { color }]}>{label}</AppText>
      </View>
      <AppText style={[styles.billText, { color }]}>{value}</AppText>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.inline}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  psy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  verified: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  psyName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  whitePill: {
    backgroundColor: '#FFFFFF',
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.border,
  },
  typeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  typeLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  typeHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  infoBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  dateCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.border,
  },
  dateActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  dateFull: {
    backgroundColor: Colors.surface,
  },
  dateDay: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateNum: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
  },
  dateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    rowGap: 16,
  },
  timeCard: {
    width: '31%',
    flexGrow: 1,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  timeFull: {
    backgroundColor: Colors.redSoft,
    borderColor: '#F3CFCC',
  },
  timeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.text,
  },
  lastSlot: {
    position: 'absolute',
    top: -11,
    backgroundColor: Colors.yellow,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  lastSlotText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.text,
  },
  note: {
    minHeight: 100,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  bill: {
    gap: 12,
  },
  billTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billText: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
  },
  totalValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.primary,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.md,
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerTotal: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.primary,
  },
});
