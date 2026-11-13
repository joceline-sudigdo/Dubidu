import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { ChildMatchCard } from '@/components/parent/child-match-card';
import { ClayCard } from '@/components/parent/clay-card';
import { MatchLimit } from '@/components/parent/match-limit';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts } from '@/constants/theme';
import { CHILD_MAX_SKIPS, childMatchScore, teacherProfile, type SeekingChild } from '@/data/teacher';
import {
  connectChild,
  isDemoChildMatching,
  loadChildMatches,
  resetDemoChildMatching,
  shownChildren,
  skipChild,
  useChildMatching,
} from '@/lib/child-matching-store';
import { showAlert } from '@/lib/dialog';
import { usePlus } from '@/lib/membership-store';

export default function CariAnakScreen() {
  const matching = useChildMatching();
  const [compare, setCompare] = useState<string[]>([]);
  const [showLast, setShowLast] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const list = shownChildren(matching);
  const plus = usePlus();

  useEffect(() => {
    loadChildMatches();
  }, []);

  // pengguna Plus bebas skip tanpa batas (server mengirim skipsLeft null)
  const skipsLeft = plus || matching.skipsLeft === null ? Infinity : matching.skipsLeft;
  const limitReached = skipsLeft <= 0 && !showLast;

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));

  const skip = (child: SeekingChild) => {
    setCompare((c) => c.filter((x) => x !== child.id));
    skipChild(child);
  };

  // akun demo: ulang alur lewati 5× → halaman batas dari awal
  const demo = isDemoChildMatching();
  const resetDemo = () => {
    setShowLast(false);
    setCompare([]);
    resetDemoChildMatching();
  };

  const send = async (child: SeekingChild) => {
    setConnecting(child.id);
    try {
      await connectChild(child);
    } finally {
      setConnecting(null);
    }
  };

  const connect = (child: SeekingChild) => {
    if (connecting) return;
    if (matching.connected.includes(child.id)) {
      send(child);
      return;
    }
    showAlert('Ajukan diri?', `Kami akan mengirim pesan perkenalan ke ${child.parent} (orang tua ${child.initials}).`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kirim', onPress: () => send(child) },
    ]);
  };

  return (
    <Screen
      header={<ScreenHeader title="Child Matching" />}
      edges={['top', 'bottom']}
      footer={
        !limitReached && compare.length > 0 ? (
          <View style={styles.footer}>
            <AppText variant="caption" style={styles.flex}>
              {compare.length === 1 ? 'Pilih 1 anak lagi untuk dibandingkan' : '2 anak siap dibandingkan'}
            </AppText>
            <PrimaryButton
              title={`Bandingkan (${compare.length}/2)`}
              icon="bar-chart-2"
              disabled={compare.length < 2}
              onPress={() =>
                router.push({ pathname: '/teacher/bandingkan-anak', params: { a: compare[0], b: compare[1] } })
              }
            />
          </View>
        ) : undefined
      }>
      {limitReached ? (
        <MatchLimit
          noun="anak"
          homeHref="/teacher/beranda"
          onShowLast={() => setShowLast(true)}
          onResetDemo={demo ? resetDemo : undefined}
        />
      ) : (
        <>
          <ClayCard tone="blue" style={styles.info}>
            <AppText style={styles.infoTitle}>5 anak paling cocok dengan keahlianmu</AppText>
            <AppText variant="caption" color={Colors.text}>
              Dipilih berdasarkan spesialisasi kamu ({teacherProfile.title.replace('Spesialis ', '')}), lokasi (
              {teacherProfile.city}), dan rating orang tua. Identitas anak ditampilkan dengan inisial.
            </AppText>
            <View style={styles.infoRow}>
              <Pill
                label={plus ? 'Skip tanpa batas · Plus' : `Sisa skip hari ini: ${Math.max(skipsLeft, 0)}/${CHILD_MAX_SKIPS}`}
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

          {list.map((c) => (
            <Animated.View
              key={c.id}
              entering={FadeIn.duration(350)}
              exiting={FadeOutLeft.duration(250)}
              layout={LinearTransition}>
              <ChildMatchCard
                child={c}
                match={childMatchScore(c)}
                comparing={compare.includes(c.id)}
                connected={matching.connected.includes(c.id)}
                canSkip={skipsLeft > 0}
                connecting={connecting === c.id}
                onToggleCompare={() => toggleCompare(c.id)}
                onSkip={() => skip(c)}
                onConnect={() => connect(c)}
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
