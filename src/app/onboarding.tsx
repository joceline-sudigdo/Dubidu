import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts } from '@/constants/theme';
import { markOnboardingSeen } from '@/lib/onboarding-storage';

// angka-angka ini pakai ukuran pixel asli gambar puzzle (1254x1254)
const CANVAS = 1254;
const BODY_WIDTH = 830;
const VISUAL_HEIGHT = 1230;
const ILLUSTRATION_SIZE = 1050;
const ENTRY_DISTANCE = 900;
const SWIPE_THRESHOLD = 60;

type Slide = {
  title: string;
  body: string;
  puzzle: number;
  illustration: number;
  // posisi puzzle, diatur biar knob-nya pas masuk ke puzzle sebelumnya
  x: number;
  y: number;
};

const SLIDES: Slide[] = [
  {
    title: 'Temukan Pendamping yang Tepat',
    body: 'Sistem matching kami mencocokkan kebutuhan si kecil dengan shadow teacher paling sesuai — bukan sekadar berdasarkan lokasi.',
    puzzle: require('@/assets/images/splash/onboarding/puzzle1.png'),
    illustration: require('@/assets/images/splash/onboarding/onboard1.png'),
    x: 0,
    y: 0,
  },
  {
    title: 'Terverifikasi & Terpercaya',
    body: 'Setiap shadow teacher melewati verifikasi berjenjang mulai dari identitas, sertifikat, hingga observasi agar kamu tenang.',
    puzzle: require('@/assets/images/splash/onboarding/puzzle2.png'),
    illustration: require('@/assets/images/splash/onboarding/onboard2.png'),
    x: 845,
    y: 50,
  },
  {
    title: 'Pantau Setiap Kemajuan',
    body: 'Progress journal dan growth timeline membantu kamu melihat kemajuan si kecil dari waktu ke waktu.',
    puzzle: require('@/assets/images/splash/onboarding/puzzle3.png'),
    illustration: require('@/assets/images/splash/onboarding/onboard3.png'),
    x: 1635,
    y: 0,
  },
];

const SLIDE_IN = { duration: 1100, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const SLIDE_OUT = { duration: 500, easing: Easing.in(Easing.cubic) };
const CAMERA_TIMING = { duration: 900, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const POP_IN = { duration: 700, easing: Easing.out(Easing.back(1.4)) };
const POP_OUT = { duration: 220, easing: Easing.in(Easing.cubic) };
const ILLUSTRATION_DELAY = 350;

type Stage = { w: number; h: number };

function cameraFor(page: number, stage: Stage) {
  const scale = Math.min((stage.w * 0.84) / BODY_WIDTH, (stage.h * 0.96) / VISUAL_HEIGHT);
  const slide = SLIDES[page];
  return { scale, x: -slide.x * scale, y: -slide.y * scale };
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage | null>(null);
  const isLast = index === SLIDES.length - 1;

  const camScale = useSharedValue(1);
  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const cameraReady = useRef(false);

  const drop0 = useSharedValue(1);
  const drop1 = useSharedValue(0);
  const drop2 = useSharedValue(0);
  const pop0 = useSharedValue(1);
  const pop1 = useSharedValue(0);
  const pop2 = useSharedValue(0);
  const drops = [drop0, drop1, drop2];
  const pops = [pop0, pop1, pop2];

  useEffect(() => {
    if (!stage) return;
    const cam = cameraFor(index, stage);
    if (!cameraReady.current) {
      camScale.value = cam.scale;
      camX.value = cam.x;
      camY.value = cam.y;
      cameraReady.current = true;
      return;
    }
    camScale.value = withTiming(cam.scale, CAMERA_TIMING);
    camX.value = withTiming(cam.x, CAMERA_TIMING);
    camY.value = withTiming(cam.y, CAMERA_TIMING);
  }, [index, stage, camScale, camX, camY]);

  useEffect(() => {
    const pieces = [
      [drop1, pop1],
      [drop2, pop2],
    ] as const;
    pieces.forEach(([drop, pop], i) => {
      const visible = index >= i + 1;
      drop.value = visible ? withDelay(50, withTiming(1, SLIDE_IN)) : withTiming(0, SLIDE_OUT);
      pop.value = visible
        ? withDelay(ILLUSTRATION_DELAY, withTiming(1, POP_IN))
        : withTiming(0, POP_OUT);
    });
  }, [index, drop1, drop2, pop1, pop2]);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: camX.value },
      { translateY: camY.value },
      { scale: camScale.value },
    ],
  }));

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/login');
  };

  const next = () => {
    if (isLast) finish();
    else setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  };

  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
        else if (g.dx > SWIPE_THRESHOLD) setIndex((i) => Math.max(i - 1, 0));
      },
    })
  );

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  const slide = SLIDES[index];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={16}
          disabled={isLast}
          onPress={finish}
          style={{ opacity: isLast ? 0 : 1 }}>
          <AppText style={styles.skip}>Lewati</AppText>
        </Pressable>
      </View>

      <View style={styles.stage} onLayout={onStageLayout}>
        {stage && (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', width: stage.w, height: stage.h }, worldStyle]}>
            {SLIDES.map((s, i) => (
              <Piece key={`piece-${i}`} slide={s} index={i} drop={drops[i]} stage={stage} />
            ))}
            {SLIDES.map((s, i) => (
              <Illustration
                key={`illustration-${i}`}
                slide={s}
                drop={drops[i]}
                pop={pops[i]}
                stage={stage}
              />
            ))}
          </Animated.View>
        )}
      </View>

      <View style={styles.textWrap}>
        <Animated.View
          key={index}
          entering={FadeInDown.delay(100).duration(450)}
          exiting={FadeOut.duration(100)}
          style={StyleSheet.absoluteFill}>
          <AppText style={styles.title}>{slide.title}</AppText>
          <AppText style={styles.body}>{slide.body}</AppText>
        </Animated.View>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <Dot key={i} active={i === index} />
        ))}
      </View>

      <PrimaryButton
        title={isLast ? 'Mulai' : 'Lanjut'}
        icon="arrow-right"
        onPress={next}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

function Piece({
  slide,
  index,
  drop,
  stage,
}: {
  slide: Slide;
  index: number;
  drop: SharedValue<number>;
  stage: Stage;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(drop.value, [0, 0.2], [0, 1], 'clamp'),
    transform: [{ translateX: interpolate(drop.value, [0, 1], [ENTRY_DISTANCE, 0]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        {
          width: CANVAS,
          height: CANVAS,
          left: stage.w / 2 + slide.x - CANVAS / 2,
          top: stage.h / 2 + slide.y - CANVAS / 2,
          zIndex: (index + 1) * 10,
        },
        style,
      ]}>
      <Image source={slide.puzzle} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}

function Illustration({
  slide,
  drop,
  pop,
  stage,
}: {
  slide: Slide;
  drop: SharedValue<number>;
  pop: SharedValue<number>;
  stage: Stage;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(drop.value, [0, 0.2], [0, 1], 'clamp'),
    transform: [
      { translateX: interpolate(drop.value, [0, 1], [ENTRY_DISTANCE, 0]) },
      { scale: interpolate(pop.value, [0, 1], [0.55, 1], 'clamp') },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        {
          width: ILLUSTRATION_SIZE,
          height: ILLUSTRATION_SIZE,
          left: stage.w / 2 + slide.x - ILLUSTRATION_SIZE / 2,
          top: stage.h / 2 + slide.y - ILLUSTRATION_SIZE / 2,
          zIndex: 100,
        },
        style,
      ]}>
      <Image source={slide.illustration} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}

function Dot({ active }: { active: boolean }) {
  const p = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: 300 });
  }, [active, p]);

  const style = useAnimatedStyle(() => ({
    width: 8 + 20 * p.value,
    backgroundColor: interpolateColor(p.value, [0, 1], [Colors.blueSoft, Colors.primary]),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 48,
    paddingHorizontal: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
  absolute: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    height: 190,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    color: Colors.text,
    letterSpacing: -0.5,
    paddingHorizontal: 10,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 24,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    marginHorizontal: 28,
    marginBottom: 12,
  },
});
