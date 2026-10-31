import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { needLabels, type SeekingChild } from '@/data/teacher';

import { bearSource } from './bear-avatar';
import { ClayCard } from './clay-card';
import { Pill } from './pill';
import type { Tone } from './tones';

const TAG_TONES: Tone[] = ['green', 'blue', 'yellow'];

type Props = {
  child: SeekingChild;
  match: number;
  comparing: boolean;
  connected: boolean;
  canSkip: boolean;
  onToggleCompare: () => void;
  onSkip: () => void;
  onConnect: () => void;
};

// kartu anak untuk teacher: pakai inisial + beruang, tanpa foto asli
export function ChildMatchCard({ child, match, comparing, connected, canSkip, onToggleCompare, onSkip, onConnect }: Props) {
  return (
    <ClayCard style={[styles.card, comparing && styles.cardComparing]}>
      <View style={[styles.photo, { backgroundColor: child.gender === 'female' ? '#F28B82' : '#B8CBE8' }]}>
        <Image source={bearSource(child.gender)} style={styles.bear} contentFit="cover" />
        <View style={[styles.match, Shadow.button]}>
          <MaterialCommunityIcons name="star-four-points" size={16} color="#FFFFFF" />
          <AppText style={styles.matchText}>{match}% Match</AppText>
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: comparing }}
          onPress={onToggleCompare}
          style={[styles.compare, Shadow.soft, comparing && styles.compareOn]}>
          <Feather name={comparing ? 'check-square' : 'square'} size={16} color={comparing ? '#FFFFFF' : Colors.primary} />
          <AppText style={[styles.compareText, comparing && { color: '#FFFFFF' }]}>Bandingkan</AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText style={styles.name} numberOfLines={1}>
            {child.initials} ({child.age} tahun)
          </AppText>
          <View style={[styles.rating, Shadow.soft]}>
            <MaterialCommunityIcons name="star" size={15} color={Colors.yellow} />
            <AppText style={styles.ratingText}>{child.parentRating}</AppText>
            <AppText variant="caption">({child.parentReviews})</AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <Feather name="map-pin" size={15} color={Colors.primary} />
          <AppText variant="caption" color={Colors.text}>
            {child.city}
          </AppText>
          <View style={styles.dot} />
          <Feather name="calendar" size={15} color={Colors.primary} />
          <AppText variant="caption" color={Colors.text} style={styles.bold}>
            {child.frequency}
          </AppText>
        </View>

        <View style={styles.tags}>
          {needLabels(child.needs).map((label, i) => (
            <Pill key={label} label={label} tone={TAG_TONES[i % TAG_TONES.length]} size="md" />
          ))}
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/teacher/anak/[id]', params: { id: child.id } })}
          style={styles.profileLink}>
          <AppText variant="link">Lihat profil lengkap</AppText>
          <Feather name="arrow-right" size={16} color={Colors.primary} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            disabled={!canSkip || connected}
            onPress={onSkip}
            style={[styles.skip, (!canSkip || connected) && { opacity: 0.45 }]}>
            <Feather name="x" size={18} color={Colors.textSecondary} />
            <AppText style={styles.skipText}>Skip</AppText>
          </Pressable>
          <Pressable onPress={onConnect} style={[styles.connect, connected ? styles.connected : Shadow.button]}>
            <Feather name={connected ? 'message-circle' : 'send'} size={18} color={connected ? Colors.green : '#FFFFFF'} />
            <AppText style={[styles.connectText, connected && { color: Colors.green }]}>
              {connected ? 'Buka Chat' : 'Ajukan Diri'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardComparing: {
    borderColor: Colors.primary,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  photo: {
    height: 220,
    overflow: 'hidden',
  },
  bear: {
    ...StyleSheet.absoluteFill,
  },
  match: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  matchText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  compare: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  compareOn: {
    backgroundColor: Colors.primaryDark,
  },
  compareText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  body: {
    padding: 18,
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 4,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  skip: {
    flex: 1,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  connect: {
    flex: 2,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connected: {
    backgroundColor: Colors.greenSoft,
  },
  connectText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
