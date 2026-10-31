import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Colors, Fonts } from '@/constants/theme';

// judul selalu di tengah: slot kiri (tombol kembali) & kanan sama lebar
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <BackButton />
      </View>
      <AppText style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </AppText>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

// header halaman tab: judul di tengah, aksi opsional di kanan
export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.tabRow}>
      <View style={styles.side} />
      <AppText style={styles.tabTitle} numberOfLines={1}>
        {title}
      </AppText>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 30,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    marginTop: 4,
  },
  side: {
    width: 46,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  tabTitle: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 22,
    lineHeight: 32,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
  },
});
