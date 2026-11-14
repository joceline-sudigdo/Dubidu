import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatRupiah } from '@/data/parent';
import { plusBenefits, plusCompare, plusPlans, type PlusPlan } from '@/data/plus';
import { api } from '@/lib/api';
import { showAlert } from '@/lib/dialog';
import { cancelPlus, isPlusRole, usePlus } from '@/lib/membership-store';
import { getSession } from '@/lib/session';

const GOLD = '#8A6A0C';

// Dubidu Plus: isi menyesuaikan role (orang tua / shadow teacher)
export default function PlusScreen() {
  const role = getSession().role;
  const plus = usePlus();
  const [plan, setPlan] = useState<PlusPlan>(plus ?? 'tahunan');

  if (!isPlusRole(role)) {
    return (
      <Screen header={<ScreenHeader title="Dubidu Plus" />}>
        <EmptyState title="Khusus orang tua & teacher" subtitle="Akun psikolog mitra sudah mendapat semua fitur profesional." />
      </Screen>
    );
  }

  const teacher = role === 'teacher';
  const plans = plusPlans[role];
  const chosen = plans.find((p) => p.key === plan)!;

  const subscribe = () => router.push({ pathname: '/checkout', params: { plan } });

  const downgrade = teacher
    ? 'kuota skip kembali 5 anak per hari dan biaya platform kembali 10%.'
    : 'kuota skip kembali 5 teacher per hari dan diskon psikolog tidak berlaku lagi.';

  // akun demo: Plus langsung berhenti supaya alur langganan bisa dicoba ulang.
  // Kalau server belum punya endpoint-nya, langganan tetap dihentikan di perangkat ini.
  const stopNow = async () => {
    await api('/subscription', { method: 'DELETE' }).catch(() => {});
    cancelPlus(role);
    showAlert('Langganan dihentikan', `Akunmu kembali ke paket Gratis: ${downgrade}`);
  };

  // pembayaran Plus lewat transfer, tidak diperpanjang otomatis: cukup tidak membayar periode berikutnya
  const stop = () =>
    getSession().isDemo
      ? showAlert('Berhenti langganan?', `Ini akun demo, jadi Dubidu Plus langsung berhenti sekarang. Setelah itu ${downgrade}`, [
          { text: 'Batal', style: 'cancel' },
          { text: 'Berhenti sekarang', style: 'destructive', onPress: stopNow },
        ])
      : showAlert(
          'Berhenti langganan?',
          `Dubidu Plus tidak diperpanjang otomatis. Paketmu tetap aktif sampai akhir periode, setelah itu ${downgrade}`
        );

  return (
    <Screen header={<ScreenHeader title="Dubidu Plus" />} edges={['top', 'bottom']}>
      <LinearGradient colors={['#FFF6DB', '#FFE39A']} style={[styles.hero, Shadow.clay]}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="crown" size={14} color={GOLD} />
          <AppText style={styles.badgeText}>{plus ? 'KAMU PENGGUNA PLUS' : 'DUBIDU PLUS'}</AppText>
        </View>
        <Image source={require('@/assets/images/mascot/wait.png')} style={styles.heroImage} contentFit="contain" />
        <AppText style={styles.heroTitle}>
          {teacher ? 'Dampingi lebih banyak anak' : 'Temukan pendamping terbaik lebih cepat'}
        </AppText>
        <AppText style={styles.heroText}>
          {teacher
            ? 'Buka semua fitur untuk shadow teacher yang aktif mencari anak dampingan.'
            : 'Skip tanpa batas, chat banyak pendamping, dan kelola semua anak dalam satu akun.'}
        </AppText>
      </LinearGradient>

      <SectionHeader title="Yang Kamu Dapatkan" />
      <ClayCard style={styles.list}>
        {plusBenefits[role].map((b, i, arr) => (
          <View key={b.title} style={[styles.benefit, i < arr.length - 1 && styles.divider]}>
            <View style={styles.benefitIcon}>
              <Feather name={b.icon} size={18} color={GOLD} />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.benefitTitle}>{b.title}</AppText>
              <AppText variant="caption">{b.text}</AppText>
            </View>
            {plus && <Feather name="check-circle" size={18} color={Colors.green} />}
          </View>
        ))}
      </ClayCard>

      <SectionHeader title="Gratis vs Plus" />
      <ClayCard style={styles.list}>
        <View style={[styles.compareRow, styles.divider]}>
          <View style={styles.compareLabel} />
          <AppText style={[styles.compareCell, styles.compareHead]}>Gratis</AppText>
          <AppText style={[styles.compareCell, styles.compareHead, { color: GOLD }]}>Plus</AppText>
        </View>
        {plusCompare[role].map((c, i, arr) => (
          <View key={c.label} style={[styles.compareRow, i < arr.length - 1 && styles.divider]}>
            <AppText style={styles.compareLabel}>{c.label}</AppText>
            <Cell value={c.free} />
            <Cell value={c.plus} plus />
          </View>
        ))}
      </ClayCard>

      <View style={styles.plans}>
        {plans.map((p) => {
          const on = plan === p.key;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setPlan(p.key)}
              style={[styles.plan, Shadow.soft, on && styles.planOn]}>
              {/* baris atas ikut alur layout supaya badge tidak menabrak judul paket */}
              <View style={styles.planTop}>
                {p.badge && (
                  <View style={styles.planBadge}>
                    <AppText style={styles.planBadgeText}>{p.badge}</AppText>
                  </View>
                )}
                {plus === p.key && <AppText style={styles.planActive}>Paket aktif</AppText>}
              </View>
              <AppText style={styles.planTitle}>{p.title}</AppText>
              <AppText style={styles.planPrice}>{formatRupiah(p.price)}</AppText>
              <AppText variant="caption">{p.note}</AppText>
            </Pressable>
          );
        })}
      </View>

      {plus ? (
        <>
          <PrimaryButton
            title={plus === plan ? 'Paket Aktif' : `Ganti ke ${chosen.title}`}
            disabled={plus === plan}
            onPress={subscribe}
          />
          <Pressable onPress={stop} hitSlop={8} style={styles.cancel}>
            <AppText style={styles.cancelText}>Berhenti langganan</AppText>
          </Pressable>
        </>
      ) : (
        <PrimaryButton title={`Langganan ${formatRupiah(chosen.price)}`} leadingIcon="crown" onPress={subscribe} />
      )}
      <AppText variant="caption" style={styles.center}>
        Bayar pakai QRIS atau Virtual Account semua bank. Bisa dibatalkan kapan saja.
      </AppText>
    </Screen>
  );
}

function Cell({ value, plus }: { value: string | boolean; plus?: boolean }) {
  if (typeof value === 'string') {
    return <AppText style={[styles.compareCell, plus && styles.comparePlus]}>{value}</AppText>;
  }
  return (
    <View style={styles.compareCellBox}>
      <Feather name={value ? 'check' : 'x'} size={18} color={value ? Colors.green : Colors.textMuted} />
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
  hero: {
    alignItems: 'center',
    gap: 6,
    padding: 20,
    borderRadius: Radius.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: GOLD,
  },
  heroImage: {
    width: 150,
    height: 110,
    marginVertical: 6,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 21,
    lineHeight: 28,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  heroText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B5A2A',
    textAlign: 'center',
  },
  list: {
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  compareHead: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textSecondary,
  },
  compareLabel: {
    flex: 1.4,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  compareCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  comparePlus: {
    fontFamily: Fonts.bodyBold,
    color: GOLD,
  },
  compareCellBox: {
    flex: 1,
    alignItems: 'center',
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
  },
  plan: {
    flex: 1,
    minHeight: 130,
    justifyContent: 'flex-end',
    gap: 2,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  planOn: {
    backgroundColor: '#FFF6DB',
    borderWidth: 2,
    borderColor: Colors.yellow,
  },
  planTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 22,
    marginBottom: 6,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.red,
  },
  planBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  planActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.green,
  },
  planTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  planPrice: {
    fontFamily: Fonts.heading,
    fontSize: 19,
    lineHeight: 26,
    color: Colors.primaryDark,
  },
  cancel: {
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.red,
  },
});
