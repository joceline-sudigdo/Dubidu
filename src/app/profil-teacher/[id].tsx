import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Stars } from '@/components/parent/stars';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { findTeacher, formatPrice, matchScore, SKILL_LABELS, topSkills, type Skill } from '@/data/teachers';
import { getThread } from '@/lib/chat-store';
import { api } from '@/lib/api';
import { reportContent } from '@/lib/community-store';
import { showActionSheet, showAlert } from '@/lib/dialog';
import { connectTeacher, loadTeacher, useMatching } from '@/lib/matching-store';
import { useChildren } from '@/lib/children-store';
import { startAddChild } from '@/lib/add-child';
import { isFavorite, toggleFavorite, useFavorites } from '@/lib/favorites-store';
import { shareTeacher } from '@/lib/share';

// ulasan contoh hanya untuk teacher contoh (id "t-...") di akun demo; teacher dari server memakai ulasan asli
const DEMO_REVIEWS = [
  { name: 'Larasita Hadi', rating: 5, text: 'Sangat sabar dan komunikatif, anak saya jadi lebih percaya diri.' },
  { name: 'Alvin Pratama', rating: 5, text: 'Pendampingan terstruktur dan laporan hariannya selalu detail.' },
];

type Review = { name: string; rating: number; text: string | null };

// profil shadow teacher yang dilihat orang tua
export default function ProfilTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useMatching(); // tampil ulang setelah profil dari server dimuat
  const favorites = useFavorites();
  const teacher = findTeacher(id);
  const child = useChildren()[0];
  const [missing, setMissing] = useState(false);
  const isDemoTeacher = !!id?.startsWith('t-');
  const [reviews, setReviews] = useState<Review[] | null>(isDemoTeacher ? DEMO_REVIEWS : null);

  // ulasan asli dari orang tua (GET /teachers/:id); teacher baru = daftar kosong
  useEffect(() => {
    if (!id || isDemoTeacher) return;
    api<{ reviews: { name: string; rating: number; quote: string | null }[] }>(`/teachers/${id}`)
      .then((d) => setReviews(d.reviews.map((r) => ({ name: r.name, rating: r.rating, text: r.quote }))))
      .catch(() => setReviews([]));
  }, [id, isDemoTeacher]);

  useEffect(() => {
    if (id && !findTeacher(id)) loadTeacher(id).catch(() => setMissing(true));
  }, [id]);

  if (!teacher) {
    return (
      <Screen header={<ScreenHeader title="Profil Teacher" />}>
        {missing ? <EmptyState title="Profil tidak ditemukan" /> : null}
      </Screen>
    );
  }

  const skills = (Object.keys(teacher.skills) as Skill[]).sort((a, b) => teacher.skills[b] - teacher.skills[a]);
  const chatExists = !!getThread(teacher.id);
  const favorite = isFavorite(favorites, 'teachers', teacher.id);
  const toggleFav = () =>
    showAlert(toggleFavorite('teachers', teacher.id) ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');

  const openMenu = () =>
    showActionSheet({
      title: teacher.name,
      options: [
        { label: 'Bagikan profil', icon: 'share-2', onPress: () => shareTeacher(teacher) },
        // label mengikuti status: yang sudah difavoritkan tampil sebagai "Hapus dari favorit"
        { label: favorite ? 'Hapus dari favorit' : 'Simpan ke favorit', icon: 'heart', onPress: toggleFav },
        {
          label: 'Laporkan',
          icon: 'flag',
          destructive: true,
          onPress: () =>
            showAlert('Laporkan teacher?', 'Tim Dubidu akan meninjau laporanmu.', [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Laporkan',
                style: 'destructive',
                onPress: async () => {
                  if (await reportContent('USER', teacher.id, 'Profil atau perilaku tidak pantas')) showAlert('Laporan terkirim');
                },
              },
            ]),
        },
      ],
    });

  return (
    <Screen
      header={
        <ScreenHeader
          title="Profil Teacher"
          right={
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: favorite }}
                accessibilityLabel={favorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                onPress={toggleFav}
                style={[styles.more, Shadow.soft, favorite && styles.favOn]}>
                <MaterialCommunityIcons name={favorite ? 'heart' : 'heart-outline'} size={20} color={Colors.red} />
              </Pressable>
              <Pressable accessibilityLabel="Menu lainnya" onPress={openMenu} style={[styles.more, Shadow.soft]}>
                <Feather name="more-vertical" size={20} color={Colors.text} />
              </Pressable>
            </View>
          }
        />
      }
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            title={chatExists ? 'Buka Chat' : 'Connect & Kirim Penawaran'}
            leadingIcon={chatExists ? 'chat' : 'send'}
            onPress={() =>
              chatExists
                ? router.push({ pathname: '/chat/[id]', params: { id: teacher.id } })
                : !child
                  ? // akun tanpa profil anak: arahkan isi profil anak dulu, jangan crash
                    showAlert('Tambahkan profil anak dulu', 'Penawaran dikirim atas nama profil anak.', [
                      { text: 'Nanti', style: 'cancel' },
                      { text: 'Tambah Anak', onPress: startAddChild },
                    ])
                  : showAlert('Kirim penawaran?', `Pesan penawaran untuk ${child.name} akan dikirim ke ${teacher.name}.`, [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Kirim', onPress: () => connectTeacher(teacher, child) },
                  ])
            }
          />
        </View>
      }>
      <View style={styles.heroWrap}>
        <ClayCard style={styles.hero}>
          <View style={styles.nameRow}>
            <AppText style={styles.name}>{teacher.name}</AppText>
            <MaterialCommunityIcons name="check-decagram" size={20} color={Colors.primary} />
          </View>
          <AppText variant="body" color={Colors.textSecondary}>
            Spesialis {topSkills(teacher, 2).map((k) => SKILL_LABELS[k]).join(' & ')}
          </AppText>
          <View style={styles.inline}>
            <MaterialCommunityIcons name="star" size={18} color={Colors.yellow} />
            {teacher.reviews > 0 ? (
              <>
                <AppText style={styles.bold}>{teacher.rating}</AppText>
                <AppText variant="caption">({teacher.reviews} ulasan)</AppText>
              </>
            ) : (
              <AppText variant="caption">Belum ada ulasan</AppText>
            )}
          </View>
          {child && (
            <Pill label={`${matchScore(teacher, child)}% cocok untuk ${child.name}`} tone="blue" solid icon="star" />
          )}
        </ClayCard>
        <View style={styles.avatarWrap}>
          <Avatar name={teacher.name} size={100} ring="#FFFFFF" viewable />
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={`${teacher.experience} thn`} label="Pengalaman" />
        <Stat value={String(teacher.sessions)} label="Sesi Selesai" />
        <Stat value={`${teacher.responseRate ?? 0}%`} label="Respons" />
      </View>

      <SectionHeader title="Tentang" />
      <ClayCard>
        <AppText style={styles.about}>{teacher.about}</AppText>
      </ClayCard>

      <SectionHeader title="Keahlian" />
      <ClayCard style={styles.gap12}>
        {skills.map((k) => (
          <View key={k} style={styles.skillRow}>
            <AppText variant="caption" color={Colors.text} style={styles.skillLabel}>
              {SKILL_LABELS[k]}
            </AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${teacher.skills[k]}%` }]} />
            </View>
            <AppText style={styles.skillValue}>{teacher.skills[k]}</AppText>
          </View>
        ))}
      </ClayCard>

      <SectionHeader title="Info Layanan" />
      <ClayCard style={styles.list}>
        <InfoRow icon="map-pin" label="Domisili" value={teacher.city} />
        <InfoRow icon="credit-card" label="Tarif" value={formatPrice(teacher.price)} last />
      </ClayCard>

      <SectionHeader title="Ulasan dari Orang Tua" />
      {reviews?.length === 0 && (
        <ClayCard style={styles.noReview}>
          <MaterialCommunityIcons name="star-outline" size={22} color={Colors.textMuted} />
          <AppText variant="caption" style={styles.flex}>
            Belum ada ulasan. Ulasan muncul setelah orang tua menyelesaikan sesi pendampingan bersama teacher ini.
          </AppText>
        </ClayCard>
      )}
      {(reviews ?? []).map((r, i) => (
        <ClayCard key={`${r.name}-${i}`} style={styles.gap10}>
          <View style={styles.reviewHead}>
            <Avatar name={r.name} size={40} />
            <AppText style={[styles.bold, styles.flex]} numberOfLines={1}>
              {r.name}
            </AppText>
            <Stars value={r.rating} />
          </View>
          {!!r.text && <AppText style={styles.reviewText}>“{r.text}”</AppText>}
        </ClayCard>
      ))}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.stat, Shadow.button]}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: 'map-pin' | 'credit-card'; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.border]}>
      <Feather name={icon} size={18} color={Colors.primary} />
      <AppText variant="body" color={Colors.textSecondary} style={styles.flex}>
        {label}
      </AppText>
      <AppText style={[styles.bold, styles.infoValue]} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gap10: {
    gap: 10,
  },
  gap12: {
    gap: 12,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  favOn: {
    backgroundColor: Colors.redSoft,
  },
  more: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingTop: 50,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 6,
  },
  avatarWrap: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  // nama + gelar yang panjang tetap di tengah dan membungkus, ikon verified ikut di ujung
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    borderBottomWidth: 3,
    borderColor: Colors.primaryDark,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  about: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skillLabel: {
    width: 110,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  skillValue: {
    width: 28,
    textAlign: 'right',
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  list: {
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewText: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
