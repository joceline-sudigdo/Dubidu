import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { notifications as initial, type NotificationItem } from '@/data/parent';
import { markAllNotificationsRead, markNotificationRead, useUnreadIds } from '@/lib/notification-store';
import { appLink } from '@/lib/sync';

type Filter = 'all' | NotificationItem['category'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'chat', label: 'Chat' },
  { id: 'booking', label: 'Booking' },
  { id: 'laporan', label: 'Laporan' },
];

const GROUPS = [
  { id: 'today', title: 'Hari Ini' },
  { id: 'yesterday', title: 'Kemarin' },
  { id: 'week', title: 'Minggu Ini' },
] as const;

export default function NotifikasiScreen() {
  // status dibaca disimpan di store bersama, supaya titik merah lonceng di Beranda ikut hilang
  const unreadIds = useUnreadIds();
  const items = initial.map((n) => ({ ...n, unread: unreadIds.has(n.id) }));
  const [filter, setFilter] = useState<Filter>('all');

  const unread = items.filter((n) => n.unread).length;
  const visible = filter === 'all' ? items : items.filter((n) => n.category === filter);

  const markAllRead = () => {
    markAllNotificationsRead();
  };
  const open = (n: NotificationItem) => {
    markNotificationRead(n.id);
    if (n.link) router.push(appLink(n.link, 'parent') as never);
  };

  return (
    <Screen
      fill={visible.length === 0}
      header={
        <ScreenHeader
          title="Notifikasi"
          right={
            <Pressable
              accessibilityLabel="Tandai semua dibaca"
              onPress={markAllRead}
              disabled={unread === 0}
              style={[styles.markAll, Shadow.soft, unread === 0 && { opacity: 0.5 }]}>
              <MaterialCommunityIcons name="check-all" size={22} color={Colors.primary} />
            </Pressable>
          }
        />
      }>
      <ClayCard tone="blue" style={styles.summary}>
        <View style={styles.summaryIcon}>
          <MaterialCommunityIcons name="bell-ring" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.summaryTitle}>Ruang Kabar Elisya</AppText>
          <AppText variant="caption" numberOfLines={1}>
            {unread > 0 ? `${unread} kabar membutuhkan perhatian Bunda` : 'Semua kabar sudah dibaca'}
          </AppText>
        </View>
        {unread > 0 && <Pill label={`${unread} Baru`} tone="red" solid />}
      </ClayCard>

      <EdgeScroll contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f.id}
            size="md"
            tone="blue"
            solid={filter === f.id}
            label={f.id === 'all' && unread > 0 ? `${f.label} (${unread} Baru)` : f.label}
            onPress={() => setFilter(f.id)}
            style={filter !== f.id && styles.filterIdle}
          />
        ))}
      </EdgeScroll>

      {visible.length === 0 && (
        <EmptyFill>
          <EmptyState title="Belum ada notifikasi" subtitle="Kabar soal sesi, laporan, dan pesan baru akan muncul di sini." />
        </EmptyFill>
      )}

      {GROUPS.map((g) => {
        const list = visible.filter((n) => n.group === g.id);
        if (list.length === 0) return null;
        const groupUnread = list.filter((n) => n.unread).length;
        return (
          <View key={g.id} style={styles.group}>
            <SectionHeader
              title={g.title}
              right={
                <AppText variant="caption">
                  {groupUnread > 0 ? `${groupUnread} Notifikasi baru` : 'Telah dibaca'}
                </AppText>
              }
            />
            {list.map((n) => (
              <NotificationCard key={n.id} item={n} onPress={() => open(n)} />
            ))}
          </View>
        );
      })}

      <ClayCard tone="gray" style={styles.footer}>
        <MaterialCommunityIcons name="shield-check" size={26} color={Colors.primary} />
        <View style={styles.flex}>
          <AppText style={styles.footerTitle}>Penyimpanan Aman Dubidu</AppText>
          <AppText variant="caption">
            Semua kabar penting tersimpan aman. Notifikasi lama diarsipkan otomatis setelah 30 hari untuk ketenangan
            pikiran Bunda.
          </AppText>
        </View>
      </ClayCard>
    </Screen>
  );
}

function NotificationCard({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const t = Tones[item.tone];

  return (
    <ClayCard tone={item.unread ? 'white' : 'gray'} onPress={onPress} style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: item.unread ? t.solid : t.bg }, Shadow.soft]}>
        <MaterialCommunityIcons
          name={item.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={22}
          color={item.unread ? '#FFFFFF' : t.fg}
        />
      </View>
      <View style={styles.flex}>
        <View style={styles.cardTop}>
          {item.unread && <View style={styles.unreadDot} />}
          <AppText style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText style={[styles.time, item.unread && item.tone === 'red' && { color: Colors.red }]}>
            {item.time}
          </AppText>
        </View>
        {item.quote ? (
          <View style={styles.quote}>
            <AppText style={styles.quoteText} numberOfLines={2}>
              {item.body}
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" style={styles.body} numberOfLines={3}>
            {item.body}
          </AppText>
        )}
        <View style={styles.cardBottom}>
          <Pill label={item.tag} tone={item.tagTone} />
          {item.action &&
            (item.actionPrimary ? (
              <Pill label={item.action} tone={item.tone} solid size="md" icon="arrow-right" iconRight onPress={onPress} />
            ) : (
              <Pressable onPress={onPress} hitSlop={6} style={styles.textAction}>
                <AppText style={styles.textActionLabel}>{item.action}</AppText>
                <Feather name="chevron-right" size={14} color={Colors.primary} />
              </Pressable>
            ))}
        </View>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  markAll: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
  },
  filters: {
    gap: 10,
    paddingBottom: 6,
  },
  filterIdle: {
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
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  time: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  quote: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  quoteText: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  textActionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
});
