import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { ChildSwitcher } from '@/components/parent/child-switcher';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { MatchLimit } from '@/components/parent/match-limit';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { TeacherMatchCard } from '@/components/parent/teacher-match-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts } from '@/constants/theme';
import { matchScore, MAX_SKIPS, SKILL_LABELS, type Teacher } from '@/data/teachers';
import {
  connectTeacher,
  isDemoMatching,
  loadMatches,
  resetDemoMatching,
  shownFor,
  skipTeacher,
  useMatching,
} from '@/lib/matching-store';
import { showAlert } from '@/lib/dialog';
import { usePlus } from '@/lib/membership-store';
import { useChildren } from '@/lib/children-store';

export default function CariTeacherScreen() {
  const children = useChildren();
  const matching = useMatching();
  const [child, setChild] = useState(children[0]);
  const [compare, setCompare] = useState<string[]>([]);
  const [showLast, setShowLast] = useState(false);

  const plus = usePlus();

  // daftar teacher paling cocok dihitung server, dimuat ulang saat anak diganti
  useEffect(() => {
    if (child) loadMatches(child);
  }, [child]);

  if (!child) {
    return (
      <Screen header={<ScreenHeader title="Teacher Matching" />}>
        <EmptyState title="Belum ada data anak" subtitle="Lengkapi profil anak dulu untuk mencari shadow teacher." />
      </Screen>
    );
  }
  const list = shownFor(matching, child);

  // pengguna Plus bebas skip tanpa batas (server mengirim skipsLeft null)
  const skipsLeft = plus || matching.skipsLeft === null ? Infinity : matching.skipsLeft;
  const limitReached = skipsLeft <= 0 && !showLast;

  // akun demo: ulang alur lewati 5× → halaman batas dari awal
  const demo = isDemoMatching();
  const resetDemo = () => {
    setShowLast(false);
    setCompare([]);
    resetDemoMatching(child);
  };

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));

  const skip = (teacher: Teacher) => {
    setCompare((c) => c.filter((x) => x !== teacher.id));
    skipTeacher(child, teacher);
  };

  const connect = (teacher: Teacher) => {
    if (matching.connected.includes(teacher.id)) {
      connectTeacher(teacher, child);
      return;
    }
    showAlert('Kirim penawaran?', `Kami akan mengirim pesan penawaran ke ${teacher.name} untuk ${child.name}.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kirim', onPress: () => connectTeacher(teacher, child) },
    ]);
  };

  return (
    <Screen
      header={<ScreenHeader title="Teacher Matching" />}
      edges={['top', 'bottom']}
      footer={
        !limitReached && compare.length > 0 ? (
          <View style={styles.footer}>
            <AppText variant="caption" style={styles.flex}>
              {compare.length === 1 ? 'Pilih 1 teacher lagi untuk dibandingkan' : '2 teacher siap dibandingkan'}
            </AppText>
            <PrimaryButton
              title={`Bandingkan (${compare.length}/2)`}
              icon="bar-chart-2"
              disabled={compare.length < 2}
              onPress={() =>
                router.push({
                  pathname: '/bandingkan-teacher',
                  params: { a: compare[0], b: compare[1], child: child.id },
                })
              }
            />
          </View>
        ) : undefined
      }>
      {limitReached ? (
        <MatchLimit onShowLast={() => setShowLast(true)} onResetDemo={demo ? resetDemo : undefined} />
      ) : (
        <>
          <ChildSwitcher
            value={child}
            onChange={(c) => {
              setChild(c);
              setCompare([]);
            }}
          />

          <ClayCard tone="blue" style={styles.info}>
            <AppText style={styles.infoTitle}>5 teacher paling cocok untuk {child.name}</AppText>
            <AppText variant="caption" color={Colors.text}>
              Dipilih berdasarkan kebutuhan {child.needs.map((n) => SKILL_LABELS[n]).join(' & ')}, rating, dan lokasi
              ({child.city}).
            </AppText>
            <View style={styles.infoRow}>
              <Pill
                label={plus ? 'Skip tanpa batas · Plus' : `Sisa skip hari ini: ${Math.max(skipsLeft, 0)}/${MAX_SKIPS}`}
                tone={skipsLeft > 1 ? 'blue' : 'red'}
                icon="refresh-cw"
                style={styles.white}
              />
              <View style={styles.hint}>
                <Feather name="bar-chart-2" size={14} color={Colors.primaryDark} />
                <AppText variant="caption" color={Colors.primaryDark}>
                  Centang 2 untuk bandingkan
                </AppText>
              </View>
            </View>
            {demo ? (
              <Pressable onPress={resetDemo} hitSlop={8} style={styles.reset}>
                <Feather name="rotate-ccw" size={14} color={Colors.primary} />
                <AppText variant="caption" style={styles.resetText}>
                  Ulang demo skip
                </AppText>
              </Pressable>
            ) : null}
          </ClayCard>

          {list.map((t) => (
            <Animated.View
              key={t.id}
              entering={FadeIn.duration(350)}
              exiting={FadeOutLeft.duration(250)}
              layout={LinearTransition}>
              <TeacherMatchCard
                teacher={t}
                match={matchScore(t, child)}
                comparing={compare.includes(t.id)}
                connected={matching.connected.includes(t.id)}
                canSkip={skipsLeft > 0}
                onToggleCompare={() => toggleCompare(t.id)}
                onSkip={() => skip(t)}
                onConnect={() => connect(t)}
              />
            </Animated.View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  info: {
    gap: 8,
  },
  infoTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  resetText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
