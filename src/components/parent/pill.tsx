import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Fonts, Radius, Shadow } from '@/constants/theme';

import { Tones, type Tone } from './tones';

type Props = {
  label: string;
  tone?: Tone;
  solid?: boolean;
  icon?: ComponentProps<typeof Feather>['name'];
  iconRight?: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Pill({
  label,
  tone = 'gray',
  solid,
  icon,
  iconRight,
  size = 'sm',
  onPress,
  style,
}: Props) {
  const t = Tones[tone];
  const fg = solid ? '#FFFFFF' : t.fg;
  const isMd = size === 'md';
  const iconEl = icon && <Feather name={icon} size={isMd ? 16 : 13} color={fg} />;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        isMd && styles.md,
        { backgroundColor: solid ? t.solid : t.bg },
        isMd && Shadow.soft,
        pressed && { opacity: 0.85 },
        style,
      ]}>
      {!iconRight && iconEl}
      <AppText numberOfLines={1} style={[styles.label, isMd && styles.labelMd, { color: fg }]}>
        {label}
      </AppText>
      {iconRight && iconEl}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  labelMd: {
    fontSize: 14,
  },
});
