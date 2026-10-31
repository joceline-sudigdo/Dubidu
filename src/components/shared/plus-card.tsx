import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { plusHighlights } from '@/data/plus';
import { isPlusRole, usePlus } from '@/lib/membership-store';
import { getSession } from '@/lib/session';

const GOLD = '#8A6A0C';

// kartu Dubidu Plus ringkas di beranda: judul satu baris + chip fitur
export function PlusCard() {
  const role = getSession().role;
  const plus = usePlus();
  if (!isPlusRole(role)) return null;

  return (
    <Pressable onPress={() => router.push('/plus')} style={({ pressed }) => pressed && { opacity: 0.92 }}>
      <LinearGradient
        colors={['#FFF6DB', '#FFE39A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, Shadow.soft]}>
        <View style={styles.top}>
          <View style={styles.crown}>
            <MaterialCommunityIcons name="crown" size={20} color={GOLD} />
          </View>
          <AppText style={styles.title} numberOfLines={1}>
            {plus ? 'Dubidu Plus aktif' : 'Upgrade ke Dubidu Plus'}
          </AppText>
          <View style={styles.cta}>
            <AppText style={styles.ctaText}>{plus ? 'Kelola' : 'Lihat'}</AppText>
            <Feather name="chevron-right" size={14} color={GOLD} />
          </View>
        </View>
        <View style={styles.chips}>
          {plusHighlights[role].map((h) => (
            <View key={h.label} style={styles.chip}>
              <Feather name={plus ? 'check' : h.icon} size={11} color={GOLD} />
              <AppText style={styles.chipText} numberOfLines={1}>
                {h.label}
              </AppText>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F6E2AE',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crown: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.primaryDark,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  ctaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: GOLD,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    flexShrink: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#6B5A2A',
  },
});
