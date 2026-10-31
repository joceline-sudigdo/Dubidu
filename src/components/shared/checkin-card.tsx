import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts } from '@/constants/theme';
import { showAlert } from '@/lib/dialog';

const WEEK = [
  { day: 'Sen', reward: 10, done: true },
  { day: 'Sel', reward: 15, done: true },
  { day: 'Rab', reward: 20, done: true },
  { day: 'Kam', reward: 25, today: true },
  { day: 'Jum', reward: 30 },
  { day: 'Sab', reward: 40 },
  { day: 'Min', reward: 100, bonus: true },
];

const MOODS = [
  { id: 'senang', label: 'Senang', emoji: '😄' },
  { id: 'tenang', label: 'Tenang', emoji: '😊' },
  { id: 'biasa', label: 'Biasa', emoji: '🙂' },
  { id: 'rewel', label: 'Rewel', emoji: '😫' },
  { id: 'sedih', label: 'Sedih', emoji: '😢' },
];

export function CheckinCard({ childName }: { childName: string }) {
  const [mood, setMood] = useState('senang');

  return (
    <ClayCard style={styles.checkin}>
      <AppText style={styles.checkinTitle}>Check-in hari ini!</AppText>
      <AppText variant="caption">Ceritakan mood {childName} hari ini, raih Madu!</AppText>
      <View style={styles.week}>
        {WEEK.map((d) => (
          <View
            key={d.day}
            style={[styles.dayCol, d.today && styles.dayToday, d.bonus && styles.dayBonus]}>
            <AppText style={[styles.dayLabel, d.today && { color: Colors.yellowDark }]}>{d.day}</AppText>
            <View style={[styles.dayIcon, d.done && { backgroundColor: Colors.primary }]}>
              {d.done ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : d.bonus ? (
                <AppText style={styles.dayEmoji}>🎁</AppText>
              ) : (
                <Image source={require('@/assets/images/icons/ikan.png')} style={styles.fish} contentFit="contain" />
              )}
            </View>
            <AppText style={[styles.dayReward, d.today && { color: Colors.yellowDark }]}>+{d.reward}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.divider} />
      <AppText style={styles.moodTitle}>Bagaimana suasana hati si kecil hari ini?</AppText>
      <View style={styles.moods}>
        {MOODS.map((m) => {
          const active = m.id === mood;
          return (
            <Pressable key={m.id} onPress={() => setMood(m.id)} style={styles.mood}>
              <View style={[styles.moodCircle, active && styles.moodCircleActive]}>
                <AppText style={styles.moodEmoji}>{m.emoji}</AppText>
              </View>
              <AppText style={[styles.moodLabel, active && { color: Colors.primary, fontFamily: Fonts.bodyBold }]}>
                {m.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton
        title="Klaim madu hari ini!"
        onPress={() => showAlert('Yeay!', 'Kamu dapat +25 Madu 🍯')}
      />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  checkin: {
    gap: 6,
  },
  checkinTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  moodTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  mood: {
    alignItems: 'center',
    gap: 6,
  },
  moodCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCircleActive: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  moodEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  moodLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
