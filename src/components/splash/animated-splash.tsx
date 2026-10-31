import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Fonts } from '@/constants/theme';

// posisi tiap puzzle di kotak logo (0-1), searah jarum jam mulai dari kuning atas.
// z: puzzle-1 paling atas, puzzle-8 paling bawah
const PIECES = [
  { source: require('@/assets/images/splash/puzzles/puzzle-8.png'), x: 0.2056, y: 0.0093, w: 0.3889, h: 0.3111, z: 10 },
  { source: require('@/assets/images/splash/puzzles/puzzle-1.png'), x: 0.5, y: 0.0204, w: 0.3444, h: 0.3111, z: 80 },
  { source: require('@/assets/images/splash/puzzles/puzzle-2.png'), x: 0.7, y: 0.187, w: 0.3, h: 0.3556, z: 70 },
  { source: require('@/assets/images/splash/puzzles/puzzle-3.png'), x: 0.6889, y: 0.4815, w: 0.3167, h: 0.3556, z: 60 },
  { source: require('@/assets/images/splash/puzzles/puzzle-4.png'), x: 0.45, y: 0.6704, w: 0.3944, h: 0.3167, z: 50 },
  { source: require('@/assets/images/splash/puzzles/puzzle-5.png'), x: 0.1333, y: 0.637, w: 0.4, h: 0.3611, z: 40 },
  { source: require('@/assets/images/splash/puzzles/puzzle-6.png'), x: 0.0056, y: 0.4037, w: 0.3278, h: 0.4, z: 30 },
  { source: require('@/assets/images/splash/puzzles/puzzle-7.png'), x: 0, y: 0.1204, w: 0.3333, h: 0.3611, z: 20 },
];

// sedikit diperbesar biar nggak ada celah antar puzzle
const PIECE_SCALE = 1.06;

const LETTERS = [
  { char: 'D', color: Colors.red },
  { char: 'U', color: Colors.green },
  { char: 'B', color: Colors.yellow },
  { char: 'I', color: Colors.primary },
  { char: 'D', color: Colors.red },
  { char: 'U', color: Colors.green },
];

const PIECE_STAGGER = 110;
const PIECES_DONE = PIECE_STAGGER * PIECES.length + 350;
const BEAR_DELAY = PIECES_DONE;
const LETTERS_DELAY = BEAR_DELAY + 450;
const LETTER_STAGGER = 110;
const HOLD = 900;
const TOTAL = LETTERS_DELAY + LETTER_STAGGER * LETTERS.length + HOLD;

type Props = {
  onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.72, 340);
  const letterSize = logoSize * 0.23;

  const ringRotation = useSharedValue(-120);
  const exit = useSharedValue(1);

  useEffect(() => {
    ringRotation.value = withTiming(0, {
      duration: PIECES_DONE,
      easing: Easing.out(Easing.cubic),
    });
    exit.value = withDelay(
      TOTAL,
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) scheduleOnRN(onFinish);
      })
    );
  }, [ringRotation, exit, onFinish]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exit.value,
    transform: [{ scale: 1 + (1 - exit.value) * 0.08 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.center, exitStyle]}>
        <View style={{ width: logoSize, height: logoSize }}>
          <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
            {PIECES.map((piece, index) => (
              <PuzzlePiece key={index} index={index} piece={piece} logoSize={logoSize} />
            ))}
          </Animated.View>
          <Bear logoSize={logoSize} />
        </View>

        <View style={[styles.wordmark, { marginTop: logoSize * 0.1 }]}>
          {LETTERS.map((letter, index) => (
            <Letter key={index} index={index} size={letterSize} {...letter} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function PuzzlePiece({
  index,
  piece,
  logoSize,
}: {
  index: number;
  piece: (typeof PIECES)[number];
  logoSize: number;
}) {
  const progress = useSharedValue(0);

  const w = piece.w * logoSize * PIECE_SCALE;
  const h = piece.h * logoSize * PIECE_SCALE;
  const centerX = (piece.x + piece.w / 2) * logoSize;
  const centerY = (piece.y + piece.h / 2) * logoSize;
  const fromX = (logoSize / 2 - centerX) * 0.6;
  const fromY = (logoSize / 2 - centerY) * 0.6;

  useEffect(() => {
    progress.value = withDelay(
      index * PIECE_STAGGER,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value * 2, 1),
    transform: [
      { translateX: fromX * (1 - progress.value) },
      { translateY: fromY * (1 - progress.value) },
      { rotate: `${(1 - progress.value) * -25}deg` },
      { scale: 0.6 + progress.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        { left: centerX - w / 2, top: centerY - h / 2, width: w, height: h, zIndex: piece.z },
        style,
      ]}>
      <Image source={piece.source} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}

function Bear({ logoSize }: { logoSize: number }) {
  const progress = useSharedValue(0);
  const width = logoSize * 0.63;
  const height = width * (2100 / 2357);

  useEffect(() => {
    progress.value = withDelay(
      BEAR_DELAY,
      withSpring(1, { damping: 9, stiffness: 160, mass: 0.9 })
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value * 3, 1),
    transform: [
      { translateY: (1 - progress.value) * 30 },
      { scale: progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.absolute,
        {
          width,
          height,
          left: logoSize * 0.515 - width / 2,
          top: logoSize * 0.5 - height / 2,
        },
        style,
      ]}>
      <Image
        source={require('@/assets/images/splash/bear.png')}
        style={styles.fill}
        contentFit="contain"
      />
    </Animated.View>
  );
}

function Letter({
  index,
  char,
  color,
  size,
}: {
  index: number;
  char: string;
  color: string;
  size: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      LETTERS_DELAY + index * LETTER_STAGGER,
      withSequence(
        withTiming(1.15, { duration: 180, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 8, stiffness: 180 })
      )
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value * 2, 1),
    transform: [
      { translateY: (1 - Math.min(progress.value, 1)) * 24 },
      { scale: 0.4 + progress.value * 0.6 },
    ],
  }));

  const textStyle = { fontSize: size, lineHeight: size * 1.25 };
  const depth = size * 0.05;

  // efek clay: bayangan lembut, sisi bawah lebih gelap, kilap tipis di atas
  return (
    <Animated.View style={style}>
      <Text style={[styles.letter, styles.softShadow, textStyle, { color }]}>{char}</Text>
      <Text style={[styles.letter, styles.layer, textStyle, { color: shade(color, -0.28), top: depth }]}>
        {char}
      </Text>
      <Text
        style={[styles.letter, styles.layer, textStyle, { color: shade(color, 0.55), top: -depth * 0.6 }]}>
        {char}
      </Text>
      <Text style={[styles.letter, styles.layer, textStyle, { color }]}>{char}</Text>
    </Animated.View>
  );
}

// amount > 0 lebih terang, < 0 lebih gelap
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(amount));
  const r = mix(n >> 16);
  const g = mix((n >> 8) & 0xff);
  const b = mix(n & 0xff);
  return `rgb(${r}, ${g}, ${b})`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    flexDirection: 'row',
  },
  letter: {
    fontFamily: Fonts.logo,
  },
  layer: {
    position: 'absolute',
    left: 0,
  },
  softShadow: {
    textShadowColor: 'rgba(34, 50, 74, 0.28)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 12,
  },
});
