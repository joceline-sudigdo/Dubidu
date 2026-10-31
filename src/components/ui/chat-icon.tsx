import { Image } from 'expo-image';

// ikon chat yang sama dengan navbar, warnanya bisa diganti
export function ChatIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Image
      source={require('@/assets/images/icons/chat.png')}
      tintColor={color}
      style={{ width: size, height: (size * 100) / 108 }}
      contentFit="contain"
    />
  );
}
