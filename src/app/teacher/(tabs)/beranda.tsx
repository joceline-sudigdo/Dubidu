import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { SectionHeader } from '@/components/parent/screen-header';
import { CheckinCard } from '@/components/shared/checkin-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PlusCard } from '@/components/shared/plus-card';
import { DoobieCard } from '@/components/shared/doobie-card';
import { AppText } from '@/components/ui/app-text';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { useUnreadCount } from '@/lib/notification-store';
import { bannerPhotos } from '@/data/images';
import { activeApplications, students, teacherProfile as me, todaySchedule } from '@/data/teacher';

const STATUS_LABEL = { pending: 'Pending', accepted: 'Diterima', rejected: 'Ditolak' } as const;
const STATUS_COLOR = { pending: Colors.textSecondary, accepted: Colors.green, rejected: Colors.red } as const;

export default function TeacherBerandaScreen() {
  // titik merah lonceng hanya muncul kalau masih ada notifikasi yang belum dibaca
  const hasUnread = useUnreadCount() > 0;
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  // target 0 (akun baru) jangan sampai jadi NaN% di progress bar
  const progress = me.target.total > 0 ? Math.min(1, me.target.done / me.target.total) : 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.helloRow}>
            <AppText style={styles.hello}>
              Halo, <AppText style={[styles.hello, { color: Colors.primary }]}>{me.shortName}</AppText>
            </AppText>
            {me.verified && (
              <MaterialCommunityIcons
                accessibilityLabel="Terverifikasi"
                name="check-decagram"
                size={24}
                color={Colors.primary}
              />
            )}
          </View>
          <AppText variant="caption">
            {me.verified
              ? 'Siap membantu anak-anak hari ini?'
              : 'Profilmu sedang diverifikasi tim Dubidu. Lengkapi profil & dokumen sambil menunggu.'}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Notifikasi"
          onPress={() => router.push('/teacher/notifikasi')}
          style={[styles.bell, Shadow.soft]}>
          <Feather name="bell" size={20} color={Colors.primary} />
          {hasUnread && <View style={styles.bellDot} />}
        </Pressable>
        <Pressable accessibilityLabel="Profil" onPress={() => router.push('/teacher/profil')}>
          <Avatar name={me.name} size={40} ring="#FFFFFF" />
        </Pressable>
      </View>

      <EdgeScroll contentContainerStyle={styles.chips}>
        {students.map((s) => {
          const active = s.id === studentId;
          return (
            <Pressable
              key={s.id}
              onPress={() => setStudentId(s.id)}
              style={[styles.chip, active && styles.chipActive, active && Shadow.button]}>
              <BearAvatar gender={s.gender} size={32} />
              <AppText style={[styles.chipName, active && { color: '#FFFFFF' }]}>{s.name}</AppText>
            </Pressable>
          );
        })}
      </EdgeScroll>

      <HeroBanner
        title="Yuk, cari anak yang butuh bantuan!"
        subtitle="Lihat profil kebutuhan anak dan ajukan diri sekarang."
        photo={bannerPhotos.teacherHome}
        onPress={() => router.push('/teacher/cari-anak')}
      />

      <CheckinCard />

      <SectionHeader title="Jadwal kamu" />
      <ClayCard onPress={() => router.push('/teacher/jadwal')} style={styles.schedule}>
        <View style={styles.scheduleIcon}>
          <Feather name="calendar" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.bold}>Jadwal Hari Ini</AppText>
          {todaySchedule.child ? (
            <AppText variant="caption" color={Colors.text} numberOfLines={2}>
              {todaySchedule.time} • Sesi dengan <AppText style={styles.boldSmall}>{todaySchedule.child}!</AppText>
            </AppText>
          ) : (
            <AppText variant="caption">Belum ada sesi hari ini. Waktunya istirahat!</AppText>
          )}
        </View>
        <View style={styles.inline}>
          <AppText variant="link" style={styles.small}>
            Detail
          </AppText>
          <Feather name="chevron-right" size={16} color={Colors.primary} />
        </View>
      </ClayCard>

      <SectionHeader title="Pengajuan Aktif" />
      <EdgeScroll contentContainerStyle={styles.apps}>
        {activeApplications.map((a) => (
          <Pressable key={a.id} onPress={() => router.push('/teacher/riwayat')} style={[styles.appCard, Shadow.button]}>
            <View style={styles.appTop}>
              <BearAvatar gender={a.gender} size={36} />
              <View style={styles.appText}>
                <AppText style={styles.appName} numberOfLines={1}>
                  {a.initials}
                </AppText>
                <AppText style={styles.appInfo} numberOfLines={2}>
                  {a.info}
                </AppText>
              </View>
            </View>
            <View style={styles.appStatus}>
              <AppText style={[styles.appStatusText, { color: STATUS_COLOR[a.status] }]}>
                {STATUS_LABEL[a.status]}
              </AppText>
            </View>
          </Pressable>
        ))}
      </EdgeScroll>

      <View style={styles.stats}>
        <ClayCard onPress={() => router.push('/pencairan')} style={styles.stat}>
          <View style={styles.inline}>
            <Feather name="credit-card" size={15} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary}>
              Pendapatan
            </AppText>
          </View>
          <AppText style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {me.earnings.total}
          </AppText>
          <View style={styles.inline}>
            <Feather name="arrow-up" size={14} color={Colors.green} />
            <AppText variant="caption" color={Colors.green}>
              {me.earnings.growth}
            </AppText>
          </View>
        </ClayCard>
        <ClayCard style={styles.stat}>
          <View style={styles.inline}>
            <Feather name="check-circle" size={15} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary}>
              Sesi selesai
            </AppText>
          </View>
          <AppText style={styles.statValue} numberOfLines={1}>
            {me.target.done}
          </AppText>
          <View style={styles.targetRow}>
            <AppText variant="caption">Target: {me.target.total} sesi</AppText>
            <AppText variant="caption">{Math.round(progress * 100)}%</AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </ClayCard>
      </View>

      <DoobieCard
        message="Cek rekomendasi murid baru, kelola laporan harian, atau konsultasi modul belajar bersama Doobie AI."
      />

      <PlusCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  boldSmall: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  small: {
    fontSize: 14,
  },
  // badge Verified turun ke baris bawah kalau nama terlalu panjang
  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  hello: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
  chips: {
    gap: 10,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apps: {
    gap: 12,
    paddingBottom: 12,
    alignItems: 'stretch',
  },
  // semua kartu setinggi kartu tertinggi; label status selalu menempel di bawah supaya sejajar
  appCard: {
    width: 170,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
    justifyContent: 'space-between',
  },
  appTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  appText: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  appInfo: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  appStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 4,
    alignItems: 'center',
  },
  appStatusText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    gap: 8,
    padding: 16,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
