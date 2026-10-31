import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: 'pill' | 'tag';
  style?: StyleProp<ViewStyle>;
};

export function ChoiceChip({ label, selected, onPress, icon, size = 'pill', style }: Props) {
  const isTag = size === 'tag';
  const color = selected ? '#FFFFFF' : Colors.text;

  return (
    <Pressable
      accessibilityRole={isTag ? 'checkbox' : 'radio'}
      accessibilityState={isTag ? { checked: selected } : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        isTag ? styles.tag : styles.pill,
        selected ? [styles.selected, Shadow.button] : styles.idle,
        pressed && { opacity: 0.85 },
        style,
      ]}>
      {icon && <MaterialCommunityIcons name={icon} size={22} color={color} />}
      <AppText style={[isTag ? styles.tagLabel : styles.pillLabel, { color }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 52,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idle: {
    backgroundColor: Colors.inputBackground,
  },
  selected: {
    backgroundColor: Colors.primary,
  },
  pillLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  tagLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
});
