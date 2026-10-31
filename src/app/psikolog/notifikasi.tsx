import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Shadow } from '@/constants/theme';
import { psychologistNotifications as notifications, type PsychologistNotification } from '@/data/psychologist';

type Filter = 'all' | PsychologistNotification['category'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'booking', label: 'Booking' },
  { id: 'verifikasi', label: 'Verifikasi' },
  { id: 'chat', label: 'Chat' },
  { id: 'pembayaran', label: 'Pembayaran' },
];

const GROUPS = [
  { id: 'today', title: 'Hari Ini' },
  { id: 'yesterday', title: 'Kemarin' },
  { id: 'earlier', title: 'Sebelumnya' },
] as const;

export default function PsikologNotifikasiScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'all' ? notifications : notifications.filter((n) => n.category === filter);

  return (
    <Screen header={<ScreenHeader title="Notifikasi" />} edges={['top', 'bottom']}>
      <EdgeScroll contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f.id}
            size="md"
            tone="blue"
            solid={filter === f.id}
            label={f.id === 'all' ? `${f.label} (${notifications.length})` : f.label}
            onPress={() => setFilter(f.id)}
            style={filter !== f.id && styles.idle}
          />
        ))}
      </EdgeScroll>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyCircle, Shadow.clay]}>
            <Image source={require('@/assets/images/mascot/sleep.png')} style={styles.emptyBear} contentFit="contain" />
          </View>
          <AppText style={styles.emptyTitle}>Belum Ada Notifikasi</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
            Kabar soal booking, verifikasi, dan pesan baru akan muncul di sini
          </AppText>
        </View>
      ) : (
        GROUPS.map((g) => {
          const list = visible.filter((n) => n.group === g.id);
          if (list.length === 0) return null;
          return (
            <View key={g.id} style={styles.group}>
              <SectionHeader title={g.title} right={<AppText variant="caption">{list.length} Notifikasi</AppText>} />
              {list.map((n) => (
                <NotificationCard key={n.id} item={n} />
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

function NotificationCard({ item }: { item: PsychologistNotification }) {
  const t = Tones[item.tone];
  const open = () => router.push(item.href);

  return (
    <ClayCard onPress={open} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: t.solid }, Shadow.soft]}>
        <MaterialCommunityIcons
          name={item.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={22}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.flex}>
        <View style={styles.top}>
          <AppText style={styles.title} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption">{item.time}</AppText>
        </View>
        <AppText style={styles.body} numberOfLines={2}>
          {item.body}
        </AppText>
        {item.action && (
          <PrimaryButton title={item.action} color={t.solid} onPress={open} style={styles.action} />
        )}
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  filters: {
    gap: 10,
    paddingBottom: 6,
  },
  idle: {
    backgroundColor: '#FFFFFF',
  },
  group: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  action: {
    height: 42,
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyBear: {
    width: 150,
    height: 125,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
});
