import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';

// pembungkus halaman yang belum punya data: isi sisa layar & taruh konten di tengah vertikal
// (dipakai bersama <Screen fill>)
export function EmptyFill({ children }: { children: ReactNode }) {
  return <View style={styles.fill}>{children}</View>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Image source={require('@/assets/images/mascot/wait.png')} style={styles.img} contentFit="contain" />
      <AppText style={styles.title}>{title}</AppText>
      {subtitle && (
        <AppText variant="caption" style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  wrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  img: {
    width: 220,
    height: 150,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
});
