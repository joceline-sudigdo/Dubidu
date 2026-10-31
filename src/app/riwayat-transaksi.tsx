import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { showAlert } from '@/lib/dialog';
import { downloadPdf } from '@/lib/pdf';
import { getSession } from '@/lib/session';
import { useTransactions, type Transaction } from '@/lib/transactions-store';

const FILTERS = ['Semua', 'Masuk', 'Keluar'] as const;

// riwayat transaksi semua role: orang tua (pembayaran), teacher & psikolog (pencairan)
export default function RiwayatTransaksiScreen() {
  const list = useTransactions();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua');
  const isParent = getSession().role === 'parent';
  const shown = list.filter((t) => filter === 'Semua' || (filter === 'Masuk' ? t.amount > 0 : t.amount < 0));
  const total = list.filter((t) => t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);

  const open = (t: Transaction) =>
    showAlert(t.title, `${t.subtitle}\n${t.date} · ${t.method}\n${t.amount > 0 ? '+' : '-'}${formatRupiah(Math.abs(t.amount))} · ${t.status}`, [
      { text: 'Tutup', style: 'cancel' },
      {
        text: 'Unduh bukti',
        onPress: () =>
          downloadPdf(`Bukti Transaksi ${t.title}`, t.date, [
            {
              title: 'Rincian Transaksi',
              rows: [
                ['Transaksi', t.title],
                ['Keterangan', t.subtitle],
                ['Metode', t.method],
                ['Jumlah', `${t.amount > 0 ? '+' : '-'}${formatRupiah(Math.abs(t.amount))}`],
                ['Status', t.status],
              ],
            },
          ]),
      },
    ]);

  return (
    <Screen header={<ScreenHeader title="Riwayat Transaksi" />} edges={['top', 'bottom']}>
      <ClayCard tone="blue" style={styles.summary}>
        <AppText variant="caption">{isParent ? 'Total pengeluaran' : 'Total dana diterima'}</AppText>
        <AppText style={styles.total}>{formatRupiah(Math.abs(total))}</AppText>
        <AppText variant="caption">{list.length} transaksi tercatat</AppText>
      </ClayCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill key={f} label={f} size="md" tone="blue" solid={filter === f} onPress={() => setFilter(f)} style={filter !== f && styles.white} />
        ))}
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyState title="Belum ada transaksi" />
      ) : (
        <ClayCard style={styles.list}>
          {shown.map((t, i) => {
            const incoming = t.amount > 0;
            return (
              <Pressable key={t.id} onPress={() => open(t)} style={[styles.row, i < shown.length - 1 && styles.divider]}>
                <View style={[styles.icon, { backgroundColor: incoming ? Colors.greenSoft : Colors.primarySoft }]}>
                  <Feather name={incoming ? 'arrow-down-left' : 'arrow-up-right'} size={18} color={incoming ? Colors.green : Colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.title} numberOfLines={1}>
                    {t.title}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {t.subtitle}
                  </AppText>
                  <AppText variant="caption" style={styles.meta}>
                    {t.date} · {t.method}
                  </AppText>
                </View>
                <View style={styles.right}>
                  <AppText style={[styles.amount, { color: incoming ? Colors.green : Colors.text }]}>
                    {incoming ? '+' : '-'}
                    {formatRupiah(Math.abs(t.amount))}
                  </AppText>
                  <Pill label={t.status} tone={t.status === 'Berhasil' ? 'green' : 'yellow'} />
                </View>
              </Pressable>
            );
          })}
        </ClayCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  summary: {
    alignItems: 'center',
    gap: 2,
  },
  total: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.primaryDark,
  },
  filters: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  meta: {
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
});
