import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: ComponentProps<typeof Feather>['name'];
  color?: string;
  // 'chat' = ikon chat yang sama dengan navbar
  leadingIcon?: ComponentProps<typeof Feather>['name'] | 'chat';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  icon,
  leadingIcon,
  color = Colors.primary,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? Colors.disabled : color },
        !disabled && Shadow.button,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {leadingIcon === 'chat' ? (
          <ChatIcon size={20} color="#FFFFFF" />
        ) : (
          leadingIcon && <Feather name={leadingIcon} size={20} color="#FFFFFF" />
        )}
        <AppText style={styles.title}>{title}</AppText>
        {icon && <Feather name={icon} size={20} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
