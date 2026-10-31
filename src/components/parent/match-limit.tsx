import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { MAX_SKIPS } from '@/data/teachers';

// sisa waktu sampai jam 00:00
function untilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function MatchLimit({
  onShowLast,
  noun = 'teacher',
  homeHref = '/beranda',
}: {
  onShowLast: () => void;
  noun?: 'teacher' | 'anak';
  homeHref?: '/beranda' | '/teacher/beranda';
}) {
  const [countdown, setCountdown] = useState(untilMidnight);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(untilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, Shadow.clay]}>
        <Image source={require('@/assets/images/mascot/sleep.png')} style={styles.bear} contentFit="contain" />
      </View>

      <AppText style={styles.title}>
        Sudah lihat {MAX_SKIPS} {noun} hari ini!
      </AppText>
      <AppText variant="body" color={Colors.textSecondary}>
        {noun === 'teacher' ? 'Guru' : 'Anak'} baru akan muncul dalam:
      </AppText>
      <View style={[styles.timer, Shadow.soft]}>
        <Feather name="clock" size={22} color={Colors.textSecondary} />
        <AppText style={styles.timerText}>{countdown}</AppText>
      </View>

      <View style={[styles.plus, Shadow.clay]}>
        <View style={styles.plusBadge}>
          <Feather name="award" size={16} color={Colors.primary} />
          <AppText style={styles.plusBadgeText}>UPGRADE KE PLUS</AppText>
        </View>
        <AppText variant="body" color={Colors.primaryDark} style={styles.center}>
          Swipe tanpa batas, kapan saja & hubungi lebih dari 1 {noun}
        </AppText>
        <PrimaryButton
          title="Swipe Lebih Banyak"
          onPress={() => router.push('/plus')}
          style={styles.stretch}
        />
      </View>

      <Pressable onPress={onShowLast} hitSlop={8}>
        <AppText variant="link">
          Lihat {MAX_SKIPS} {noun} terakhir
        </AppText>
      </Pressable>
      <Pressable onPress={() => router.replace(homeHref)} hitSlop={8}>
        <AppText style={styles.home}>Kembali ke Beranda</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bear: {
    width: 170,
    height: 140,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 38,
    color: Colors.text,
    textAlign: 'center',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  timerText: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 42,
    color: Colors.text,
  },
  plus: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.blueSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.blueMid,
    padding: 22,
    marginTop: 20,
    marginBottom: 8,
  },
  plusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  plusBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 0.5,
    color: Colors.primaryDark,
  },
  center: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  home: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    textDecorationLine: 'underline',
  },
});
