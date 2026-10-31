import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { LEVEL_TITLE, levelOf } from '@/data/rewards';
import { hasPoints, usePoints } from '@/lib/points-store';
import { getSession } from '@/lib/session';

// ringkasan ikan & level di profil, ketuk untuk buka Doobie Rewards
export function PointsCard() {
  const role = getSession().role;
  const store = usePoints();
  if (!hasPoints(role)) return null;

  const points = store.points[role];
  const { current, next } = levelOf(points);

  return (
    <Pressable
      accessibilityLabel="Buka Doobie Rewards"
      onPress={() => router.push('/rewards')}
      style={({ pressed }) => [styles.card, Shadow.soft, pressed && { opacity: 0.9 }]}>
      <View style={styles.fishCircle}>
        <Image source={require('@/assets/images/icons/ikan.png')} style={styles.fish} contentFit="contain" />
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" color={Colors.yellowDark}>
          Ikan kamu · Lv {current.level} {LEVEL_TITLE[role]} {current.name}
        </AppText>
        <AppText style={styles.points}>{points.toLocaleString('id-ID').replace(/,/g, '.')} Ikan</AppText>
        {next && (
          <AppText variant="caption">{(next.min - points).toLocaleString('id-ID').replace(/,/g, '.')} lagi menuju Lv {next.level}</AppText>
        )}
      </View>
      <View style={styles.cta}>
        <AppText style={styles.ctaText}>Rewards</AppText>
        <Feather name="chevron-right" size={16} color={Colors.yellowDark} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.yellowSoft,
    borderWidth: 1,
    borderColor: '#F6E2AE',
  },
  fishCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fish: {
    width: 34,
    height: 23,
  },
  points: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellowDark,
  },
});
