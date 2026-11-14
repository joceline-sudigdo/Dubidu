import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { showAlert } from '@/lib/dialog';
import { loadBalance, useBalance, withdraw } from '@/lib/payout-store';
import { loadTransactions, useTransactions } from '@/lib/transactions-store';

// pencairan pendapatan shadow teacher & psikolog ke rekening utama
export default function PencairanScreen() {
  const balance = useBalance();
  const transactions = useTransactions();
  const [amountText, setAmountText] = useState('');
  const [processing, setProcessing] = useState(false);
  const dest = balance.account;
  const MIN_PAYOUT = balance.minPayout;
  const PAYOUT_FEE = balance.payoutFee;

  // saldo & rekening bisa berubah (diganti di Rekening Pencairan / diproses admin), muat ulang saat layar dibuka
  useFocusEffect(
    useCallback(() => {
      loadBalance().catch(() => {});
      loadTransactions().catch(() => {});
    }, [])
  );

  const amount = Number(amountText.replace(/\D/g, '')) || 0;
  const error =
    amount === 0
      ? ''
      : amount < MIN_PAYOUT
        ? `Minimal pencairan ${formatRupiah(MIN_PAYOUT)}`
        : amount > balance.available
          ? 'Melebihi saldo yang bisa dicairkan'
          : '';
  const history = transactions.filter((t) => t.title.startsWith('Tarik saldo')).slice(0, 3);
  const destLabel = dest ? `${dest.bankName} ${dest.accountNumberMasked}` : '';

  const setQuick = (ratio: number) => setAmountText(String(Math.floor((balance.available * ratio) / 1000) * 1000));

  const submit = () => {
    if (!dest) {
      showAlert('Belum ada rekening', 'Tambahkan rekening pencairan dulu ya.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Tambah rekening', onPress: () => router.push('/metode-pembayaran') },
      ]);
      return;
    }
    showAlert(
      'Cairkan pendapatan?',
      `${formatRupiah(amount)} akan ditransfer ke ${destLabel}. Biaya transfer ${formatRupiah(PAYOUT_FEE)}.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Cairkan',
          onPress: async () => {
            setProcessing(true);
            const ok = await withdraw(amount, destLabel);
            setProcessing(false);
            if (ok) {
              setAmountText('');
              showAlert(
                'Pencairan berhasil diajukan',
                `${formatRupiah(amount - PAYOUT_FEE)} akan masuk ke ${destLabel} maksimal 1x24 jam kerja.`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Screen
      header={<ScreenHeader title="Pencairan Pendapatan" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            title={processing ? 'Memproses...' : 'Cairkan Sekarang'}
            leadingIcon="download"
            disabled={processing || !amount || !!error}
            onPress={submit}
          />
        </View>
      }>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.balance, Shadow.button]}>
        <View style={styles.inline}>
          <MaterialCommunityIcons name="wallet-outline" size={18} color="rgba(255,255,255,0.85)" />
          <AppText style={styles.balanceLabel}>Saldo bisa dicairkan</AppText>
        </View>
        <AppText style={styles.balanceValue}>{formatRupiah(balance.available)}</AppText>
        <View style={styles.held}>
          <Feather name="lock" size={13} color="#FFFFFF" />
          <AppText style={styles.heldText}>
            {formatRupiah(balance.held)} ditahan · {balance.heldNote}
          </AppText>
        </View>
      </LinearGradient>

      <SectionHeader title="Jumlah pencairan" />
      <ClayCard style={styles.gap12}>
        <View style={[styles.amountField, !!error && styles.amountError]}>
          <AppText style={styles.rp}>Rp</AppText>
          <TextInput
            value={amount ? amount.toLocaleString('id-ID') : ''}
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={Colors.placeholder}
            keyboardType="number-pad"
            style={styles.amountInput}
          />
        </View>
        {!!error && (
          <AppText variant="caption" color={Colors.red}>
            {error}
          </AppText>
        )}
        <View style={styles.quick}>
          {[
            { label: '25%', ratio: 0.25 },
            { label: '50%', ratio: 0.5 },
            { label: 'Semua', ratio: 1 },
          ].map((q) => (
            <Pressable key={q.label} onPress={() => setQuick(q.ratio)} style={styles.quickChip}>
              <AppText style={styles.quickText}>{q.label}</AppText>
            </Pressable>
          ))}
        </View>
        {amount > 0 && !error && (
          <View style={styles.summary}>
            <Row label="Jumlah dicairkan" value={formatRupiah(amount)} />
            <Row label="Biaya transfer" value={`-${formatRupiah(PAYOUT_FEE)}`} />
            <Row label="Diterima di rekening" value={formatRupiah(amount - PAYOUT_FEE)} strong />
          </View>
        )}
      </ClayCard>

      <SectionHeader title="Rekening tujuan" />
      <ClayCard onPress={() => router.push('/metode-pembayaran')} style={styles.dest}>
        <View style={[styles.bank, { backgroundColor: dest ? Colors.primaryDark : Colors.textMuted }]}>
          <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.bold}>{dest?.bankName ?? 'Belum ada rekening'}</AppText>
          <AppText variant="caption">
            {dest ? `${dest.accountNumberMasked} a.n. ${dest.accountName ?? '-'}` : 'Ketuk untuk menambahkan'}
          </AppText>
        </View>
        <AppText variant="link" style={styles.small}>
          Ubah
        </AppText>
      </ClayCard>

      {history.length > 0 && (
        <>
          <SectionHeader
            title="Pencairan terakhir"
            right={
              <Pressable onPress={() => router.push('/riwayat-transaksi')} hitSlop={8}>
                <AppText variant="link" style={styles.small}>
                  Semua
                </AppText>
              </Pressable>
            }
          />
          <ClayCard style={styles.gap12}>
            {history.map((t) => (
              <View key={t.id} style={styles.historyRow}>
                <View style={styles.flex}>
                  <AppText style={styles.bold}>{formatRupiah(Math.abs(t.amount))}</AppText>
                  <AppText variant="caption">
                    {t.date} · {t.method}
                  </AppText>
                </View>
                <AppText variant="caption" color={Colors.green}>
                  {t.status}
                </AppText>
              </View>
            ))}
          </ClayCard>
        </>
      )}

      <SecureNote text="Pencairan diproses di hari kerja. Dana masuk maksimal 1x24 jam setelah diajukan." />
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption">{label}</AppText>
      <AppText style={[styles.rowValue, strong && { color: Colors.green }]}>{value}</AppText>
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
  gap12: {
    gap: 12,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  small: {
    fontSize: 14,
  },
  balance: {
    borderRadius: Radius.lg,
    padding: 20,
    gap: 6,
  },
  balanceLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  balanceValue: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 42,
    color: '#FFFFFF',
  },
  held: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heldText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 60,
  },
  amountError: {
    borderColor: Colors.red,
  },
  rp: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.text,
  },
  quick: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    paddingVertical: 9,
  },
  quickText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  summary: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  dest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bank: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
