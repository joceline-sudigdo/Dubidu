import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { PointsCard } from '@/components/shared/points-card';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { activeMatches, parentProfile as p } from '@/data/parent';
import { comingSoon, showActionSheet, showAlert, showPrompt } from '@/lib/dialog';
import { usePlus } from '@/lib/membership-store';
import { changeContact, changePhoto, updateDomicile, useProfile } from '@/lib/profile-store';
import { contactError } from '@/lib/validation';
import { startAddChild } from '@/lib/add-child';
import { useChildren } from '@/lib/children-store';

const MENU: { label: string; icon: ComponentProps<typeof Feather>['name']; href?: '/pengaturan' | '/bantuan' | '/metode-pembayaran' | '/riwayat-transaksi' | '/tersimpan' | '/observasi' }[] = [
  { label: 'Laporan Observasi Psikolog', icon: 'clipboard', href: '/observasi' },
  { label: 'Postingan Tersimpan', icon: 'bookmark', href: '/tersimpan' },
  { label: 'Pengaturan Akun', icon: 'settings', href: '/pengaturan' },
  { label: 'Metode Pembayaran', icon: 'credit-card', href: '/metode-pembayaran' },
  { label: 'Riwayat Transaksi', icon: 'file-text', href: '/riwayat-transaksi' },
  { label: 'Privasi & Keamanan', icon: 'shield', href: '/pengaturan' },
  { label: 'Pusat Bantuan', icon: 'help-circle', href: '/bantuan' },
];

const soon = (title: string) => comingSoon(title);

// email / HP: isi data baru → konfirmasi kata sandi → disimpan ke server
const editField = (title: string, value: string, key: 'email' | 'phone' | 'domicile') =>
  showPrompt({
    title,
    value: value === '-' ? '' : value,
    keyboardType: key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default',
    submitText: key === 'domicile' ? 'Simpan' : 'Lanjut',
    onSubmit: (v) => {
      const next = v.trim();
      if (key === 'domicile') {
        if (next.length < 3) return showAlert('Domisili belum tersimpan', 'Domisili minimal 3 karakter.');
        return updateDomicile(next);
      }
      const error =
        key === 'email' && !next.includes('@')
          ? 'Format email belum benar, contoh: nama@email.com.'
          : key === 'phone' && next.includes('@')
            ? 'Nomor HP hanya boleh berisi angka.'
            : contactError(next);
      if (error) return showAlert(key === 'email' ? 'Email belum diganti' : 'Nomor HP belum diganti', error);
      setTimeout(
        () =>
          showPrompt({
            title: 'Konfirmasi kata sandi',
            message: `Masukkan kata sandi untuk mengganti ${key === 'email' ? 'email' : 'nomor HP'} ke ${next}.`,
            value: '',
            placeholder: 'Kata sandi saat ini',
            secure: true,
            submitText: 'Simpan',
            onSubmit: (password) => {
              if (!password) return showAlert('Kata sandi wajib diisi');
              changeContact(key, next, password);
            },
          }),
        250
      );
    },
  });

export default function ProfilScreen() {
  const children = useChildren();
  const account = useProfile().parent;
  const plus = usePlus();

  return (
    <Screen header={<ScreenHeader title="Profile" />} edges={['top', 'bottom']}>
      <View style={styles.heroWrap}>
        <ClayCard tone="blue" style={styles.hero}>
          <AppText style={styles.name}>{p.fullName}</AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            Orang Tua dari {children.map((c) => c.name).join(', ')}
          </AppText>
          <View style={styles.inline}>
            <Feather name="map-pin" size={14} color={Colors.textSecondary} />
            <AppText variant="caption">{account.domicile}</AppText>
          </View>
        </ClayCard>
        <View style={styles.avatarWrap}>
          <Avatar name={p.fullName} size={96} ring="#FFFFFF" viewable />
          <Pressable accessibilityLabel="Ubah foto" onPress={() => changePhoto(p.fullName)} style={styles.editAvatar}>
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={[styles.verified, Shadow.soft]}>
          <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.primary} />
          <AppText style={styles.verifiedText}>Terverifikasi</AppText>
        </View>
      </View>

      <PointsCard />

      <View style={styles.stats}>
        <Stat value={String(children.length)} label="Anak Terdaftar" />
        <Stat value={String(p.sessionsDone)} label="Sesi Selesai" />
        <Stat value={String(activeMatches.length)} label="Teacher Aktif" />
      </View>

      <SectionHeader
        title="Anak Saya"
        right={
          <Pressable onPress={startAddChild} hitSlop={8} style={styles.inline}>
            <Feather name="plus" size={16} color={Colors.primary} />
            <AppText variant="link">Tambah</AppText>
          </Pressable>
        }
      />
      {children.map((c) => {
        const teacher = activeMatches.find((m) => m.child === c.name);
        return (
          <ClayCard key={c.id} onPress={() => router.push('/report-card')} style={styles.child}>
            <BearAvatar gender={c.gender ?? 'female'} size={52} />
            <View style={styles.flex}>
              <View style={styles.inline}>
                <AppText style={styles.childName}>{c.fullName}</AppText>
                <Pill inRow label={c.grade} tone="blue" />
              </View>
              <AppText variant="caption" color={Colors.primary}>
                {c.condition}
              </AppText>
              <AppText variant="caption">
                {teacher ? `Didampingi ${teacher.teacher.split(',')[0]}` : 'Belum ada pendamping'}
              </AppText>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </ClayCard>
        );
      })}

      <SectionHeader title="Informasi Akun" right={<EditLink
            onPress={() =>
              showActionSheet({
                title: 'Edit informasi akun',
                options: [
                  { label: 'Ubah email', icon: 'mail', onPress: () => editField('Ubah email', account.email, 'email') },
                  { label: 'Ubah nomor HP', icon: 'phone', onPress: () => editField('Ubah nomor HP', account.phone, 'phone') },
                  {
                    label: 'Ubah domisili',
                    icon: 'map-pin',
                    onPress: () => editField('Ubah domisili', account.domicile, 'domicile'),
                  },
                ],
              })
            }
          />} />
      <ClayCard style={styles.infoCard}>
        <InfoRow icon="mail" label="Email" value={account.email} onPress={() => editField('Ubah email', account.email, 'email')} />
        <View style={styles.divider} />
        <InfoRow
          icon="phone"
          label="Nomor HP"
          value={account.phone}
          onPress={() => editField('Ubah nomor HP', account.phone, 'phone')}
        />
        <View style={styles.divider} />
        <InfoRow icon="calendar" label="Bergabung" value={`Sejak ${p.joined}`} />
      </ClayCard>

      <SectionHeader title="Langganan" />
      <View style={[styles.plan, Shadow.clay]}>
        <View style={styles.planIcon}>
          <MaterialCommunityIcons name="crown" size={22} color={Colors.yellowDark} />
        </View>
        <View style={styles.flex}>
          <View style={styles.inline}>
            <AppText style={styles.planName}>{plus ? 'Dubidu Plus' : 'Paket Gratis'}</AppText>
            {plus && <Pill inRow label={plus === 'tahunan' ? 'Tahunan' : 'Bulanan'} tone="green" solid />}
          </View>
          <AppText variant="caption" color={Colors.text}>
            {plus ? 'Skip tanpa batas & diskon psikolog 20% aktif' : 'Upgrade untuk skip tanpa batas & diskon psikolog'}
          </AppText>
        </View>
        <Pill inRow
          label={plus ? 'Kelola' : 'Upgrade'}
          size="md"
          tone={plus ? 'gray' : 'yellow'}
          solid={!plus}
          onPress={() => router.push('/plus')}
          style={plus && styles.white}
        />
      </View>

      <ClayCard style={styles.menu}>
        {MENU.map((m, i) => (
          <Pressable
            key={m.label}
            onPress={() => (m.href ? router.push(m.href) : soon(m.label))}
            style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}>
            <Feather name={m.icon} size={20} color={Colors.primary} />
            <AppText style={styles.menuLabel}>{m.label}</AppText>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </Pressable>
        ))}
      </ClayCard>
    </Screen>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <ClayCard style={styles.stat}>
      <View style={styles.inline}>
        {icon}
        <AppText style={styles.statValue}>{value}</AppText>
      </View>
      <AppText variant="caption" style={styles.statLabel}>
        {label}
      </AppText>
    </ClayCard>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.infoRow}>
      <Feather name={icon} size={18} color={Colors.primary} />
      <AppText variant="body" color={Colors.textSecondary} style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText style={styles.infoValue} numberOfLines={1}>
        {value}
      </AppText>
      {onPress && <Feather name="edit-2" size={14} color={Colors.textSecondary} />}
    </Pressable>
  );
}

function EditLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <AppText variant="link">Edit</AppText>
    </Pressable>
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
  heroWrap: {
    paddingTop: 44,
  },
  hero: {
    paddingTop: 64,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.primaryDark,
  },
  avatarWrap: {
    position: 'absolute',
    top: 0,
    left: 20,
  },
  editAvatar: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    position: 'absolute',
    top: 30,
    left: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifiedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 100,
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.primaryDark,
  },
  statLabel: {
    textAlign: 'center',
    fontSize: 13,
  },
  child: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  childName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    flexShrink: 1,
  },
  infoCard: {
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoLabel: {
    width: 90,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.yellowSoft,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: '#F6E2AE',
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
  },
  white: {
    backgroundColor: '#FFFFFF',
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
