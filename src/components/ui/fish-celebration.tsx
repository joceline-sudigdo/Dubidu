import { Image } from 'expo-image';
import { useEffect, useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

const FISH = require('@/assets/images/icons/ikan.png');

// ===== store kecil: panggil celebrateFish(25) dari mana saja =====
let current: { amount: number; title: string; key: number } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function celebrateFish(amount: number, title = 'Yeay, ikan didapat!') {
  current = { amount, title, key: Date.now() };
  emit();
}

function close() {
  current = null;
  emit();
}

function useCelebration() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}

// dipasang sekali di root layout
export function FishCelebrationHost() {
  const data = useCelebration();
  return (
    <Modal visible={!!data} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      {data && <Celebration key={data.key} amount={data.amount} title={data.title} />}
    </Modal>
  );
}

function Celebration({ amount, title }: { amount: number; title: string }) {
  const { width, height } = useWindowDimensions();
  const pop = useSharedValue(0);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    pop.value = withSpring(1, { damping: 12, stiffness: 160 });
    wiggle.value = withDelay(400, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(-1, { duration: 500 })), -1, true));
  }, [pop, wiggle]);

  const fishStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }, { rotate: `${wiggle.value * 8}deg` }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ translateY: (1 - pop.value) * 30 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      {/* hujan ikan kecil */}
      {Array.from({ length: 14 }, (_, i) => (
        <FlyingFish key={i} index={i} width={width} height={height} />
      ))}
      <Animated.View style={[styles.card, Shadow.clay, cardStyle]}>
        <Animated.View style={[styles.fishWrap, fishStyle]}>
          <Image source={FISH} style={styles.bigFish} contentFit="contain" />
        </Animated.View>
        <AppText style={styles.amount}>+{amount} Ikan</AppText>
        <AppText style={styles.title}>{title}</AppText>
        <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
          Kumpulkan terus ikanmu dan tukar dengan hadiah menarik di Doobie Rewards.
        </AppText>
        <Pressable onPress={close} style={[styles.button, Shadow.button]}>
          <AppText style={styles.buttonText}>Asik! 🎉</AppText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function FlyingFish({ index, width, height }: { index: number; width: number; height: number }) {
  const t = useSharedValue(0);
  // posisi & arah tiap ikan dibuat beda-beda dari index
  const startX = ((index * 37) % 100) / 100 * width;
  const drift = ((index % 2 ? 1 : -1) * (30 + ((index * 13) % 60)));
  const size = 26 + ((index * 7) % 22);

  useEffect(() => {
    t.value = withDelay((index * 90) % 700, withTiming(1, { duration: 1600 + ((index * 53) % 700), easing: Easing.out(Easing.quad) }));
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: startX + drift * t.value },
      { translateY: height + 40 - t.value * (height * 0.9) },
      { rotate: `${(index % 2 ? 1 : -1) * t.value * 180}deg` },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.flying, style]}>
      <Image source={FISH} style={{ width: size, height: size * 0.67 }} contentFit="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 50, 80, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  flying: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 24,
  },
  fishWrap: {
    position: 'absolute',
    top: -60,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.yellowSoft,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigFish: {
    width: 96,
    height: 64,
  },
  amount: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    color: Colors.primary,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export const FishIcon = ({ size = 18 }: { size?: number }) => (
  <View>
    <Image source={FISH} style={{ width: size * 1.5, height: size }} contentFit="contain" />
  </View>
);
