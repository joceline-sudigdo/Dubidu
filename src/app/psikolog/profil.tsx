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
import type { Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { psychologistProfile as p } from '@/data/psychologist';
import { comingSoon, showAlert, showPrompt } from '@/lib/dialog';
import { changePhoto, updatePsychologist, useProfile } from '@/lib/profile-store';

type FeatherName = ComponentProps<typeof Feather>['name'];

const MENU: { label: string; icon: FeatherName; href?: '/pengaturan' | '/bantuan' | '/psikolog/pembayaran' | '/tersimpan' }[] = [
  { label: 'Postingan Tersimpan', icon: 'bookmark', href: '/tersimpan' },
  { label: 'Pengaturan Akun', icon: 'settings', href: '/pengaturan' },
  { label: 'Rekening & Pembayaran', icon: 'credit-card', href: '/psikolog/pembayaran' },
  { label: 'Pusat Bantuan', icon: 'help-circle', href: '/bantuan' },
];

const TONES: Tone[] = ['green', 'gray', 'red', 'blue', 'yellow'];

const saved = () => showAlert('Perubahan tersimpan');

const logout = () =>
  showAlert('Keluar dari akun?', 'Kamu perlu login lagi untuk masuk.', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Keluar', style: 'destructive', onPress: () => router.replace('/login') },
  ]);

export default function PsikologProfilScreen() {
  const me = useProfile().psychologist;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <View style={styles.header}>
          <BackButton />
          <AppText style={styles.headerTitle}>Profil</AppText>
          <Pressable
            accessibilityLabel="Pengaturan"
            onPress={() => router.push('/pengaturan')}
            style={[styles.gear, Shadow.button]}>
            <Feather name="settings" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      }>
      <View style={styles.hero}>
        <View>
          <Avatar name={p.name} size={110} ring="#FFFFFF" viewable />
          <Pressable accessibilityLabel="Ganti foto" onPress={() => changePhoto(p.name)} style={styles.camera}>
            <Feather name="camera" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        <AppText style={styles.name}>{p.name.split(',')[0]}</AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          {p.title}
        </AppText>
        <Pill label="Psikolog Mitra Dubidu" tone="blue" icon="check-circle" size="md" style={styles.center} />
      </View>

      <View style={styles.stats}>
        <Stat value={String(p.rating)} label={`${p.reviewCount} ulasan`} />
        <Stat value={String(p.consultationsThisMonth)} label="Konsultasi bulan ini" />
        <Stat value={`${p.experienceYears} tahun`} label="Pengalaman" />
      </View>

      <SectionHeader
        title="Tentang Saya"
        right={
          <EditLink
            onPress={() =>
              showPrompt({
                title: 'Edit tentang saya',
                value: me.about,
                multiline: true,
                onSubmit: (v) => {
                  updatePsychologist({ about: v });
                  saved();
                },
              })
            }
          />
        }
      />
      <ClayCard>
        <AppText style={styles.about}>{me.about}</AppText>
      </ClayCard>

      <SectionHeader title="Izin Praktik" />
      <ClayCard style={styles.list}>
        <Row label="STR" value={p.str.replace('STR ', '')} />
        <Row label="SIPP" value={p.sipp.replace('SIPP ', '')} last />
      </ClayCard>

      <SectionHeader
        title="Spesialisasi"
        right={
          <EditLink
            onPress={() =>
              showPrompt({
                title: 'Edit spesialisasi',
                message: 'Pisahkan dengan koma, contoh: Tumbuh Kembang, ADHD',
                value: me.specializations.join(', '),
                onSubmit: (v) => {
                  updatePsychologist({ specializations: v.split(',').map((x) => x.trim()).filter(Boolean) });
                  saved();
                },
              })
            }
          />
        }
      />
      <View style={styles.chips}>
        {me.specializations.map((label, i) => {
          const tone = TONES[i % TONES.length];
          return <Pill key={label} label={label} tone={tone} solid={tone !== 'gray'} size="md" />;
        })}
      </View>

      <SectionHeader title="Tarif & Jadwal Praktik" />
      <ClayCard style={styles.list}>
        <Row icon="credit-card" label="Tarif per sesi" value={formatRupiah(p.rate)} />
        <Row icon="video" label="Metode" value={p.method} />
        <Row icon="calendar" label="Jadwal" value={p.schedule} last />
      </ClayCard>

      <ClayCard style={styles.list}>
        {MENU.map((m) => (
          <Pressable
            key={m.label}
            onPress={() => (m.href ? router.push(m.href) : comingSoon(m.label))}
            style={[styles.menuRow, styles.border]}>
            <Feather name={m.icon} size={20} color={Colors.primary} />
            <AppText style={styles.menuLabel}>{m.label}</AppText>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </Pressable>
        ))}
        <Pressable onPress={logout} style={styles.menuRow}>
          <Feather name="log-out" size={20} color={Colors.red} />
          <AppText style={[styles.menuLabel, { color: Colors.red }]}>Keluar</AppText>
        </Pressable>
      </ClayCard>

      <View style={styles.footnote}>
        <MaterialCommunityIcons name="shield-check" size={18} color={Colors.textMuted} />
        <AppText variant="caption" color={Colors.textMuted} style={styles.flex}>
          Data profesi (STR, SIPP, tarif) dikelola tim Dubidu. Hubungi Pusat Bantuan untuk perubahan.
        </AppText>
      </View>
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

function Row({ icon, label, value, last }: { icon?: FeatherName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      {icon && (
        <View style={styles.rowIcon}>
          <Feather name={icon} size={16} color={Colors.primary} />
        </View>
      )}
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText variant="body" color={Colors.textSecondary} style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

function EditLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <AppText variant="link" style={styles.small}>
        Edit
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  small: {
    fontSize: 14,
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
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  center: {
    alignSelf: 'center',
  },
  camera: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    marginTop: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    minHeight: 96,
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
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
  },
  about: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  rowValue: {
    maxWidth: '58%',
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  menuLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.text,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
});
