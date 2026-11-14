import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Shadow } from '@/constants/theme';
import { refreshNotifications } from '@/lib/sync';
import { markAllNotificationsRead, markNotificationRead, useUnreadIds } from '@/lib/notification-store';
import { teacherNotifications, type TeacherNotification } from '@/data/teacher';

type Filter = 'all' | TeacherNotification['category'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'match', label: 'Match Masuk' },
  { id: 'chat', label: 'Chat' },
  { id: 'booking', label: 'Booking' },
  { id: 'laporan', label: 'Laporan' },
];

const GROUPS = [
  { id: 'today', title: 'Hari Ini' },
  { id: 'yesterday', title: 'Kemarin' },
] as const;

export default function TeacherNotifikasiScreen() {
  const unreadIds = useUnreadIds();
  const [filter, setFilter] = useState<Filter>('all');
  // notifikasi terbaru dimuat ulang setiap halaman dibuka, lalu daftar tampil ulang
  const [, setVersion] = useState(0);
  useFocusEffect(
    useCallback(() => {
      refreshNotifications('teacher')
        .then(() => setVersion((v) => v + 1))
        .catch(() => {});
    }, [])
  );
  const visible = filter === 'all' ? teacherNotifications : teacherNotifications.filter((n) => n.category === filter);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifikasi"
          right={
            <Pressable
              accessibilityLabel="Tandai semua sudah dibaca"
              disabled={unreadIds.size === 0}
              onPress={markAllNotificationsRead}
              hitSlop={8}
              style={[styles.markAll, Shadow.soft, unreadIds.size === 0 && styles.markAllOff]}>
              <MaterialCommunityIcons name="check-all" size={20} color={Colors.primary} />
            </Pressable>
          }
        />
      }
      edges={['top', 'bottom']}
      fill={visible.length === 0}>
      <EdgeScroll contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f.id}
            size="md"
            tone="blue"
            solid={filter === f.id}
            label={f.id === 'all' ? `${f.label} (${teacherNotifications.length})` : f.label}
            onPress={() => setFilter(f.id)}
            style={filter !== f.id && styles.idle}
          />
        ))}
      </EdgeScroll>

      {visible.length === 0 ? (
        <EmptyFill>
        <View style={styles.empty}>
          <View style={[styles.emptyCircle, Shadow.clay]}>
            <Image source={require('@/assets/images/mascot/sleep.png')} style={styles.emptyBear} contentFit="contain" />
          </View>
          <AppText style={styles.emptyTitle}>Belum Ada Notifikasi</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
            Kabar soal pengajuan, sesi, dan pesan baru akan muncul di sini
          </AppText>
        </View>
        </EmptyFill>
      ) : (
        GROUPS.map((g) => {
          const list = visible.filter((n) => n.group === g.id);
          if (list.length === 0) return null;
          return (
            <View key={g.id} style={styles.group}>
              <SectionHeader title={g.title} right={<AppText variant="caption">{list.length} Notifikasi</AppText>} />
              {list.map((n) => (
                <NotificationCard key={n.id} item={n} unread={unreadIds.has(n.id)} />
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

function NotificationCard({ item, unread }: { item: TeacherNotification; unread: boolean }) {
  const t = Tones[item.tone];
  const open = () => {
    markNotificationRead(item.id);
    router.push(item.href);
  };

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
          {unread && <View style={styles.unreadDot} />}
        </View>
        <AppText style={[styles.body, item.quote && styles.quote]} numberOfLines={2}>
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
  markAll: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllOff: {
    opacity: 0.45,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
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
  quote: {
    fontStyle: 'italic',
    color: Colors.text,
  },
  action: {
    height: 42,
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
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
