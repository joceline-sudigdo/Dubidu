import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

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
import { showActionSheet, showAlert } from '@/lib/dialog';
import { connectTeacher } from '@/lib/matching-store';
import { useChildren } from '@/lib/children-store';

const REVIEWS = [
  { name: 'Larasita Hadi', rating: 5, text: '“Sangat sabar dan komunikatif, anak saya jadi lebih percaya diri.”' },
  { name: 'Alvin Pratama', rating: 5, text: '“Pendampingan terstruktur dan laporan hariannya selalu detail.”' },
];

// profil shadow teacher yang dilihat orang tua
export default function ProfilTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teacher = findTeacher(id);
  const child = useChildren()[0];

  if (!teacher) {
    return (
      <Screen header={<ScreenHeader title="Profil Teacher" />}>
        <EmptyState title="Profil tidak ditemukan" />
      </Screen>
    );
  }

  const skills = (Object.keys(teacher.skills) as Skill[]).sort((a, b) => teacher.skills[b] - teacher.skills[a]);
  const chatExists = !!getThread(teacher.id);

  const openMenu = () =>
    showActionSheet({
      title: teacher.name,
      options: [
        { label: 'Bagikan profil', icon: 'share-2', onPress: () => Share.share({ message: `Profil ${teacher.name} di Dubidu` }) },
        { label: 'Simpan ke favorit', icon: 'heart', onPress: () => showAlert('Tersimpan di favorit') },
        {
          label: 'Laporkan',
          icon: 'flag',
          destructive: true,
          onPress: () =>
            showAlert('Laporkan teacher?', 'Tim Dubidu akan meninjau laporanmu.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Laporkan', style: 'destructive', onPress: () => showAlert('Laporan terkirim') },
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
            <Pressable accessibilityLabel="Menu lainnya" onPress={openMenu} style={[styles.more, Shadow.soft]}>
              <Feather name="more-vertical" size={20} color={Colors.text} />
            </Pressable>
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
          <View style={styles.inline}>
            <AppText style={styles.name}>{teacher.name}</AppText>
            <MaterialCommunityIcons name="check-decagram" size={20} color={Colors.primary} />
          </View>
          <AppText variant="body" color={Colors.textSecondary}>
            Spesialis {topSkills(teacher, 2).map((k) => SKILL_LABELS[k]).join(' & ')}
          </AppText>
          <View style={styles.inline}>
            <MaterialCommunityIcons name="star" size={18} color={Colors.yellow} />
            <AppText style={styles.bold}>{teacher.rating}</AppText>
            <AppText variant="caption">({teacher.reviews} ulasan)</AppText>
          </View>
          <Pill label={`${matchScore(teacher, child)}% cocok untuk ${child.name}`} tone="blue" solid icon="star" />
        </ClayCard>
        <View style={styles.avatarWrap}>
          <Avatar name={teacher.name} size={100} ring="#FFFFFF" viewable />
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={`${teacher.experience} thn`} label="Pengalaman" />
        <Stat value={String(teacher.sessions)} label="Sesi Selesai" />
        <Stat value={`${teacher.responseRate}%`} label="Respons" />
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
      {REVIEWS.map((r) => (
        <ClayCard key={r.name} style={styles.gap10}>
          <View style={styles.reviewHead}>
            <Avatar name={r.name} size={40} />
            <AppText style={[styles.bold, styles.flex]}>{r.name}</AppText>
            <Stars value={r.rating} />
          </View>
          <AppText style={styles.reviewText}>{r.text}</AppText>
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
      <AppText style={styles.bold}>{value}</AppText>
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
  name: {
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
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
