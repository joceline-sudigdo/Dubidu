import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { finalPrice, formatRupiah, psychologists, type Psychologist } from '@/data/parent';

const FILTERS = ['Semua', 'ADHD', 'Autisme', 'Speech Delay'] as const;
type Filter = (typeof FILTERS)[number];

const SORTS = [
  { id: 'rating', label: 'Rating Tertinggi' },
  { id: 'price', label: 'Harga Terendah' },
] as const;

export default function PilihPsikologScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Semua');
  const [sort, setSort] = useState<(typeof SORTS)[number]['id']>('rating');
  const [favorites, setFavorites] = useState<string[]>(['dimas']);

  const q = query.trim().toLowerCase();
  const list = psychologists
    .filter((p) => filter === 'Semua' || p.categories.includes(filter))
    .filter((p) => !q || [p.name, p.title, ...p.tags].some((x) => x.toLowerCase().includes(q)))
    .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : finalPrice(a) - finalPrice(b)));

  const toggleFavorite = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <Screen header={<ScreenHeader title="Konsultasi Psikolog" />} edges={['top', 'bottom']}>
      <View style={[styles.search, Shadow.soft]}>
        <Feather name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari psikolog atau spesialisasi..."
          placeholderTextColor={Colors.placeholder}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable accessibilityLabel="Hapus pencarian" hitSlop={8} onPress={() => setQuery('')}>
            <Feather name="x-circle" size={20} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f}
            label={f}
            size="md"
            tone="blue"
            solid={filter === f}
            onPress={() => setFilter(f)}
            style={filter !== f && styles.filterIdle}
          />
        ))}
      </ScrollView>

      <View style={styles.resultRow}>
        <AppText variant="caption" style={styles.flex}>
          Ditemukan {list.length} Psikolog Tersertifikasi
        </AppText>
        <Pill
          label={SORTS.find((s) => s.id === sort)!.label}
          icon="chevron-down"
          iconRight
          size="md"
          tone="gray"
          onPress={() => setSort((s) => (s === 'rating' ? 'price' : 'rating'))}
          style={styles.filterIdle}
        />
      </View>

      <View style={[styles.plus, Shadow.clay]}>
        <View style={styles.plusIcon}>
          <Feather name="star" size={22} color={Colors.yellowDark} />
        </View>
        <View style={styles.flex}>
          <View style={styles.inline}>
            <Pill label="PLUS" tone="blue" solid />
            <AppText style={styles.plusTitle}>Hemat hingga 20%</AppText>
          </View>
          <AppText variant="caption" color={Colors.text}>
            Gunakan kuota bulanan gratis tanpa biaya tambahan
          </AppText>
        </View>
        <Pill
          label="Cek Paket"
          size="md"
          tone="gray"
          onPress={() => router.push('/plus')}
          style={styles.filterIdle}
        />
      </View>

      {list.map((p) => (
        <PsychologistCard
          key={p.id}
          item={p}
          favorite={favorites.includes(p.id)}
          onToggleFavorite={() => toggleFavorite(p.id)}
        />
      ))}

      {list.length === 0 && (
        <AppText variant="caption" style={styles.empty}>
          Belum ada psikolog yang cocok dengan pencarianmu.
        </AppText>
      )}

      <ClayCard tone="gray" style={styles.note}>
        <AppText style={styles.noteTitle}>Pendampingan Ramah & Rahasia Terjamin</AppText>
        <AppText variant="caption" style={styles.center}>
          Semua psikolog terdaftar di HIMPSI dan tersertifikasi penanganan anak neurodivergen.
        </AppText>
      </ClayCard>
    </Screen>
  );
}

function PsychologistCard({
  item,
  favorite,
  onToggleFavorite,
}: {
  item: Psychologist;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const price = finalPrice(item);

  return (
    <ClayCard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.photo}>
          <Avatar name={item.name} size={72} />
        </View>
        <View style={styles.flex}>
          <View style={styles.badgeRow}>
            <Pill
              label={item.badge}
              tone={item.badgeTone}
              icon={item.badgeIcon === 'star' ? 'star' : undefined}
            />
            <View style={styles.inline}>
              <MaterialCommunityIcons name="star" size={15} color={Colors.yellow} />
              <AppText style={styles.rating}>{item.rating.toFixed(1)}</AppText>
              <AppText variant="caption">({item.reviews})</AppText>
            </View>
          </View>
          <View style={styles.inline}>
            <AppText style={styles.name}>{item.name}</AppText>
            <MaterialCommunityIcons name="check-decagram" size={17} color={Colors.primary} />
          </View>
          <View style={styles.metaRow}>
            <AppText variant="caption">{item.experience}</AppText>
            <View style={styles.inline}>
              <View style={styles.placeDot} />
              <AppText variant="caption" color={Colors.green} style={styles.place} numberOfLines={2}>
                {item.place}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tags}>
        {item.tags.map((t, i) => (
          <Pill key={t} label={t} tone={i < 2 ? 'blue' : 'gray'} />
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.flex}>
          {item.discountPercent > 0 ? (
            <View style={styles.inline}>
              <AppText variant="caption" style={styles.strike}>
                {formatRupiah(item.basePrice)}
              </AppText>
              <Pill label={`-${item.discountPercent}% Dubidu Plus`} tone="red" />
            </View>
          ) : (
            <AppText variant="caption">{item.priceLabel}</AppText>
          )}
          <AppText style={styles.price}>
            {formatRupiah(price)} <AppText variant="caption">/ {item.duration} mnt</AppText>
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={favorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          onPress={onToggleFavorite}
          style={[styles.heart, Shadow.soft]}>
          <MaterialCommunityIcons name={favorite ? 'heart' : 'heart-outline'} size={22} color={Colors.red} />
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/konsultasi/[id]', params: { id: item.id } })}
          style={[styles.book, Shadow.button]}>
          <Feather name="calendar" size={18} color="#FFFFFF" />
          <AppText style={styles.bookText}>Booking</AppText>
        </Pressable>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  center: {
    textAlign: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
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
  filterIdle: {
    backgroundColor: '#FFFFFF',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.yellowSoft,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: '#F6E2AE',
  },
  plusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    flexShrink: 1,
  },
  card: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rating: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 12,
    marginTop: 2,
  },
  placeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  place: {
    fontFamily: Fonts.bodyBold,
    flexShrink: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  price: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    color: Colors.primary,
    marginTop: 2,
  },
  heart: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  book: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  bookText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  note: {
    alignItems: 'center',
    gap: 4,
  },
  noteTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    textAlign: 'center',
  },
});
