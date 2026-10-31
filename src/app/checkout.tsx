import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { qrisSteps, vaBanks, vaSteps, type Bank, type PlusPlan } from '@/data/plus';
import { isPlusRole, subscribePlus } from '@/lib/membership-store';
import { getSession } from '@/lib/session';
import { addTransaction } from '@/lib/transactions-store';

type Method = 'qris' | 'va';
type Step = 'method' | 'pay' | 'success';

const ADMIN_FEE: Record<Method, number> = { qris: 0, va: 4000 };
const QRIS_SECONDS = 15 * 60;
const VA_SECONDS = 24 * 60 * 60;

// pembayaran demo: pilih QRIS / Virtual Account, lalu "Cek Status" -> berhasil
export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ title?: string; amount?: string; plan?: string }>();
  const amount = Number(params.amount) || 0;
  const title = params.title ?? 'Pembayaran Dubidu';

  const [orderId] = useState(() => `DBD-${Date.now().toString().slice(-8)}`);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('qris');
  const [bank, setBank] = useState<Bank>(vaBanks[0]);
  const [bankOpen, setBankOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paidAt, setPaidAt] = useState<Date | null>(null);

  const total = amount + ADMIN_FEE[method];
  const vaNumber = `${bank.prefix}${orderId.replace(/\D/g, '')}`.slice(0, 16);

  const checkStatus = () => {
    setChecking(true);
    // demo: anggap pembayaran masuk setelah 1,5 detik
    setTimeout(() => {
      setChecking(false);
      setPaidAt(new Date());
      const role = getSession().role;
      if ((params.plan === 'bulanan' || params.plan === 'tahunan') && isPlusRole(role)) {
        subscribePlus(role, params.plan as PlusPlan);
      }
      addTransaction({
        title,
        subtitle: `No. pesanan ${orderId}`,
        amount: -(amount + ADMIN_FEE[method]),
        method: method === 'qris' ? 'QRIS' : `VA ${bank.name}`,
      });
      setStep('success');
    }, 1500);
  };

  if (step === 'success' && paidAt) {
    return (
      <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, Shadow.button]}>
            <Feather name="check" size={44} color="#FFFFFF" />
          </View>
          <AppText style={styles.successTitle}>Pembayaran Berhasil!</AppText>
          <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
            Terima kasih. Pembayaran untuk {title} sudah kami terima.
          </AppText>
        </View>
        <ClayCard style={styles.list}>
          <Row label="Item" value={title} />
          <Row label="No. Pesanan" value={orderId} />
          <Row label="Metode" value={method === 'qris' ? 'QRIS' : `VA ${bank.name}`} />
          <Row
            label="Waktu"
            value={`${String(paidAt.getHours()).padStart(2, '0')}:${String(paidAt.getMinutes()).padStart(2, '0')} WIB`}
          />
          <Row label="Total Dibayar" value={formatRupiah(total)} last strong />
        </ClayCard>
        <PrimaryButton title="Selesai" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (step === 'pay') {
    return (
      <Screen header={<ScreenHeader title="Selesaikan Pembayaran" />} edges={['top', 'bottom']}>
        <ClayCard style={styles.payCard}>
          <AppText variant="caption">Total Pembayaran</AppText>
          <CopyRow text={formatRupiah(total)} value={String(total)} big />
          <Countdown seconds={method === 'qris' ? QRIS_SECONDS : VA_SECONDS} />

          {method === 'qris' ? (
            <View style={styles.qrWrap}>
              <View style={styles.qrisHead}>
                <AppText style={styles.qris}>QRIS</AppText>
                <AppText variant="caption">DUBIDU · {orderId}</AppText>
              </View>
              <FakeQR seed={orderId} />
              <AppText variant="caption" style={styles.center}>
                Scan dengan m-banking atau e-wallet apa pun (GoPay, OVO, DANA, ShopeePay, dll).
              </AppText>
              <AppText style={styles.demo}>QR demo, tidak perlu di-scan. Tekan &quot;Cek Status Pembayaran&quot;.</AppText>
            </View>
          ) : (
            <View style={styles.vaWrap}>
              <View style={styles.inline}>
                <BankBadge bank={bank} />
                <AppText style={styles.bold}>{bank.name}</AppText>
              </View>
              <AppText variant="caption">Nomor Virtual Account</AppText>
              <CopyRow text={vaNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} value={vaNumber} />
            </View>
          )}
        </ClayCard>

        <SectionHeader title="Cara Membayar" />
        <ClayCard style={styles.list}>
          {(method === 'qris' ? qrisSteps : vaSteps(bank)).map((s, i, arr) => (
            <View key={s} style={[styles.stepRow, i < arr.length - 1 && styles.divider]}>
              <View style={styles.stepNum}>
                <AppText style={styles.stepNumText}>{i + 1}</AppText>
              </View>
              <AppText variant="body" style={styles.flex}>
                {s}
              </AppText>
            </View>
          ))}
        </ClayCard>

        <Pressable
          disabled={checking}
          onPress={checkStatus}
          style={[styles.checkButton, Shadow.button, checking && { opacity: 0.8 }]}>
          {checking && <ActivityIndicator color="#FFFFFF" />}
          <AppText style={styles.checkText}>{checking ? 'Mengecek pembayaran...' : 'Cek Status Pembayaran'}</AppText>
        </Pressable>
        <Pressable onPress={() => setStep('method')} hitSlop={10} disabled={checking} style={styles.linkWrap}>
          <AppText variant="link">Ganti metode pembayaran</AppText>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title="Pembayaran" />} edges={['top', 'bottom']}>
      <SectionHeader title="Ringkasan Pesanan" />
      <ClayCard style={styles.list}>
        <Row label={title} value={formatRupiah(amount)} />
        <Row label="Biaya admin" value={ADMIN_FEE[method] ? formatRupiah(ADMIN_FEE[method]) : 'Gratis'} />
        <Row label="Total" value={formatRupiah(total)} last strong />
      </ClayCard>

      <SectionHeader title="Metode Pembayaran" />
      <MethodCard
        active={method === 'qris'}
        onPress={() => setMethod('qris')}
        icon="qrcode-scan"
        title="QRIS"
        text="Semua m-banking & e-wallet · tanpa biaya admin"
      />
      <MethodCard
        active={method === 'va'}
        onPress={() => {
          setMethod('va');
          setBankOpen(true);
        }}
        icon="bank-outline"
        title="Virtual Account"
        text={method === 'va' ? `Dipilih: ${bank.name}` : 'Transfer dari bank mana pun'}
      />

      {method === 'va' && (
        <>
          <SectionHeader
            title="Pilih Bank"
            right={
              <Pressable onPress={() => setBankOpen((o) => !o)} hitSlop={8}>
                <AppText variant="link">{bankOpen ? 'Tutup' : 'Ubah'}</AppText>
              </Pressable>
            }
          />
          <ClayCard style={styles.list}>
            {(bankOpen ? vaBanks : [bank]).map((b, i, arr) => {
              const on = b.key === bank.key;
              return (
                <Pressable
                  key={b.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setBank(b);
                    setBankOpen(false);
                  }}
                  style={[styles.bankItem, i < arr.length - 1 && styles.divider]}>
                  <BankBadge bank={b} />
                  <AppText style={[styles.flex, on ? styles.bold : styles.bankText]}>{b.name}</AppText>
                  <Radio on={on} />
                </Pressable>
              );
            })}
          </ClayCard>
        </>
      )}

      <SecureNote text="Pembayaran diproses aman. Mode demo: tidak ada uang yang ditarik." />
      <PrimaryButton title={`Bayar ${formatRupiah(total)}`} onPress={() => setStep('pay')} />
    </Screen>
  );
}

function Row({ label, value, last, strong }: { label: string; value: string; last?: boolean; strong?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <AppText style={[styles.flex, strong ? styles.bold : styles.rowLabel]}>{label}</AppText>
      <AppText style={[styles.rowValue, strong && styles.rowStrong]}>{value}</AppText>
    </View>
  );
}

function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>;
}

function MethodCard({
  active,
  onPress,
  icon,
  title,
  text,
}: {
  active: boolean;
  onPress: () => void;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  text: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.method, Shadow.soft, active && styles.methodOn]}>
      <View style={styles.methodIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.bold}>{title}</AppText>
        <AppText variant="caption">{text}</AppText>
      </View>
      <Radio on={active} />
    </Pressable>
  );
}

function BankBadge({ bank }: { bank: Bank }) {
  return (
    <View style={[styles.bankBadge, { backgroundColor: bank.color }]}>
      <AppText style={styles.bankBadgeText}>{bank.short}</AppText>
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

function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(left / 3600);
  return (
    <View style={styles.countdown}>
      <Feather name="clock" size={14} color={Colors.yellowDark} />
      <AppText style={styles.countdownText}>
        Bayar dalam{' '}
        <AppText style={styles.countdownBold}>
          {h ? `${pad(h)}:` : ''}
          {pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
        </AppText>
      </AppText>
    </View>
  );
}

// kode QR tiruan dari seed (hanya visual)
function FakeQR({ seed, size = 210 }: { seed: string; size?: number }) {
  const n = 25;
  const cell = size / n;
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h >>> 16) & 1;
  };
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f === 1 || (f === -1 && rand())) cells.push({ x, y });
    }
  }
  return (
    <View style={[styles.qrBox, { width: size + 24, height: size + 24 }]}>
      <View style={{ width: size, height: size }}>
        {cells.map((c) => (
          <View
            key={`${c.x}-${c.y}`}
            style={{ position: 'absolute', left: c.x * cell, top: c.y * cell, width: cell, height: cell, backgroundColor: Colors.text }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  list: {
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  rowStrong: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.primary,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  methodOn: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  bankText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  bankBadge: {
    width: 46,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  payCard: {
    alignItems: 'center',
    gap: 10,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
  },
  copyBig: {
    fontSize: 28,
    lineHeight: 36,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  copyLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primary,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countdownText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.yellowDark,
  },
  countdownBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellowDark,
  },
  qrWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  qrisHead: {
    alignItems: 'center',
  },
  qris: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.red,
    letterSpacing: 2,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demo: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
  },
  vaWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  checkButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  checkText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  linkWrap: {
    alignItems: 'center',
  },
  successWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
  },
});
