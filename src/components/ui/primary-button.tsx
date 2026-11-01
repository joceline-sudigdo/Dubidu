import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
  leadingIcon?: ComponentProps<typeof Feather>['name'] | 'chat' | 'crown';
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
        ) : leadingIcon === 'crown' ? (
          <MaterialCommunityIcons name="crown" size={20} color="#FFFFFF" />
        ) : (
          leadingIcon && <Feather name={leadingIcon} size={20} color="#FFFFFF" />
        )}
        <AppText style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
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
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  // label panjang di tombol sempit pindah ke baris kedua, tidak keluar dari tombol
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  title: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    color: '#FFFFFF',
  },
});
