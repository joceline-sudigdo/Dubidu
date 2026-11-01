import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { Segmented } from '@/components/parent/segmented';
import { ConsultationCard } from '@/components/psikolog/consultation-card';
import { SlotEditor } from '@/components/psikolog/slot-editor';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { consultations } from '@/data/psychologist';
import { statusOf, usePsikolog } from '@/lib/psikolog-store';

export default function PsikologJadwalScreen() {
  const store = usePsikolog();
  const [tab, setTab] = useState<0 | 1>(0);
  // sesi yang masih perlu laporan tetap di "Mendatang" biar nggak terlewat
  const upcoming = consultations.filter((c) => statusOf(store, c) !== 'done');
  const done = consultations.filter((c) => statusOf(store, c) === 'done');
  const list = tab === 0 ? upcoming : done;
  const days = [...new Set(list.map((c) => c.day))];

  return (
    <Screen>
      <TabHeader title="Jadwal" />
      <SlotEditor />
      <Segmented labels={[`Mendatang (${upcoming.length})`, `Selesai (${done.length})`]} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <ClayCard>
          <EmptyState
            title={tab === 0 ? 'Belum ada jadwal' : 'Belum ada sesi selesai'}
            subtitle="Booking konsultasi dari orang tua akan muncul di sini."
          />
        </ClayCard>
      ) : (
        days.map((day) => (
          <View key={day} style={styles.group}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-text" size={22} color={Colors.primary} />
              <AppText style={styles.dateTitle}>{day}</AppText>
            </View>
            {list
              .filter((c) => c.day === day)
              .map((c) => (
                <ConsultationCard key={c.id} item={c} showAction={tab === 0 && c.today} />
              ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
});
