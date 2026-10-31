import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { StarInput } from '@/components/parent/stars';
import { AppText } from '@/components/ui/app-text';
import { celebrateFish } from '@/components/ui/fish-celebration';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { missions } from '@/data/rewards';
import { showAlert } from '@/lib/dialog';
import { claimMission, usePoints } from '@/lib/points-store';

const RATING_LABEL = ['', 'Kurang', 'Cukup', 'Baik', 'Sangat baik', 'Luar biasa!'];
const TAGS = ['Sabar', 'Komunikatif', 'Tepat waktu', 'Laporan detail', 'Kreatif', 'Anak nyaman'];
const REVIEW_MISSION = missions.parent.find((m) => m.id === 'm-review');

// ulasan orang tua untuk shadow teacher setelah sesi
export default function BeriUlasanScreen() {
  const { teacher = 'Nielsen Dave, S.Pd' } = useLocalSearchParams<{ teacher?: string }>();
  const store = usePoints();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const short = teacher.split(',')[0];

  const submit = () => {
    const rewarded = REVIEW_MISSION && !store.claimedMissions.parent.includes(REVIEW_MISSION.id);
    router.back();
    if (rewarded) {
      claimMission(REVIEW_MISSION.id, REVIEW_MISSION.title, REVIEW_MISSION.reward);
      celebrateFish(REVIEW_MISSION.reward, 'Terima kasih atas ulasannya!');
    } else {
      showAlert('Ulasan terkirim', `Ulasanmu membantu ${short} dan orang tua lain.`);
    }
  };

  return (
    <Screen
      header={<ScreenHeader title="Beri Ulasan" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <PrimaryButton title="Kirim Ulasan" icon="send" disabled={rating === 0} onPress={submit} />
        </View>
      }>
      <ClayCard tone="blue" style={styles.teacher}>
        <Avatar name={teacher} size={72} ring="#FFFFFF" />
        <AppText style={styles.name}>{short}</AppText>
        <AppText variant="caption">Bagaimana pendampingan {short} sejauh ini?</AppText>
        <View style={styles.stars}>
          <StarInput value={rating} onChange={setRating} size={38} />
        </View>
        <AppText style={styles.ratingLabel}>{RATING_LABEL[rating] || 'Ketuk bintang untuk menilai'}</AppText>
      </ClayCard>

      <SectionHeader title="Apa yang paling berkesan?" />
      <View style={styles.tags}>
        {TAGS.map((t) => {
          const on = tags.includes(t);
          return (
            <Pill
              key={t}
              label={t}
              size="md"
              tone="blue"
              solid={on}
              icon={on ? 'check' : undefined}
              onPress={() => setTags((list) => (on ? list.filter((x) => x !== t) : [...list, t]))}
              style={!on && styles.white}
            />
          );
        })}
      </View>

      <SectionHeader title="Ceritakan pengalamanmu" />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={`Contoh: ${short} sabar sekali, anak jadi lebih fokus di kelas...`}
        placeholderTextColor={Colors.textMuted}
        multiline
        maxLength={500}
        style={styles.input}
      />
      <AppText variant="caption" style={styles.counter}>
        {text.length}/500
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  teacher: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    marginTop: 6,
  },
  stars: {
    marginTop: 10,
  },
  ratingLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.primaryDark,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  input: {
    minHeight: 130,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
