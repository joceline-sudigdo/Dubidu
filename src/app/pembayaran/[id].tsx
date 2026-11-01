import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { openImages } from '@/components/ui/image-viewer';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { api, errorMessage, uploadFile } from '@/lib/api';
import { showAlert } from '@/lib/dialog';
import { getSession } from '@/lib/session';
import { loadAppData } from '@/lib/sync';

// Pembayaran transfer manual: transfer tepat nominal (dengan kode unik) ke QRIS / rekening Dubidu,
// unggah bukti, lalu admin mengonfirmasi di web admin. Status juga dikabarkan lewat notifikasi.

type Method = {
  id: string;
  type: 'QRIS' | 'BANK_TRANSFER';
  label: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string;
  qrImageUrl: string | null;
  instructions: string | null;
};

type Checkout = {
  mode: 'manual' | 'mock' | 'midtrans';
  invoiceNo: string;
  amount: number;
  uniqueCode: number;
  amountDue: number;
  expiresAt: string;
  methods: Method[];
  steps: string[];
};

type Payment = {
  id: string;
  invoiceNo: string;
  amount: number;
  amountDue: number | null;
  status: 'PENDING' | 'VERIFYING' | 'PAID' | 'FAILED' | 'EXPIRED';
  rejectReason: string | null;
  paidAt: string | null;
};

export default function PembayaranScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [sender, setSender] = useState(getSession().name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const p = await api<Payment>(`/payments/${id}`);
    setPayment(p);
    if (p.status === 'PENDING') {
      const c = await api<Checkout>(`/payments/${id}/checkout`, { body: {} });
      if (c.mode === 'mock') {
        // server mode demo: langsung lunas
        setPayment(await api<Payment>(`/payments/${id}/pay`, { body: {} }));
        return;
      }
      setCheckout(c);
      setMethodId((current) => current ?? c.methods[0]?.id ?? null);
    }
    return p;
  }, [id]);

  useEffect(() => {
    Promise.resolve()
      .then(refresh)
      .catch((e) => setError(errorMessage(e)));
  }, [refresh]);

  // selama menunggu konfirmasi admin, cek status tiap 15 detik
  useEffect(() => {
    if (payment?.status !== 'VERIFYING') return;
    const t = setInterval(() => refresh().catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [payment?.status, refresh]);

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const submitProof = async () => {
    if (!methodId || !proofUri) return;
    setBusy(true);
    try {
      const proofUrl = await uploadFile(proofUri, 'bukti-bayar');
      await api(`/payments/${id}/proof`, { body: { methodId, proofUrl, senderName: sender.trim() } });
      await refresh();
    } catch (e) {
      showAlert('Bukti belum terkirim', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    // muat ulang data (konsultasi terkonfirmasi, status Plus, dll.) lalu kembali
    await loadAppData(getSession().role).catch(() => {});
    router.dismissAll();
  };

  if (error) {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        <ClayCard style={styles.center}>
          <Feather name="alert-circle" size={32} color={Colors.red} />
          <AppText variant="body" style={styles.centerText}>
            {error}
          </AppText>
        </ClayCard>
        <PrimaryButton title="Kembali" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!payment) {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (payment.status === 'PAID') {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, Shadow.button]}>
            <Feather name="check" size={44} color="#FFFFFF" />
          </View>
          <AppText style={styles.successTitle}>Pembayaran Berhasil!</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
            Terima kasih, pembayaran kamu sudah dikonfirmasi dan tersimpan di riwayat transaksi.
          </AppText>
        </View>
        <ClayCard style={styles.list}>
          <Row label="No. Invoice" value={payment.invoiceNo} />
          <Row label="Total Dibayar" value={formatRupiah(payment.amountDue ?? payment.amount)} last strong />
        </ClayCard>
        <PrimaryButton title="Selesai" onPress={finish} />
      </Screen>
    );
  }

  if (payment.status === 'VERIFYING') {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.waitIcon, Shadow.soft]}>
            <MaterialCommunityIcons name="timer-sand" size={40} color={Colors.yellowDark} />
          </View>
          <AppText style={styles.successTitle}>Menunggu Konfirmasi</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
            Bukti transfer sudah kami terima. Admin akan mengecek dan mengonfirmasi, biasanya kurang dari 1 jam pada
            jam kerja. Kamu akan mendapat notifikasi setelah lunas.
          </AppText>
        </View>
        <ClayCard style={styles.list}>
          <Row label="No. Invoice" value={payment.invoiceNo} />
          <Row label="Nominal Transfer" value={formatRupiah(payment.amountDue ?? payment.amount)} last strong />
        </ClayCard>
        <PrimaryButton title="Cek Status" icon="refresh-cw" onPress={() => refresh().catch((e) => showAlert('Gagal memuat', errorMessage(e)))} />
        <Pressable onPress={() => router.dismissAll()} hitSlop={8}>
          <AppText variant="link" style={styles.centerText}>
            Kembali ke beranda
          </AppText>
        </Pressable>
      </Screen>
    );
  }

  if (payment.status !== 'PENDING' || !checkout) {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        {payment.status === 'PENDING' ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <ClayCard style={styles.center}>
              <Feather name="x-circle" size={32} color={Colors.red} />
              <AppText variant="body" style={styles.centerText}>
                {payment.status === 'EXPIRED' ? 'Batas waktu pembayaran sudah lewat. Silakan pesan ulang.' : 'Pembayaran dibatalkan.'}
              </AppText>
            </ClayCard>
            <PrimaryButton title="Kembali" onPress={() => router.back()} />
          </>
        )}
      </Screen>
    );
  }

  const method = checkout.methods.find((m) => m.id === methodId);

  return (
    <Screen header={<ScreenHeader title="Selesaikan Pembayaran" />} edges={['top', 'bottom']}>
      {payment.rejectReason ? (
        <ClayCard style={styles.rejected}>
          <Feather name="alert-triangle" size={18} color={Colors.red} />
          <AppText variant="caption" style={styles.flex}>
            Bukti sebelumnya ditolak: {payment.rejectReason}. Silakan unggah ulang bukti yang benar.
          </AppText>
        </ClayCard>
      ) : null}

      <ClayCard style={styles.payCard}>
        <AppText variant="caption">Transfer tepat sebesar</AppText>
        <CopyRow text={formatRupiah(checkout.amountDue)} value={String(checkout.amountDue)} big />
        <AppText variant="caption">
          Termasuk kode unik <AppText style={styles.bold}>{checkout.uniqueCode}</AppText> agar pembayaranmu cepat dikenali.
        </AppText>
        <Countdown until={checkout.expiresAt} onExpire={() => refresh().catch(() => {})} />
      </ClayCard>

      <SectionHeader title="Pilih Tujuan Transfer" />
      {checkout.methods.length === 0 ? (
        <ClayCard>
          <AppText variant="caption">Tujuan transfer belum tersedia. Hubungi tim Dubidu lewat menu Bantuan.</AppText>
        </ClayCard>
      ) : (
        checkout.methods.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: m.id === methodId }}
            onPress={() => setMethodId(m.id)}
            style={[styles.method, Shadow.soft, m.id === methodId && styles.methodOn]}>
            <View style={styles.methodIcon}>
              <MaterialCommunityIcons name={m.type === 'QRIS' ? 'qrcode-scan' : 'bank'} size={22} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.bold}>{m.label}</AppText>
              <AppText variant="caption">a.n. {m.accountName}</AppText>
            </View>
            <View style={[styles.radio, m.id === methodId && styles.radioOn]}>{m.id === methodId && <View style={styles.radioDot} />}</View>
          </Pressable>
        ))
      )}

      {method ? (
        <ClayCard style={styles.payCard}>
          {method.type === 'QRIS' && method.qrImageUrl ? (
            <Pressable onPress={() => openImages([method.qrImageUrl!])} style={styles.qrWrap}>
              <Image source={{ uri: method.qrImageUrl }} style={styles.qr} contentFit="contain" />
              <AppText variant="caption" style={styles.centerText}>
                Scan dengan GoPay, m-banking, atau e-wallet apa pun. Ketuk untuk memperbesar.
              </AppText>
            </Pressable>
          ) : (
            <>
              <AppText variant="caption">{method.bankName} · Nomor rekening</AppText>
              <CopyRow text={method.accountNumber ?? '-'} value={method.accountNumber ?? ''} />
              <AppText variant="caption">a.n. {method.accountName}</AppText>
            </>
          )}
          {method.instructions ? <AppText variant="caption">{method.instructions}</AppText> : null}
        </ClayCard>
      ) : null}

      <SectionHeader title="Unggah Bukti Transfer" />
      <Pressable onPress={pickProof} style={[styles.upload, Shadow.soft]}>
        {proofUri ? (
          <Image source={{ uri: proofUri }} style={styles.proof} contentFit="cover" />
        ) : (
          <>
            <Feather name="upload-cloud" size={26} color={Colors.primary} />
            <AppText variant="caption">Ketuk untuk memilih screenshot / foto bukti transfer</AppText>
          </>
        )}
      </Pressable>
      <TextField label="Nama pemilik akun pengirim" icon="user" value={sender} onChangeText={setSender} placeholder="Sesuai nama di rekening / GoPay" />

      <PrimaryButton
        title={busy ? 'Mengirim bukti…' : 'Kirim Bukti Transfer'}
        icon="send"
        disabled={!method || !proofUri || sender.trim().length < 2 || busy}
        onPress={submitProof}
      />
      <SecureNote text="Pastikan nominal sama persis. Dana tersimpan aman sampai layanan selesai." />
    </Screen>
  );
}

function Row({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <AppText variant="caption">{label}</AppText>
      <AppText style={[styles.rowValue, strong && styles.rowStrong]}>{value}</AppText>
    </View>
  );
}

function CopyRow({ text, value, big }: { text: string; value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <View style={styles.copyRow}>
      <AppText style={[styles.copyText, big && styles.copyBig]} selectable>
        {text}
      </AppText>
      <Pressable
        accessibilityLabel="Salin"
        onPress={copy}
        hitSlop={8}
        style={[styles.copyButton, copied && { backgroundColor: Colors.primary }]}>
        <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? '#FFFFFF' : Colors.primary} />
        <AppText style={[styles.copyLabel, copied && { color: '#FFFFFF' }]}>{copied ? 'Disalin' : 'Salin'}</AppText>
      </Pressable>
    </View>
  );
}

function Countdown({ until, onExpire }: { until: string; onExpire: () => void }) {
  const left = () => Math.max(0, Math.floor((new Date(until).getTime() - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(left);
  useEffect(() => {
    const t = setInterval(() => {
      const s = left();
      setSeconds(s);
      if (s === 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  return (
    <View style={styles.countdown}>
      <Feather name="clock" size={14} color={Colors.yellowDark} />
      <AppText style={styles.countdownText}>
        Bayar dalam{' '}
        <AppText style={styles.countdownBold}>
          {h ? `${pad(h)}:` : ''}
          {pad(Math.floor((seconds % 3600) / 60))}:{pad(seconds % 60)}
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loader: {
    marginTop: 48,
  },
  center: {
    alignItems: 'center',
    gap: 10,
  },
  centerText: {
    textAlign: 'center',
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowValue: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  rowStrong: {
    color: Colors.primary,
    fontSize: 17,
  },
  rejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.red,
  },
  payCard: {
    gap: 8,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyText: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text,
  },
  copyBig: {
    fontSize: 26,
    color: Colors.primaryDark,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  copyLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellowSoft,
  },
  countdownText: {
    fontSize: 13,
    color: Colors.yellowDark,
  },
  countdownBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellowDark,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  methodOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  qrWrap: {
    alignItems: 'center',
    gap: 8,
  },
  qr: {
    width: 230,
    height: 230,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
  },
  upload: {
    minHeight: 140,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    overflow: 'hidden',
  },
  proof: {
    width: '100%',
    height: 220,
    borderRadius: Radius.md,
  },
  successWrap: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text,
  },
});
