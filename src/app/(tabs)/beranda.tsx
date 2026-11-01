import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { SectionHeader } from '@/components/parent/screen-header';
import { CheckinCard } from '@/components/shared/checkin-card';
import { HeroBanner } from '@/components/shared/hero-banner';
import { PlusCard } from '@/components/shared/plus-card';
import { DoobieCard } from '@/components/shared/doobie-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { bannerPhotos } from '@/data/images';
import { activeTeachers, parentProfile, quickQuestion } from '@/data/parent';
import { startAddChild } from '@/lib/add-child';
import { useChildren } from '@/lib/children-store';
import { useObservations } from '@/lib/observation-store';

export default function BerandaScreen() {
  const children = useChildren();
  const observations = useObservations();
  // laporan observasi psikolog yang belum dibaca (paling baru)
  const latestObs = observations.reports.find((r) => observations.isNew(r.id));
  const [childId, setChildId] = useState(children[0].id);
  const [answered, setAnswered] = useState<string | null>(null);
  const [quickDone, setQuickDone] = useState(false);
  const child = children.find((c) => c.id === childId) ?? children[0];

  // tampilkan "jawaban terkirim" sebentar sebelum kartunya diganti check-in
  const answer = (text: string) => {
    setAnswered(text);
    setTimeout(() => setQuickDone(true), 1200);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText style={styles.hello}>
            Halo, <AppText style={[styles.hello, { color: Colors.primary }]}>{parentProfile.name}</AppText>
          </AppText>
          <AppText variant="caption">Semoga hari ini menyenangkan untuk {child.name}.</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifikasi"
          onPress={() => router.push('/notifikasi')}
          style={[styles.bell, Shadow.soft]}>
          <Feather name="bell" size={20} color={Colors.primary} />
          <View style={styles.bellDot} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Profil" onPress={() => router.push('/profil')}>
          <Avatar name={parentProfile.fullName} size={40} ring="#FFFFFF" />
        </Pressable>
      </View>

      <EdgeScroll contentContainerStyle={styles.childRow}>
        {children.map((c) => {
          const active = c.id === childId;
          return (
            <Pressable
              key={c.id}
              onPress={() => setChildId(c.id)}
              style={[styles.childChip, active && styles.childChipActive, active && Shadow.button]}>
              <Avatar name={c.fullName} size={30} />
              <AppText style={[styles.childName, active && { color: '#FFFFFF' }]}>{c.name}</AppText>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityLabel="Tambah anak"
          onPress={startAddChild}
          style={styles.addChild}>
          <Feather name="plus" size={18} color={Colors.textSecondary} />
        </Pressable>
      </EdgeScroll>

      <HeroBanner
        title={`Temukan shadow teacher untuk ${child.name}!`}
        photo={bannerPhotos.parentHome}
        onPress={() => router.push('/cari-teacher')}
      />

      {/* respon cepat tampil dulu, setelah dijawab memudar lalu diganti check-in */}
      {quickDone ? (
        <Animated.View key="checkin" entering={FadeIn.delay(200).duration(350)}>
          <CheckinCard />
        </Animated.View>
      ) : (
        <Animated.View key="quick" exiting={FadeOut.duration(250)} style={styles.quickBlock}>
          <SectionHeader title="Respon cepat" />
          <ClayCard>
            <View style={styles.quickRow}>
              <Avatar name={quickQuestion.from} size={40} />
              <View style={styles.flex}>
                <AppText variant="caption">{quickQuestion.from}, bertanya</AppText>
                <AppText style={styles.quickText}>{quickQuestion.text}</AppText>
              </View>
            </View>
            {answered ? (
              <View style={styles.answered}>
                <Feather name="check-circle" size={16} color={Colors.green} />
                <AppText variant="caption" color={Colors.green}>
                  Jawaban terkirim: {answered}
                </AppText>
              </View>
            ) : (
              <View style={styles.quickActions}>
                <PrimaryButton title="Ya, boleh!" onPress={() => answer('Ya, boleh!')} style={styles.quickBtn} />
                <Pressable onPress={() => answer('Tidak hari ini')} style={[styles.quickBtn, styles.quickBtnAlt]}>
                  <AppText style={styles.quickAltText}>Tidak hari ini</AppText>
                </Pressable>
              </View>
            )}
          </ClayCard>
          <View style={styles.quickHint}>
            <Feather name="info" size={13} color={Colors.textSecondary} />
            <AppText variant="caption" style={styles.flex}>
              Check-in harian (klaim ikan) muncul setelah respon cepat ini kamu jawab.
            </AppText>
          </View>
        </Animated.View>
      )}

      <SectionHeader title="Teacher saat ini" />
      <EdgeScroll contentContainerStyle={styles.teacherRow}>
        {activeTeachers.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: t.id } })}
            style={[styles.teacherCard, Shadow.button]}>
            <View style={styles.teacherTop}>
              <Avatar name={t.name} size={34} ring="#FFFFFF" />
              <View>
                <View style={styles.teacherNameRow}>
                  <AppText style={styles.teacherName}>{t.name}</AppText>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" />
                </View>
                <AppText style={styles.teacherNext}>Sesi berikutnya:</AppText>
              </View>
            </View>
            <View style={styles.teacherTime}>
              <AppText style={styles.teacherTimeText}>{t.next}</AppText>
            </View>
          </Pressable>
        ))}
      </EdgeScroll>

      <Pressable onPress={() => router.push('/konsultasi')} style={[styles.psy, Shadow.clay]}>
        <View style={styles.psyIcon}>
          <MaterialCommunityIcons name="stethoscope" size={24} color={Colors.red} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.psyTitle}>Konsultasi Psikolog</AppText>
          <AppText style={styles.psySub}>Jadwalkan sesi evaluasi tumbuh kembang</AppText>
        </View>
        <Feather name="chevron-right" size={22} color="#FFFFFF" />
      </Pressable>

      {latestObs && (
        <ClayCard onPress={() => router.push({ pathname: '/observasi/[id]', params: { id: latestObs.id } })} style={styles.obs}>
          <View style={styles.obsIcon}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={Colors.red} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.obsTitle}>Laporan observasi baru</AppText>
            <AppText variant="caption" numberOfLines={1}>
              {latestObs.psychologist.split(',')[0]} · untuk {latestObs.child}
            </AppText>
          </View>
          <Pill label="Baca" tone="red" solid icon="arrow-right" iconRight />
        </ClayCard>
      )}

      <DoobieCard
        message="Temukan pendamping yang tepat, pantau perkembangan si kecil dan dapatkan dukungan dalam setiap langkah tumbuh kembangnya."
      />

      <PlusCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  childRow: {
    gap: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  childChipActive: {
    backgroundColor: Colors.primary,
  },
  childName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  addChild: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBlock: {
    gap: 16,
  },
  quickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quickText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickBtn: {
    flex: 1,
    height: 46,
  },
  quickBtnAlt: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAltText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  answered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  teacherRow: {
    gap: 12,
    paddingBottom: 12,
    paddingRight: 4,
  },
  teacherCard: {
    width: 180,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 14,
    gap: 10,
  },
  teacherTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  teacherNext: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  teacherTime: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 4,
    alignItems: 'center',
  },
  teacherTimeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  psy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.red,
    borderRadius: Radius.lg,
    padding: 18,
  },
  obs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.redSoft,
  },
  obsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obsTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  psyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  psyTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  psySub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});
