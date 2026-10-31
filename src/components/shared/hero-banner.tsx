import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  photo: number | null;
  onPress: () => void;
};

// banner beranda: foto latar + gradasi biru ke bawah + bayangan biru
export function HeroBanner({ title, subtitle, photo, onPress }: Props) {
  return (
    <View style={styles.glow}>
      <View style={styles.card}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={[Colors.blueMid, Colors.primary]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={['rgba(61, 122, 189, 0)', 'rgba(61, 122, 189, 0.55)', 'rgba(61, 122, 189, 0.95)']}
          locations={[0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.flex}>
            <AppText style={styles.title}>{title}</AppText>
            {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
          </View>
          <Pressable onPress={onPress} style={({ pressed }) => [styles.button, Shadow.soft, pressed && { opacity: 0.85 }]}>
            <AppText style={styles.buttonText}>Mulai cari</AppText>
            <Feather name="arrow-right" size={18} color={Colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  glow: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    ...Platform.select({
      web: { boxShadow: '0px 14px 28px rgba(61, 122, 189, 0.45)' },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  card: {
    height: 190,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 20,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
