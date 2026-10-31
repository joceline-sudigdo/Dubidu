import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { AppText } from '@/components/ui/app-text';
import { celebrateFish } from '@/components/ui/fish-celebration';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { getSession } from '@/lib/session';
import { claimCheckin, hasPoints, usePoints } from '@/lib/points-store';

const WEEK = [
  { day: 'Sen', reward: 10, done: true },
  { day: 'Sel', reward: 15, done: true },
  { day: 'Rab', reward: 20, done: true },
  { day: 'Kam', reward: 25, today: true },
  { day: 'Jum', reward: 30 },
  { day: 'Sab', reward: 40 },
  { day: 'Min', reward: 100, bonus: true },
];

const TODAY_REWARD = WEEK.find((d) => d.today)!.reward;

export function CheckinCard() {
  const role = getSession().role;
  const points = usePoints();
  if (!hasPoints(role)) return null;
  const claimed = points.checkinClaimed[role];

  const claim = () => {
    if (claimCheckin(TODAY_REWARD)) celebrateFish(TODAY_REWARD, 'Check-in hari ini berhasil!');
  };

  return (
    <ClayCard style={styles.checkin}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText style={styles.checkinTitle}>Check-in hari ini!</AppText>
          <AppText variant="caption">Check-in setiap hari dan kumpulkan ikan sebanyak-banyaknya!</AppText>
        </View>
        <Pressable accessibilityLabel="Buka Doobie Rewards" onPress={() => router.push('/rewards')} style={styles.balance}>
          <Image source={require('@/assets/images/icons/ikan.png')} style={styles.fish} contentFit="contain" />
          <AppText style={styles.balanceText}>{points.points[role].toLocaleString('id-ID')}</AppText>
        </Pressable>
      </View>
      <View style={styles.week}>
        {WEEK.map((d) => {
          const done = d.done || (d.today && claimed);
          return (
            <View key={d.day} style={[styles.dayCol, d.today && styles.dayToday, d.bonus && styles.dayBonus]}>
              <AppText style={[styles.dayLabel, d.today && { color: Colors.yellowDark }]}>{d.day}</AppText>
              <View style={[styles.dayIcon, done && { backgroundColor: Colors.primary }]}>
                {done ? (
                  <Feather name="check" size={14} color="#FFFFFF" />
                ) : d.bonus ? (
                  <AppText style={styles.dayEmoji}>🎁</AppText>
                ) : (
                  <Image source={require('@/assets/images/icons/ikan.png')} style={styles.fish} contentFit="contain" />
                )}
              </View>
              <AppText style={[styles.dayReward, d.today && { color: Colors.yellowDark }]}>+{d.reward}</AppText>
            </View>
          );
        })}
      </View>
      <PrimaryButton
        title={claimed ? 'Sudah diklaim hari ini' : 'Klaim ikan hari ini!'}
        disabled={claimed}
        onPress={claim}
        style={styles.button}
      />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  checkin: {
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkinTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  balanceText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.yellowDark,
  },
  week: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  dayToday: {
    backgroundColor: Colors.yellowSoft,
    borderWidth: 2,
    borderColor: Colors.yellow,
  },
  dayBonus: {
    backgroundColor: Colors.yellowSoft,
  },
  dayLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayEmoji: {
    fontSize: 14,
  },
  fish: {
    width: 22,
    height: 16,
  },
  dayReward: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 12,
  },
});
