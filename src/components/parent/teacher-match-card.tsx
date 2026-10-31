import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatPrice, SKILL_LABELS, topSkills, type Teacher } from '@/data/teachers';

import { Avatar } from './avatar';
import { ClayCard } from './clay-card';
import { TagRow } from './tag-row';

type Props = {
  teacher: Teacher;
  match: number;
  comparing: boolean;
  connected: boolean;
  canSkip: boolean;
  onToggleCompare: () => void;
  onSkip: () => void;
  onConnect: () => void;
};

export function TeacherMatchCard({
  teacher,
  match,
  comparing,
  connected,
  canSkip,
  onToggleCompare,
  onSkip,
  onConnect,
}: Props) {
  const skills = topSkills(teacher, 4);

  return (
    <ClayCard style={[styles.card, comparing && styles.cardComparing]}>
      <LinearGradient colors={[Colors.blueSoft, Colors.primarySoft]} style={styles.photo}>
        <Avatar name={teacher.name} size={110} ring="#FFFFFF" />
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
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText style={styles.name} numberOfLines={1}>
            {teacher.name}
          </AppText>
          <View style={[styles.rating, Shadow.soft]}>
            <MaterialCommunityIcons name="star" size={15} color={Colors.yellow} />
            <AppText style={styles.ratingText}>{teacher.rating}</AppText>
            <AppText variant="caption">({teacher.reviews})</AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <Feather name="map-pin" size={15} color={Colors.primary} />
          <AppText variant="caption" color={Colors.text}>
            {teacher.city}
          </AppText>
          <View style={styles.dot} />
          <MaterialCommunityIcons name="cash" size={17} color={Colors.primary} />
          <AppText variant="caption" color={Colors.text} style={styles.bold}>
            {formatPrice(teacher.price)}
          </AppText>
        </View>

        <View style={styles.tags}>
          <TagRow tags={skills.map((k) => SKILL_LABELS[k])} />
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/profil-teacher/[id]', params: { id: teacher.id } })}
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
          <Pressable
            onPress={onConnect}
            style={[styles.connect, connected ? styles.connected : Shadow.button]}>
            {connected ? <ChatIcon size={18} color={Colors.green} /> : <Feather name="send" size={18} color="#FFFFFF" />}
            <AppText style={[styles.connectText, connected && { color: Colors.green }]}>
              {connected ? 'Buka Chat' : 'Connect'}
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
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 2,
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
