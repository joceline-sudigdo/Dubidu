import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { SectionHeader } from '@/components/parent/screen-header';
import { PointsCard } from '@/components/shared/points-card';
import { SkillEditor } from '@/components/teacher/skill-editor';
import { Stars } from '@/components/parent/stars';
import type { Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { teacherProfile as p } from '@/data/teacher';
import { comingSoon, showAlert, showPrompt } from '@/lib/dialog';
import { changePhoto, updateTeacher, useProfile } from '@/lib/profile-store';

const MENU: {
  label: string;
  icon: ComponentProps<typeof Feather>['name'] | 'crown';
  href?: '/pengaturan' | '/bantuan' | '/plus' | '/metode-pembayaran' | '/riwayat-transaksi' | '/tersimpan';
}[] = [
  { label: 'Dubidu Plus', icon: 'crown', href: '/plus' },
  { label: 'Postingan Tersimpan', icon: 'bookmark', href: '/tersimpan' },
  { label: 'Pengaturan Akun', icon: 'settings', href: '/pengaturan' },
  { label: 'Rekening Pencairan', icon: 'credit-card', href: '/metode-pembayaran' },
  { label: 'Riwayat Transaksi', icon: 'file-text', href: '/riwayat-transaksi' },
  { label: 'Pusat Bantuan', icon: 'help-circle', href: '/bantuan' },
];

const TONES: Tone[] = ['green', 'red', 'blue', 'yellow', 'gray'];

const saved = () => showAlert('Perubahan tersimpan');

const editPrice = (current: string) =>
  showPrompt({
    title: 'Ubah harga per sesi',
    message: 'Masukkan tarif per jam (angka saja).',
    value: current.replace(/\D/g, ''),
    keyboardType: 'number-pad',
    onSubmit: (v) => {
      const n = Number(v.replace(/\D/g, ''));
      if (!n) return showAlert('Harga tidak valid', 'Masukkan angka, contoh 150000.');
      updateTeacher({ price: `${formatRupiah(n)}/jam` });
      saved();
    },
  });

export default function TeacherProfilScreen() {
  const me = useProfile().teacher;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <View style={styles.header}>
          <BackButton />
          <AppText style={styles.headerTitle}>Profil</AppText>
          <Pressable accessibilityLabel="Pengaturan" onPress={() => router.push('/pengaturan')} style={[styles.gear, Shadow.button]}>
            <Feather name="settings" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      }>
      <View style={styles.heroWrap}>
        <ClayCard style={styles.hero}>
          <View style={styles.inline}>
            <AppText style={styles.name}>{p.name.split(',')[0]}</AppText>
            <Pressable
              accessibilityLabel="Edit spesialis"
              onPress={() =>
                showPrompt({
                  title: 'Ubah judul profil',
                  value: me.title,
                  onSubmit: (v) => {
                    updateTeacher({ title: v });
                    saved();
                  },
                })
              }
              hitSlop={8}>
              <Feather name="edit" size={20} color={Colors.primary} />
            </Pressable>
          </View>
          <AppText variant="body" color={Colors.textSecondary}>
            {me.title}
          </AppText>
          <View style={styles.inline}>
            <MaterialCommunityIcons name="star" size={18} color={Colors.yellow} />
            <AppText style={styles.bold}>{p.rating}</AppText>
            <AppText variant="caption">({p.reviewCount} ulasan)</AppText>
          </View>
        </ClayCard>
        <View style={styles.avatarWrap}>
          <Avatar name={p.name} size={100} ring="#FFFFFF" viewable />
          <Pressable accessibilityLabel="Ganti foto" onPress={() => changePhoto(p.name)} style={styles.camera}>
            <Feather name="camera" size={14} color="#FFFFFF" />
          </Pressable>
          <View style={styles.verified}>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <PointsCard />

      <View style={styles.stats}>
        <Stat value={String(p.sessionsDone)} label="Sesi Selesai" big />
        <Stat value={`Sejak ${p.joined}`} label="Bergabung" />
        <Stat value={p.responseRate} label="Tingkat Respons" big />
      </View>

      <SectionHeader title="Tentang Saya" right={<EditLink
            onPress={() =>
              showPrompt({
                title: 'Edit tentang saya',
                value: me.about,
                multiline: true,
                onSubmit: (v) => {
                  updateTeacher({ about: v });
                  saved();
                },
              })
            }
          />} />
      <ClayCard>
        <AppText style={styles.about}>{me.about}</AppText>
      </ClayCard>

      <SectionHeader title="Spesialisasi" right={<EditLink
            onPress={() =>
              showPrompt({
                title: 'Edit spesialisasi',
                message: 'Pisahkan dengan koma, contoh: Speech Delay, ADHD & Fokus',
                value: me.specializations.join(', '),
                onSubmit: (v) => {
                  updateTeacher({ specializations: v.split(',').map((x) => x.trim()).filter(Boolean) });
                  saved();
                },
              })
            }
          />} />
      <View style={styles.chips}>
        {me.specializations.map((label, i) => {
          const tone = TONES[i % TONES.length];
          return <Pill key={label} label={label} tone={tone} solid={tone !== 'gray'} size="md" />;
        })}
      </View>

      <SectionHeader title="Level Keahlian" />
      <SkillEditor />

      <SectionHeader title="Harga & Ketersediaan" />
      <ClayCard style={styles.priceCard}>
        <InfoRow label="Harga per Sesi" value={me.price} onPress={() => editPrice(me.price)} />
        <View style={styles.divider} />
        <InfoRow
          label="Ketersediaan"
          value={me.availability}
          onPress={() =>
            showPrompt({
              title: 'Ubah ketersediaan',
              value: me.availability,
              placeholder: 'Contoh: Senin-Jumat, sore hari',
              onSubmit: (v) => {
                updateTeacher({ availability: v });
                saved();
              },
            })
          }
        />
      </ClayCard>

      <SectionHeader
        title="Ulasan dari Orang Tua"
        right={
          <Pressable onPress={() => router.push('/teacher/ulasan')} hitSlop={8}>
            <AppText variant="link">Lihat Semua ({p.reviewCount})</AppText>
          </Pressable>
        }
      />
      {p.reviews.map((r) => (
        <ClayCard key={r.name} style={styles.review}>
          <View style={styles.reviewHead}>
            <Avatar name={r.name} size={42} />
            <AppText style={styles.reviewName}>{r.name}</AppText>
            <Stars value={r.rating} />
          </View>
          <AppText style={styles.reviewText}>{r.text}</AppText>
        </ClayCard>
      ))}

      <ClayCard style={styles.menu}>
        {MENU.map((m, i) => (
          <Pressable
            key={m.label}
            onPress={() => (m.href ? router.push(m.href) : comingSoon(m.label))}
            style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}>
            {m.icon === 'crown' ? (
              <MaterialCommunityIcons name="crown" size={20} color={Colors.primary} />
            ) : (
              <Feather name={m.icon} size={20} color={Colors.primary} />
            )}
            <AppText style={styles.menuLabel}>{m.label}</AppText>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </Pressable>
        ))}
      </ClayCard>
    </Screen>
  );
}

function Stat({ value, label, big }: { value: string; label: string; big?: boolean }) {
  return (
    <View style={[styles.stat, Shadow.button]}>
      <AppText style={[styles.statValue, big && styles.statValueBig]}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

function InfoRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="body" color={Colors.textSecondary}>
        {label}
      </AppText>
      <Pressable onPress={onPress} style={styles.inline}>
        <AppText style={styles.bold}>{value}</AppText>
        <Feather name="edit-2" size={14} color={Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function EditLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <AppText variant="caption" color={Colors.text}>
        Edit
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.primaryDark,
  },
  gear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
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
  name: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text,
  },
  avatarWrap: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  camera: {
    position: 'absolute',
    left: 0,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    borderBottomWidth: 3,
    borderColor: Colors.primaryDark,
    paddingHorizontal: 8,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  statValueBig: {
    fontSize: 26,
    lineHeight: 34,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
  about: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priceCard: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  review: {
    gap: 10,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewName: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  reviewText: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    paddingLeft: 54,
  },
  menu: {
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
});
