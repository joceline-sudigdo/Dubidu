import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadow } from '@/constants/theme';

import { Tones, type Tone } from './tones';

type Props = {
  children: ReactNode;
  tone?: Tone | 'white';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// kartu gaya clay: sudut bulat, bayangan lembut, tepi bawah sedikit lebih gelap
export function ClayCard({ children, tone = 'white', onPress, style }: Props) {
  const colors =
    tone === 'white'
      ? { backgroundColor: '#FFFFFF', borderColor: Colors.border }
      : { backgroundColor: Tones[tone].bg, borderColor: Tones[tone].edge };

  const content = <View style={[styles.card, Shadow.clay, colors, style]}>{children}</View>;

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 3,
    padding: 18,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
