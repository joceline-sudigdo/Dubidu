import { Image } from 'expo-image';
import { useEffect, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth } from '@/constants/theme';

type Props = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
};

// kerangka halaman parent: background putih + gelembung biru lembut
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  edges = ['top'],
  contentStyle,
  scrollRef,
}: Props) {
  return (
    <View style={styles.root}>
      <Blobs />
      <SafeAreaView style={styles.flex} edges={edges}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {header && <View style={styles.header}>{header}</View>}
          {scroll ? (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[styles.content, contentStyle]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.flex, contentStyle]}>{children}</View>
          )}
          {footer}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ornamen kepingan puzzle samar di belakang konten (diblur + transparan biar nggak ganggu)
const PUZZLE = require('@/assets/images/icons/puzzle_element.png');
// tiap keping melayang pelan dengan arah & durasi beda biar terasa natural
const PIECES = [
  { top: -40, right: -50, size: 190, rotate: 18, opacity: 0.12, dx: 18, dy: 26, duration: 9000 },
  { top: 400, left: -80, size: 200, rotate: -24, opacity: 0.09, dx: -22, dy: 18, duration: 11000 },
  { top: 760, right: -60, size: 150, rotate: 40, opacity: 0.08, dx: 16, dy: -22, duration: 13000 },
];

function Blobs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIECES.map((piece, i) => (
        <FloatingPiece key={i} {...piece} />
      ))}
    </View>
  );
}

function FloatingPiece({ size, rotate, opacity, dx, dy, duration, ...pos }: (typeof PIECES)[number]) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * dx },
      { translateY: t.value * dy },
      { rotate: `${rotate + t.value * 8}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.piece, pos, { width: size, height: size, opacity }, style]}>
      <Image source={PUZZLE} blurRadius={14} contentFit="contain" style={styles.fill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  piece: {
    position: 'absolute',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
