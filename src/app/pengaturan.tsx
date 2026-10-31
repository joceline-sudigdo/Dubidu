import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { comingSoon, showActionSheet, showAlert, showPrompt } from '@/lib/dialog';
import { toggleSetting, useProfile } from '@/lib/profile-store';
import { getSession } from '@/lib/session';

type FeatherName = ComponentProps<typeof Feather>['name'];

const NOTIFICATIONS = [
  { key: 'notifPush', label: 'Notifikasi push', hint: 'Kabar penting langsung ke HP' },
  { key: 'notifChat', label: 'Pesan chat', hint: 'Saat ada pesan baru' },
  { key: 'notifReport', label: 'Laporan & jadwal', hint: 'Laporan sesi dan pengingat jadwal' },
  { key: 'notifPromo', label: 'Promo & info', hint: 'Diskon Dubidu Plus dan event komunitas' },
];

export default function PengaturanScreen() {
  const { settings } = useProfile();
  const [language, setLanguage] = useState('Bahasa Indonesia');
  const isTeacher = getSession().role === 'teacher';

  const logout = () =>
    showAlert('Keluar dari akun?', 'Kamu perlu login lagi untuk masuk.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => router.replace('/login') },
    ]);

  return (
    <Screen header={<ScreenHeader title="Pengaturan" />} edges={['top', 'bottom']}>
      <SectionHeader title="Akun" />
      <ClayCard style={styles.group}>
        <Row
          icon="lock"
          label="Ubah kata sandi"
          onPress={() =>
            showPrompt({
              title: 'Ubah kata sandi',
              message: 'Kami akan mengirim tautan ubah kata sandi ke email kamu.',
              value: '',
              placeholder: 'Email terdaftar',
              keyboardType: 'email-address',
              submitText: 'Kirim tautan',
              onSubmit: () => showAlert('Tautan terkirim', 'Cek kotak masuk email kamu.'),
            })
          }
        />
        <Row
          icon="globe"
          label="Bahasa"
          value={language}
          onPress={() =>
            showActionSheet({
              title: 'Pilih bahasa',
              options: ['Bahasa Indonesia', 'English'].map((l) => ({
                label: l,
                icon: l === language ? 'check-circle' : 'circle',
                onPress: () => setLanguage(l),
              })),
            })
          }
        />
        <Row icon="credit-card" label={isTeacher ? 'Rekening pencairan' : 'Metode pembayaran'} onPress={() => comingSoon('Pembayaran')} last />
      </ClayCard>

      <SectionHeader title="Notifikasi" />
      <ClayCard style={styles.group}>
        {NOTIFICATIONS.map((n, i) => (
          <ToggleRow
            key={n.key}
            label={n.label}
            hint={n.hint}
            value={settings[n.key]}
            onToggle={() => toggleSetting(n.key)}
            last={i === NOTIFICATIONS.length - 1}
          />
        ))}
      </ClayCard>

      <SectionHeader title="Privasi & Keamanan" />
      <ClayCard style={styles.group}>
        <ToggleRow
          label={isTeacher ? 'Tampilkan profil di pencarian' : 'Izinkan teacher melihat profil anak'}
          hint="Bisa diubah kapan saja"
          value={settings.showProfile}
          onToggle={() => toggleSetting('showProfile')}
        />
        <Row icon="shield" label="Kebijakan Privasi" onPress={() => comingSoon('Kebijakan privasi')} />
        <Row icon="file-text" label="Syarat & Ketentuan" onPress={() => comingSoon('Syarat & ketentuan')} last />
      </ClayCard>

      <SectionHeader title="Lainnya" />
      <ClayCard style={styles.group}>
        {getSession().role !== 'psychologist' && (
          <Row icon="star" label="Dubidu Plus" onPress={() => router.push('/plus')} />
        )}
        {getSession().role !== 'psychologist' && (
          <Row icon="gift" label="Doobie Rewards" onPress={() => router.push('/rewards')} />
        )}
        <Row icon="help-circle" label="Pusat Bantuan" onPress={() => router.push('/bantuan')} />
        <Row icon="info" label="Versi aplikasi" value="1.0.0" />
        <Row icon="log-out" label="Keluar" danger onPress={logout} />
        <Row
          icon="trash-2"
          label="Hapus akun"
          danger
          last
          onPress={() =>
            showAlert('Hapus akun?', 'Semua data kamu akan dihapus permanen dan tidak bisa dikembalikan.', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Hapus', style: 'destructive', onPress: () => comingSoon('Hapus akun') },
            ])
          }
        />
      </ClayCard>
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  danger,
  last,
  onPress,
}: {
  icon: FeatherName;
  label: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  const color = danger ? Colors.red : Colors.primary;
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.row, !last && styles.border]}>
      <Feather name={icon} size={20} color={color} />
      <AppText style={[styles.label, danger && { color: Colors.red }]}>{label}</AppText>
      {value && <AppText variant="caption">{value}</AppText>}
      {onPress && <Feather name="chevron-right" size={20} color={Colors.textSecondary} />}
    </Pressable>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onToggle,
  last,
}: {
  label: string;
  hint: string;
  value: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={styles.flex}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText variant="caption">{hint}</AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.primary, false: Colors.disabled }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  group: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
