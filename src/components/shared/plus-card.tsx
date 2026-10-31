import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { plusBenefits } from '@/data/plus';
import { isPlusRole, usePlus } from '@/lib/membership-store';
import { getSession } from '@/lib/session';

const GOLD = '#8A6A0C';

// kartu Dubidu Plus di beranda: ajakan upgrade, atau status kalau sudah Plus
export function PlusCard() {
  const role = getSession().role;
  const plus = usePlus();
  if (!isPlusRole(role)) return null;
  const benefits = plusBenefits[role].slice(0, 2);

  return (
    <Pressable onPress={() => router.push('/plus')} style={({ pressed }) => pressed && { opacity: 0.92 }}>
      <LinearGradient colors={['#FFF6DB', '#FFE39A']} style={[styles.card, Shadow.soft]}>
        <View style={styles.crown}>
          <MaterialCommunityIcons name="crown" size={24} color={GOLD} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.label}>{plus ? 'KAMU PENGGUNA PLUS' : 'DUBIDU PLUS'}</AppText>
          <AppText style={styles.title}>
            {plus
              ? 'Semua fitur Plus aktif'
              : role === 'teacher'
                ? 'Dampingi lebih banyak anak'
                : 'Temukan pendamping lebih cepat'}
          </AppText>
          {benefits.map((b) => (
            <View key={b.title} style={styles.benefit}>
              <Feather name={plus ? 'check-circle' : b.icon} size={13} color={GOLD} />
              <AppText style={styles.benefitText}>{b.title}</AppText>
            </View>
          ))}
        </View>
        <View style={styles.cta}>
          <AppText style={styles.ctaText}>{plus ? 'Kelola' : 'Lihat Paket'}</AppText>
          <Feather name="chevron-right" size={16} color={GOLD} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F6E2AE',
  },
  crown: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: GOLD,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#6B5A2A',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: GOLD,
  },
});
