import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { photoFor } from '@/data/images';
import { useProfile } from '@/lib/profile-store';

const PALETTE = [Colors.primary, Colors.green, Colors.red, Colors.yellow, Colors.primaryDark];

type Props = {
  name: string;
  size?: number;
  source?: ImageSource | number;
  ring?: string;
};

// kalau belum ada foto, tampilkan inisial dengan warna yang konsisten per nama
export function Avatar({ name, size = 44, source, ring }: Props) {
  const uploaded = useProfile().photos[name];
  const image = uploaded ? { uri: uploaded } : (source ?? photoFor(name));
  const initials = name
    .replace(/^(Kak|Dr\.|Bunda|Mama|Papi|Mami)\s+/i, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const bg = PALETTE[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % PALETTE.length];

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: ring ? 3 : 0,
          borderColor: ring,
        },
      ]}>
      {image ? (
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AppText style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: Fonts.bodyBold,
    color: '#FFFFFF',
  },
});
