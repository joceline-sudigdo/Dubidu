import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { TagRow } from '@/components/parent/tag-row';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { findContract, nextSessionDates, termins } from '@/data/contracts';
import { DAYS, formatRupiah, MONTHS } from '@/data/parent';
import { loadContract } from '@/lib/contracts-sync';
import { showAlert } from '@/lib/dialog';
import { platformFeeRate, usePlus } from '@/lib/membership-store';
import { getSession } from '@/lib/session';

export default function DetailKontrakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [, setLoaded] = useState(0);
  const [missing, setMissing] = useState(false);
  const contract = findContract(id);
  const isTeacher = getSession().role === 'teacher';
  const fee = platformFeeRate(usePlus());

  // dibuka dari notifikasi sebelum daftar kontrak termuat → ambil langsung dari server
  useEffect(() => {
    if (id && !findContract(id)) {
      loadContract(id)
        .then(() => setLoaded((n) => n + 1))
        .catch(() => setMissing(true));
    }
  }, [id]);

  if (!contract) {
    return (
      <Screen header={<ScreenHeader title="Detail Kontrak" />} fill>
        <EmptyFill>
          {missing ? <EmptyState title="Kontrak tidak ditemukan" /> : <ActivityIndicator color={Colors.primary} />}
        </EmptyFill>
      </Screen>
    );
  }

  const c = contract;
  const progress = c.total > 0 ? Math.min(1, c.done / c.total) : 0;
  // umur anak belum tentu ada di data kontrak server: jangan tampilkan "0 tahun"
  const age = c.childAge > 0 ? ` · ${c.childAge} tahun` : '';
  const parts = termins(c);
  const chatId = isTeacher ? c.parentChatId : c.teacherChatId;

  const extend = () =>
    showAlert(
      'Ajukan perpanjangan?',
      `Kami akan mengirim permintaan perpanjangan ${c.total} sesi ke ${isTeacher ? c.parentName : c.teacherName}.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ajukan',
          onPress: () => showAlert('Perpanjangan diajukan', 'Kamu akan mendapat notifikasi setelah disetujui.'),
        },
      ]
    );

  return (
    <Screen header={<ScreenHeader title="Detail Kontrak" />} edges={['top', 'bottom']}>
      <ClayCard style={styles.gap14}>
        <View style={styles.top}>
          {isTeacher ? (
            <BearAvatar gender={c.gender} size={72} online />
          ) : (
            <Avatar name={c.teacherName} size={72} ring="#FFFFFF" />
          )}
          <View style={styles.flex}>
            <AppText style={styles.name}>
              {isTeacher ? `${c.childName}${age}` : c.teacherName}
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              {isTeacher ? `Orang tua: ${c.parentName}` : `Mendampingi ${c.childName}${age}`}
            </AppText>
          </View>
          <Pill inRow label="Aktif" tone="green" solid size="md" />
        </View>
        <TagRow tags={c.tags} solid max={3} />
        <View style={styles.spaceBetween}>
          <AppText variant="body">
            <AppText style={styles.bold}>
              {c.done} dari {c.total} sesi
            </AppText>{' '}
            · {c.phase}
          </AppText>
          <AppText style={styles.percent}>{Math.round(progress * 1000) / 10}%</AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </ClayCard>

      <AppText style={styles.section}>Rincian Kontrak</AppText>
      <ClayCard style={styles.list}>
        <Row label="Periode" value={c.period} />
        <Row label="Frekuensi" value={`${c.weekdays.length}x seminggu (${c.weekdayLabel})`} />
        <Row label="Durasi" value={c.durationLabel} />
        <Row label="Lokasi" value={c.location} />
        <Row label="Tarif per sesi" value={formatRupiah(c.rate)} />
        <Row label="Nilai kontrak" value={formatRupiah(c.rate * c.total)} last strong />
      </ClayCard>

      <View style={styles.sectionRow}>
        <Feather name="shield" size={20} color={Colors.primary} />
        <AppText style={styles.section}>Pembayaran</AppText>
      </View>
      <ClayCard style={styles.list}>
        <AppText variant="body" color={Colors.textSecondary} style={styles.note}>
          {isTeacher
            ? `Orang tua membayar per termin. Dana ditahan aman oleh Dubidu dan dicairkan setelah sesi & laporan selesai (sudah dipotong biaya platform ${fee * 100}%).`
            : 'Kamu membayar per termin. Dana ditahan aman oleh Dubidu dan baru diteruskan ke teacher setelah sesi & laporan selesai.'}
        </AppText>
        {parts.map((t, i) => {
          const amount = isTeacher ? t.gross * (1 - fee) : t.gross;
          return (
            <View key={t.label} style={[styles.termin, i < parts.length - 1 && styles.border]}>
              <View style={[styles.terminIcon, { backgroundColor: t.paid ? Colors.greenSoft : Colors.yellowSoft }]}>
                <Feather name={t.paid ? 'check-circle' : 'lock'} size={20} color={t.paid ? Colors.green : Colors.yellowDark} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.bold}>
                  {t.label} · {t.sessions}
                </AppText>
                <AppText variant="caption">{formatRupiah(amount)}</AppText>
              </View>
              <Pill
                label={t.paid ? (isTeacher ? 'Dicairkan' : 'Lunas') : 'Ditahan aman'}
                tone={t.paid ? 'green' : 'yellow'}
                size="md"
              />
            </View>
          );
        })}
      </ClayCard>

      <View style={styles.sectionRow}>
        <Feather name="calendar" size={20} color={Colors.primary} />
        <AppText style={styles.section}>Sesi Berikutnya</AppText>
      </View>
      <ClayCard style={styles.list}>
        {nextSessionDates(c).map((d, i, all) => (
          <View key={d.toISOString()} style={[styles.session, i < all.length - 1 && styles.border]}>
            <AppText style={styles.bold}>
              {DAYS[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}
            </AppText>
            <AppText variant="caption">{c.hours}</AppText>
          </View>
        ))}
      </ClayCard>

      <PrimaryButton
        title={isTeacher ? 'Chat Orang Tua' : 'Chat Teacher'}
        leadingIcon="chat"
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chatId } })}
      />
      <Pressable
        onPress={() =>
          isTeacher
            ? router.push({ pathname: '/teacher/laporan', params: { student: c.childId } })
            : router.push('/report-card')
        }
        style={[styles.secondary, Shadow.soft]}>
        <Feather name="edit-3" size={18} color={Colors.primary} />
        <AppText style={styles.secondaryText}>Lihat Report Card</AppText>
      </Pressable>
      <View style={styles.links}>
        <Pressable
          hitSlop={8}
          onPress={() =>
            isTeacher
              ? router.push({ pathname: '/teacher/anak/[id]', params: { id: c.childId } })
              : router.push({ pathname: '/profil-teacher/[id]', params: { id: c.teacherId } })
          }>
          <AppText variant="link">{isTeacher ? 'Lihat profil anak' : 'Lihat profil teacher'}</AppText>
        </Pressable>
        <Pressable hitSlop={8} onPress={extend}>
          <AppText variant="link">Ajukan perpanjangan</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function Row({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap14: {
    gap: 14,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    lineHeight: 26,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  percent: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  section: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 26,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  rowValueStrong: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
  },
  note: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  termin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  terminIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  session: {
    gap: 2,
    paddingVertical: 14,
  },
  secondary: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  secondaryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
