import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import type { UserRole } from '@/lib/auth';
import { useChatThreads } from '@/lib/chat-store';
import { getSession } from '@/lib/session';

type Filter = 'all' | 'unread' | 'active' | 'done';

// ajakan saat belum ada chat, beda tiap role
const EMPTY: Record<UserRole, { text: string; cta?: { label: string; href: Href } }> = {
  parent: {
    text: 'Mulai cari shadow teacher yang cocok untuk si kecil dan kirim pesan pertama.',
    cta: { label: 'Cari shadow teacher', href: '/cari-teacher' },
  },
  teacher: {
    text: 'Mulai cari anak yang membutuhkan bantuan dan ajukan diri untuk memulai percakapan pertama.',
    cta: { label: 'Cari anak', href: '/teacher/cari-anak' },
  },
  psychologist: {
    text: 'Percakapan dengan orang tua dan shadow teacher akan muncul setelah ada booking konsultasi.',
  },
};

const SEARCH_PLACEHOLDER: Record<UserRole, string> = {
  parent: 'Cari shadow teacher atau psikolog...',
  teacher: 'Cari orang tua atau nama anak...',
  psychologist: 'Cari orang tua atau shadow teacher...',
};

// semua role punya pencarian & filter yang sama
export function ChatListScreen() {
  const role = getSession().role;
  const all = useChatThreads().filter((t) => t.owner === role);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const q = query.trim().toLowerCase();
  const chatThreads = all
    .filter((t) =>
      filter === 'all' ? true : filter === 'unread' ? t.unread > 0 : filter === 'done' ? t.done : !t.done
    )
    .filter((t) => !q || `${t.name} ${t.child}`.toLowerCase().includes(q));
  const counts = {
    all: all.length,
    unread: all.filter((t) => t.unread > 0).length,
    active: all.filter((t) => !t.done).length,
    done: all.filter((t) => t.done).length,
  };
  const empty = EMPTY[role];

  if (all.length === 0) {
    return (
      <Screen>
        <TabHeader title="Chat" />
        <View style={styles.empty}>
          <View style={[styles.emptyArt, Shadow.clay]}>
            <Image source={require('@/assets/images/mascot/wait.png')} style={styles.emptyBear} contentFit="contain" />
          </View>
          <AppText style={styles.emptyTitle}>Belum Ada Percakapan</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
            {empty.text}
          </AppText>
          {empty.cta && (
            <PrimaryButton
              title={empty.cta.label}
              leadingIcon="search"
              onPress={() => router.push(empty.cta!.href)}
              style={styles.emptyButton}
            />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TabHeader title="Chat" />
      <>
        <View style={[styles.search, Shadow.soft]}>
          <Feather name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={SEARCH_PLACEHOLDER[role]}
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable accessibilityLabel="Hapus pencarian" hitSlop={8} onPress={() => setQuery('')}>
              <Feather name="x-circle" size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <EdgeScroll contentContainerStyle={styles.filters}>
          {(
            [
              ['all', 'Semua'],
              ['unread', 'Belum dibaca'],
              ['active', 'Aktif'],
              ['done', 'Selesai'],
            ] as const
          ).map(([id, label]) => (
            <Pill
              key={id}
              size="md"
              tone="blue"
              solid={filter === id}
              label={`${label} (${counts[id]})`}
              onPress={() => setFilter(id)}
              style={filter !== id && styles.idle}
            />
          ))}
        </EdgeScroll>
      </>

      {chatThreads.length === 0 && (
        <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
          Tidak ada percakapan yang cocok.
        </AppText>
      )}
      {chatThreads.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: t.id } })}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          <View>
            <Avatar name={t.name} size={52} />
            {t.online && <View style={styles.online} />}
          </View>
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <AppText style={styles.name} numberOfLines={1}>
                {t.name}
              </AppText>
              {t.verified && <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.primary} />}
            </View>
            <AppText variant="caption" color={Colors.primary}>
              {t.role} • {t.child}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {t.preview}
            </AppText>
          </View>
          <View style={styles.meta}>
            <AppText variant="caption">{t.time}</AppText>
            {t.unread > 0 && (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{t.unread}</AppText>
              </View>
            )}
            {t.done && <Pill label="Selesai" tone="gray" />}
          </View>
        </Pressable>
      ))}
      <SecureNote text="Percakapan dilindungi enkripsi privasi keluarga & profesional resmi Dubidu." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  // kartu chat flat: cukup garis tepi tipis, tanpa bayangan clay
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowPressed: {
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  online: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    flexShrink: 1,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.blueMid,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  filters: {
    gap: 10,
    paddingBottom: 6,
  },
  idle: {
    backgroundColor: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 40,
    paddingHorizontal: 12,
  },
  emptyArt: {
    width: 220,
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyBear: {
    width: 170,
    height: 140,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});
