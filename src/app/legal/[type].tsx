import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { legalDocs, teacherTerms } from '@/data/legal';
import { loadLegal } from '@/lib/sync';

// /legal/terms = Syarat & Ketentuan, /legal/privacy = Kebijakan Privasi, /legal/teacher = S&K Shadow Teacher
export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const doc = type === 'teacher' ? teacherTerms : legalDocs[type === 'privacy' ? 'privacy' : 'terms'];
  const [, setLoaded] = useState(false);

  // versi terbaru dari web admin; isi bawaan tampil dulu sambil menunggu
  useEffect(() => {
    loadLegal()
      .then(() => setLoaded(true))
      .catch(() => {});
  }, []);

  return (
    <Screen header={<ScreenHeader title={doc.title} />} edges={['top', 'bottom']}>
      <AppText variant="caption">{doc.updated}</AppText>
      <ClayCard style={styles.card}>
        {doc.sections.map((s, i) => (
          <View key={s.h} style={[styles.section, i < doc.sections.length - 1 && styles.divider]}>
            <AppText style={styles.h}>{s.h}</AppText>
            <AppText style={styles.p}>{s.p}</AppText>
          </View>
        ))}
      </ClayCard>
      <AppText variant="caption" style={styles.center}>
        Ada pertanyaan? Hubungi bantuan@dubidu.id
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 4,
  },
  section: {
    paddingVertical: 14,
    gap: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  h: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  p: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  center: {
    textAlign: 'center',
  },
});
