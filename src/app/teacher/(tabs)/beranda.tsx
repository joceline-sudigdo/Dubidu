import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { SectionHeader } from '@/components/parent/screen-header';
import { CheckinCard } from '@/components/shared/checkin-card';
import { DoobieCard } from '@/components/shared/doobie-card';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { bannerPhotos } from '@/data/images';
import { activeApplications, students, teacherProfile as me, todaySchedule } from '@/data/teacher';

const STATUS_LABEL = { pending: 'Pending', accepted: 'Diterima', rejected: 'Ditolak' } as const;
const STATUS_COLOR = { pending: Colors.textSecondary, accepted: Colors.green, rejected: Colors.red } as const;

export default function TeacherBerandaScreen() {
  const [studentId, setStudentId] = useState(students[0].id);
  const student = students.find((s) => s.id === studentId) ?? students[0];
  const progress = me.target.done / me.target.total;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.helloRow}>
            <AppText style={styles.hello}>
              Halo, <AppText style={[styles.hello, { color: Colors.primary }]}>{me.shortName}</AppText>
            </AppText>
            <View style={[styles.verified, Shadow.soft]}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.primary} />
              <AppText style={styles.verifiedText}>Verified</AppText>
            </View>
          </View>
          <AppText variant="caption">Siap membantu anak-anak hari ini?</AppText>
        </View>
        <Pressable
          accessibilityLabel="Notifikasi"
          onPress={() => router.push('/teacher/notifikasi')}
          style={[styles.bell, Shadow.soft]}>
          <Feather name="bell" size={20} color={Colors.primary} />
          <View style={styles.bellDot} />
        </Pressable>
        <Pressable accessibilityLabel="Profil" onPress={() => router.push('/teacher/profil')}>
          <Avatar name={me.name} size={40} ring="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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
      </ScrollView>

      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.hero, Shadow.clay]}>
        {bannerPhotos.teacherHome ? (
          <>
            <Image source={bannerPhotos.teacherHome} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(30, 82, 138, 0.1)', 'rgba(30, 82, 138, 0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={styles.heroDecor} />
        )}
        <AppText style={styles.heroTitle}>Yuk, cari anak yang butuh bantuan!</AppText>
        <View style={styles.heroBottom}>
          <AppText style={styles.heroSub}>Lihat profil kebutuhan anak dan ajukan diri sekarang.</AppText>
          <Pressable onPress={() => router.push('/teacher/cari-anak')} style={[styles.heroButton, Shadow.soft]}>
            <AppText style={styles.heroButtonText}>Mulai cari</AppText>
            <Feather name="arrow-right" size={18} color={Colors.text} />
          </Pressable>
        </View>
      </LinearGradient>

      <SectionHeader title="Jadwal kamu" />
      <ClayCard onPress={() => router.push('/teacher/jadwal')} style={styles.schedule}>
        <View style={styles.scheduleIcon}>
          <Feather name="calendar" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.bold}>Jadwal Hari Ini</AppText>
          <AppText variant="caption" color={Colors.text}>
            {todaySchedule.time} • Sesi dengan <AppText style={styles.boldSmall}>{todaySchedule.child}!</AppText>
          </AppText>
        </View>
        <View style={styles.inline}>
          <AppText variant="link" style={styles.small}>
            Detail
          </AppText>
          <Feather name="chevron-right" size={16} color={Colors.primary} />
        </View>
      </ClayCard>

      <SectionHeader title="Pengajuan Aktif" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.apps}>
        {activeApplications.map((a) => (
          <Pressable key={a.id} onPress={() => router.push('/teacher/riwayat')} style={[styles.appCard, Shadow.button]}>
            <View style={styles.inline}>
              <BearAvatar gender={a.gender} size={36} />
              <View>
                <AppText style={styles.appName}>{a.initials}</AppText>
                <AppText style={styles.appInfo}>{a.info}</AppText>
              </View>
            </View>
            <View style={styles.appStatus}>
              <AppText style={[styles.appStatusText, { color: STATUS_COLOR[a.status] }]}>
                {STATUS_LABEL[a.status]}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.stats}>
        <ClayCard style={styles.stat}>
          <View style={styles.inline}>
            <Feather name="credit-card" size={15} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary}>
              Pendapatan
            </AppText>
          </View>
          <AppText style={styles.statValue}>{me.earnings.total}</AppText>
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
          <AppText style={styles.statValue}>{me.target.done}</AppText>
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
        topics={['Laporan harian', 'Jadwal sesi', 'Tips pendampingan']}
      />

      <CheckinCard childName={student.name} />
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
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
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
  hero: {
    borderRadius: Radius.lg,
    padding: 22,
    minHeight: 180,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    gap: 10,
  },
  heroDecor: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 27,
    color: '#FFFFFF',
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroSub: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroButtonText: {
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
  },
  appCard: {
    width: 170,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
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
