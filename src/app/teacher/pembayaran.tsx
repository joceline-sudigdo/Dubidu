import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { paymentDetail as p } from '@/data/teacher';
import { downloadPdf } from '@/lib/pdf';


export default function PembayaranScreen() {
  return (
    <Screen header={<ScreenHeader title="Notifikasi" />} edges={['top', 'bottom']}>
      <ClayCard tone="blue" style={styles.hero}>
        <View style={[styles.icon, Shadow.button]}>
          <MaterialCommunityIcons name="wallet-outline" size={28} color="#FFFFFF" />
        </View>
        <AppText variant="body" color={Colors.textSecondary}>
          Total Dana Masuk
        </AppText>
        <AppText style={styles.amount}>{formatRupiah(p.amount)}</AppText>
        <View style={[styles.status, Shadow.soft]}>
          <Feather name="check-circle" size={16} color="#FFFFFF" />
          <AppText style={styles.statusText}>Berhasil</AppText>
        </View>
        <AppText variant="caption">{p.time}</AppText>
      </ClayCard>

      <ClayCard style={styles.detail}>
        <Row label="Untuk" value={p.forLabel} strong />
        <Row label={p.rateLabel} value={formatRupiah(p.rate)} />
        <Row label="Biaya platform" value={`-${formatRupiah(p.fee)}`} color={Colors.red} info />
        <Row label="Diterima" value={formatRupiah(p.rate - p.fee)} color={Colors.green} total last />
      </ClayCard>

      <PrimaryButton title="Unduh Bukti Transfer" leadingIcon="download" onPress={() =>
          downloadPdf('Bukti Transfer Dubidu', p.time, [
            {
              title: 'Rincian Pembayaran',
              rows: [
                ['Untuk', p.forLabel],
                [p.rateLabel, formatRupiah(p.rate)],
                ['Biaya platform', `-${formatRupiah(p.fee)}`],
                ['Diterima', formatRupiah(p.rate - p.fee)],
                ['Status', 'Berhasil'],
              ],
            },
          ])
        } />
      <Pressable onPress={() => router.push('/riwayat-transaksi')} style={styles.link}>
        <AppText variant="link">Lihat Riwayat Pembayaran</AppText>
        <Feather name="arrow-right" size={16} color={Colors.primary} />
      </Pressable>
      <SecureNote text="Dana telah ditransfer otomatis ke rekening terdaftar Anda." />
    </Screen>
  );
}

function Row({
  label,
  value,
  color = Colors.text,
  strong,
  total,
  info,
  last,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
  total?: boolean;
  info?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={styles.inline}>
        <AppText style={total ? styles.totalLabel : styles.label}>{label}</AppText>
        {info && <Feather name="info" size={15} color={Colors.textSecondary} />}
      </View>
      <AppText style={[styles.value, (strong || total) && styles.valueStrong, total && styles.totalValue, { color }]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  amount: {
    fontFamily: Fonts.heading,
    fontSize: 34,
    lineHeight: 44,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.green,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginVertical: 4,
  },
  statusText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  detail: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  totalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
  value: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  valueStrong: {
    fontSize: 17,
  },
  totalValue: {
    fontSize: 20,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
