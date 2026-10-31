import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { legalDocs } from '@/data/legal';

// /legal/terms = Syarat & Ketentuan, /legal/privacy = Kebijakan Privasi
export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const doc = legalDocs[type === 'privacy' ? 'privacy' : 'terms'];

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
