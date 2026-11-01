import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { showActionSheet, showAlert, showPrompt } from '@/lib/dialog';
import { getMethods, saveMethods, type Method } from '@/lib/payment-methods';
import { getPayoutAccount, loadBalance, savePayoutAccount } from '@/lib/payout-store';
import { getSession } from '@/lib/session';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const PAY_OPTIONS: { label: string; icon: IconName; color: string; ask: string }[] = [
  { label: 'GoPay', icon: 'wallet', color: '#00AED6', ask: 'Nomor HP GoPay' },
  { label: 'OVO', icon: 'wallet', color: '#4C2A86', ask: 'Nomor HP OVO' },
  { label: 'Kartu Debit/Kredit', icon: 'credit-card', color: Colors.primaryDark, ask: 'Nomor kartu' },
];
const BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI'];

const mask = (v: string) => `•••• ${v.replace(/\D/g, '').slice(-4)}`;

// orang tua: metode pembayaran, teacher & psikolog: rekening pencairan
export default function MetodePembayaranScreen() {
  const role = getSession().role;
  const kind = role === 'parent' ? 'pay' : 'payout';
  const [list, setList] = useState(getMethods(role).list);
  const [main, setMain] = useState(getMethods(role).main);

  // teacher & psikolog: satu rekening pencairan yang tersimpan di server
  useEffect(() => {
    if (kind !== 'payout') return;
    loadBalance()
      .then(() => {
        const account = getPayoutAccount();
        const fromServer: Method[] = account
          ? [{ id: 'server', label: account.bankName, detail: `${account.accountNumberMasked} a.n. ${account.accountName ?? '-'}`, icon: 'bank', color: Colors.primaryDark }]
          : [];
        setList(fromServer);
        setMain(fromServer[0]?.id ?? '');
      })
      .catch(() => {});
  }, [kind]);

  const savePayout = (bank: string, number: string) =>
    showPrompt({
      title: 'Nama pemilik rekening',
      value: getSession().name,
      placeholder: 'Sesuai buku tabungan',
      submitText: 'Simpan',
      onSubmit: async (name) => {
        try {
          const account = await savePayoutAccount(bank, number.replace(/\D/g, ''), name.trim());
          const saved: Method = { id: 'server', label: account.bankName, detail: `${account.accountNumberMasked} a.n. ${account.accountName ?? '-'}`, icon: 'bank', color: Colors.primaryDark };
          commit([saved], saved.id);
          showAlert('Rekening disimpan', 'Pencairan berikutnya akan ditransfer ke rekening ini.');
        } catch (e) {
          showAlert('Rekening belum tersimpan', errorMessage(e));
        }
      },
    });

  const commit = (nextList: Method[], nextMain: string) => {
    saveMethods(role, nextList, nextMain);
    setList(nextList);
    setMain(nextMain);
  };

  const askNumber = (m: Omit<Method, 'id' | 'detail'>, question: string, suffix = '') =>
    showPrompt({
      title: `Tambah ${m.label}`,
      value: '',
      placeholder: question,
      keyboardType: 'number-pad',
      submitText: 'Simpan',
      onSubmit: (v) => {
        if (v.replace(/\D/g, '').length < 6) {
          showAlert('Nomor belum valid', 'Periksa kembali nomornya ya.');
          return;
        }
        if (kind === 'payout') {
          savePayout(m.label, v);
          return;
        }
        const added = { ...m, id: `${m.label}-${Date.now()}`, detail: `${mask(v)}${suffix}` };
        commit([...list, added], list.length ? main : added.id);
        showAlert('Berhasil disimpan', `${m.label} sudah ditambahkan.`);
      },
    });

  const add = () =>
    showActionSheet({
      title: kind === 'pay' ? 'Tambah metode pembayaran' : 'Pilih bank',
      options:
        kind === 'pay'
          ? PAY_OPTIONS.map((o) => ({
              label: o.label,
              icon: o.icon === 'credit-card' ? 'credit-card' : 'smartphone',
              onPress: () => askNumber(o, o.ask),
            }))
          : BANKS.map((b) => ({
              label: b,
              icon: 'briefcase',
              onPress: () =>
                askNumber({ label: b, icon: 'bank', color: Colors.primaryDark }, 'Nomor rekening', ' a.n. pemilik akun'),
            })),
    });

  const manage = (m: Method) =>
    showActionSheet({
      title: m.label,
      options: [
        ...(m.id !== main ? [{ label: 'Jadikan utama', icon: 'check-circle' as const, onPress: () => commit(list, m.id) }] : []),
        {
          label: 'Hapus',
          icon: 'trash-2',
          destructive: true,
          onPress: () =>
            showAlert(`Hapus ${m.label}?`, 'Metode ini tidak akan muncul lagi saat pembayaran.', [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => {
                  const rest = list.filter((x) => x.id !== m.id);
                  commit(rest, m.id === main ? (rest[0]?.id ?? '') : main);
                },
              },
            ]),
        },
      ],
    });

  return (
    <Screen
      header={<ScreenHeader title={kind === 'pay' ? 'Metode Pembayaran' : 'Rekening Pencairan'} />}
      edges={['top', 'bottom']}>
      <AppText variant="caption">
        {kind === 'pay'
          ? 'Metode utama dipilih otomatis saat checkout. QRIS selalu tersedia tanpa perlu disimpan.'
          : 'Dana termin dan honor ditransfer otomatis ke rekening utama setiap pencairan.'}
      </AppText>

      <SectionHeader title={kind === 'pay' ? 'Tersimpan' : 'Rekening kamu'} />
      <ClayCard style={styles.list}>
        {list.length === 0 && <AppText variant="caption">Belum ada yang tersimpan.</AppText>}
        {list.map((m, i) => (
          <Pressable key={m.id} onPress={() => manage(m)} style={[styles.row, i < list.length - 1 && styles.divider]}>
            <View style={[styles.icon, { backgroundColor: m.color }]}>
              <MaterialCommunityIcons name={m.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <View style={styles.inline}>
                <AppText style={styles.label}>{m.label}</AppText>
                {m.id === main && <Pill label="Utama" tone="green" solid />}
              </View>
              <AppText variant="caption">{m.detail}</AppText>
            </View>
            <Feather name="more-vertical" size={18} color={Colors.textSecondary} />
          </Pressable>
        ))}
      </ClayCard>

      <PrimaryButton
        title={kind === 'pay' ? 'Tambah Metode' : 'Tambah Rekening'}
        leadingIcon="plus"
        onPress={add}
      />
      <SecureNote text="Data pembayaran disimpan terenkripsi dan tidak pernah dibagikan ke pengguna lain." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
