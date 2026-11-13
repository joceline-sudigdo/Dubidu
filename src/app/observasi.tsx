import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { useObservations } from '@/lib/observation-store';

// daftar laporan observasi dari psikolog untuk semua anak
export default function ObservasiListScreen() {
  const { reports, isNew } = useObservations();

  return (
    <Screen header={<ScreenHeader title="Laporan Observasi" />} edges={['top', 'bottom']} fill={reports.length === 0}>
      <AppText variant="caption">
        Hasil sesi konsultasi dari psikolog mitra: temuan, rekomendasi, dan langkah selanjutnya untuk si kecil.
      </AppText>

      {reports.length === 0 && (
        <EmptyFill>
          <EmptyState title="Belum ada laporan" subtitle="Laporan muncul di sini setelah sesi konsultasi psikolog selesai." />
        </EmptyFill>
      )}

      {reports.map((r) => (
        <ClayCard key={r.id} onPress={() => router.push({ pathname: '/observasi/[id]', params: { id: r.id } })} style={styles.card}>
          <View style={styles.head}>
            <Avatar name={r.psychologist} size={44} />
            <View style={styles.flex}>
              <AppText style={styles.name} numberOfLines={1}>
                {r.psychologist.split(',')[0]}
              </AppText>
              <AppText variant="caption">
                {r.date} · {r.mode}
              </AppText>
            </View>
            {isNew(r.id) && <Pill label="Baru" tone="red" solid />}
          </View>
          <View style={styles.inline}>
            <Pill label={`Untuk ${r.child}`} tone="blue" />
            <Pill label={`${r.recommendations.length} rekomendasi`} tone="green" icon="check-circle" />
          </View>
          <AppText style={styles.summary} numberOfLines={3}>
            {r.summary}
          </AppText>
          <View style={styles.more}>
            <AppText variant="link" style={styles.small}>
              Baca laporan
            </AppText>
            <Feather name="arrow-right" size={14} color={Colors.primary} />
          </View>
        </ClayCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
  },
  inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summary: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  small: {
    fontSize: 14,
  },
});
