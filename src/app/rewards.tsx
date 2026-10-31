import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { VoucherList } from '@/components/shared/voucher-list';
import { celebrateFish } from '@/components/ui/fish-celebration';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import {
  LEVEL_TITLE,
  LEVELS,
  levelOf,
  missions,
  NEXT_GOAL,
  rewards,
  type Mission,
  type Reward,
  type RewardCategory,
} from '@/data/rewards';
import { rewardPhotos } from '@/data/images';
import { showAlert } from '@/lib/dialog';
import { claimMission, hasPoints, redeemReward, usePoints } from '@/lib/points-store';
import { getSession } from '@/lib/session';

const FISH = require('@/assets/images/icons/ikan.png');
const FILTERS: ('Semua' | RewardCategory)[] = ['Semua', 'Voucher', 'Cashback', 'Kesehatan'];
const fmt = (n: number) => n.toLocaleString('id-ID').replace(/,/g, '.');

export default function RewardsScreen() {
  const role = getSession().role;
  const store = usePoints();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua');
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  if (!hasPoints(role)) {
    return (
      <Screen header={<ScreenHeader title="Doobie Rewards" />}>
        <EmptyState title="Khusus orang tua & teacher" />
      </Screen>
    );
  }

  const points = store.points[role];
  const { current, next } = levelOf(points);
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  const goal = NEXT_GOAL[role];
  // isi garis jalur level: sampai level sekarang + progres menuju level berikutnya
  const pathFill = Math.min(current.level - 1 + Math.min(progress, 1), LEVELS.length - 1) / (LEVELS.length - 1);
  const list = rewards[role].filter((r) => filter === 'Semua' || r.category === filter);

  const doMission = (m: Mission, claimed: boolean) => {
    if (claimed) return;
    if (m.done) {
      claimMission(m.id, m.title, m.reward);
      celebrateFish(m.reward, 'Misi selesai!');
    } else if (m.action.share) {
      Share.share({ message: m.action.share });
    } else if (m.action.href) {
      router.push(m.action.href);
    }
  };

  // riwayat dibuka lalu layar ikut digulir ke bawah supaya isinya kelihatan
  const toggleHistory = () => {
    const open = !showHistory;
    setShowHistory(open);
    if (open) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const redeem = (r: Reward) => {
    if (r.minLevel && current.level < r.minLevel) {
      showAlert('Belum terbuka', `Hadiah ini terbuka di Lv ${r.minLevel}. Kumpulkan ikan lagi ya!`);
      return;
    }
    if (points < r.cost) {
      showAlert('Ikan belum cukup', `Kamu butuh ${fmt(r.cost - points)} ikan lagi untuk menukar hadiah ini.`);
      return;
    }
    showAlert(`Tukar ${r.title}?`, `${fmt(r.cost)} ikan akan dipakai untuk hadiah ini.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tukar',
        onPress: () => {
          redeemReward(r.id, r.title, r.cost);
          showAlert('Penukaran berhasil', 'Vouchernya sudah masuk ke bagian Voucher Saya.');
        },
      },
    ]);
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Doobie Rewards"
          right={
            <Pressable
              accessibilityLabel="Cara kerja ikan"
              onPress={() =>
                showAlert(
                  'Cara dapat ikan',
                  'Check-in setiap hari, selesaikan misi, dan ajak teman. Ikan bisa ditukar dengan hadiah dan menaikkan level kamu.'
                )
              }
              style={[styles.help, Shadow.soft]}>
              <Feather name="help-circle" size={20} color={Colors.primary} />
            </Pressable>
          }
        />
      }
      edges={['top', 'bottom']}
      scrollRef={scrollRef}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.balance, Shadow.button]}>
        <View style={styles.balanceTop}>
          <View style={styles.flex}>
            <View style={styles.levelPill}>
              <View style={styles.levelDot} />
              <AppText style={styles.levelPillText}>
                Lv {current.level} · {LEVEL_TITLE[role]} {current.name}
              </AppText>
            </View>
            <AppText style={styles.balanceLabel}>Ikan kamu</AppText>
            <View style={styles.inline}>
              <Image source={FISH} style={styles.bigFish} contentFit="contain" />
              <AppText style={styles.balanceValue}>{fmt(points)}</AppText>
            </View>
          </View>
          <Image source={require('@/assets/images/mascot/bear-fish.png')} style={styles.mascot} contentFit="contain" />
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.spaceBetween}>
          <AppText style={styles.balanceSmall}>
            {fmt(points)} / {fmt(next?.min ?? points)} Ikan
          </AppText>
          {next && <AppText style={styles.nextLevel}>Menuju Lv {next.level} ›</AppText>}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
        </View>
        <View style={styles.inline}>
          <Feather name="gift" size={14} color="#FFFFFF" />
          <AppText style={styles.balanceSmall}>
            {points >= goal.cost ? (
              `Kamu bisa menukar ${goal.label}!`
            ) : (
              <>
                <AppText style={styles.balanceBold}>{fmt(goal.cost - points)} ikan lagi</AppText> untuk {goal.label}
              </>
            )}
          </AppText>
        </View>
      </LinearGradient>

      <ClayCard style={styles.gap14}>
        <View style={styles.spaceBetween}>
          <View style={styles.flex}>
            <AppText style={styles.cardTitle}>Jalur Level {LEVEL_TITLE[role]}</AppText>
            <AppText variant="caption">Kenaikan tingkat membuka reward eksklusif</AppText>
          </View>
        </View>
        {/* garis jalur digambar sekali di belakang, lingkaran level di atasnya */}
        <View style={styles.levels}>
          <View style={styles.levelTrack} />
          <View style={[styles.levelTrackOn, { width: `${pathFill * 80}%` }]} />
          {LEVELS.map((l) => {
            const reached = current.level >= l.level;
            const isCurrent = current.level === l.level;
            return (
              <View key={l.level} style={styles.levelStep}>
                <View style={styles.hereSlot}>
                  {isCurrent && (
                    <View style={styles.here}>
                      <AppText style={styles.hereText} numberOfLines={1}>
                        Kamu di sini!
                      </AppText>
                    </View>
                  )}
                </View>
                <View style={styles.circleSlot}>
                  <View
                    style={[
                      styles.levelCircle,
                      reached && styles.levelCircleOn,
                      isCurrent && styles.levelCircleCurrent,
                    ]}>
                    {isCurrent ? (
                      <Image source={FISH} style={styles.levelFish} contentFit="contain" />
                    ) : (
                      <Feather name={reached ? 'check' : 'lock'} size={16} color={reached ? '#FFFFFF' : Colors.textMuted} />
                    )}
                  </View>
                </View>
                <AppText style={[styles.levelNum, isCurrent && styles.bold]}>Lv {l.level}</AppText>
                <AppText style={[styles.levelName, isCurrent && styles.bold]} numberOfLines={1}>
                  {l.name}
                </AppText>
                {l.perk && (
                  <View style={[styles.perk, reached && styles.perkOn]}>
                    <Feather name={l.perk.icon} size={10} color={reached ? Colors.green : Colors.primary} />
                    <AppText style={[styles.perkText, reached && { color: Colors.green }]} numberOfLines={1}>
                      {l.perk.label}
                    </AppText>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ClayCard>

      <ClayCard style={styles.gap10}>
        <View style={styles.spaceBetween}>
          <View>
            <AppText style={styles.cardTitle}>Misi Hari Ini</AppText>
            <AppText variant="caption">Kumpulkan ikan lebih cepat</AppText>
          </View>
          <Feather name="check-circle" size={22} color={Colors.yellowDark} />
        </View>
        {missions[role].map((m) => {
          const claimed = store.claimedMissions[role].includes(m.id);
          const t = Tones[m.tone];
          return (
            <View key={m.id} style={[styles.mission, m.done && !claimed && styles.missionReady]}>
              <View style={[styles.missionIcon, { backgroundColor: t.bg }]}>
                <Feather name={claimed ? 'check' : m.icon} size={18} color={t.fg} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.missionTitle} numberOfLines={1}>
                  {m.title}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {m.subtitle}
                </AppText>
              </View>
              <View style={styles.inline}>
                <AppText style={styles.reward}>+{m.reward}</AppText>
                <Image source={FISH} style={styles.smallFish} contentFit="contain" />
              </View>
              <Pressable
                disabled={claimed}
                onPress={() => doMission(m, claimed)}
                style={[
                  styles.missionButton,
                  { backgroundColor: claimed ? Colors.inputBackground : m.done ? Colors.green : m.action.share ? Colors.yellow : Colors.primary },
                ]}>
                <AppText style={[styles.missionButtonText, (claimed || m.action.share) && { color: Colors.text }]}>
                  {claimed ? 'Selesai' : m.action.label}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </ClayCard>

      <SectionHeader title="Voucher Saya" right={<Feather name="tag" size={20} color={Colors.primary} />} />
      <VoucherList items={rewards[role].filter((r) => store.redeemed[role].includes(r.id))} />

      <SectionHeader title="Tukar Hadiah" right={<Feather name="gift" size={22} color={Colors.primary} />} />
      <AppText variant="caption" style={styles.subtitle}>
        Hadiah manis untuk {role === 'parent' ? 'bunda dan si kecil' : 'pendamping hebat'}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Pill
            key={f}
            label={f}
            size="md"
            tone="blue"
            solid={filter === f}
            onPress={() => setFilter(f)}
            style={filter !== f && styles.white}
          />
        ))}
      </ScrollView>
      <View style={styles.grid}>
        {list.map((r) => {
          const locked = !!r.minLevel && current.level < r.minLevel;
          const redeemed = store.redeemed[role].includes(r.id);
          const t = Tones[r.tone];
          return (
            <Animated.View key={r.id} layout={LinearTransition} entering={FadeInDown} style={styles.gridItem}>
              <View style={[styles.reward_card, Shadow.soft, locked && { opacity: 0.6 }]}>
                <View style={[styles.rewardArt, { backgroundColor: t.bg }]}>
                  {rewardPhotos[r.id] ? (
                    <Image source={rewardPhotos[r.id]} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Feather name={r.icon} size={30} color={t.fg} />
                  )}
                  {locked && (
                    <View style={styles.lockPill}>
                      <Feather name="lock" size={10} color={Colors.textSecondary} />
                      <AppText style={styles.lockText}>Lv {r.minLevel}</AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.rewardTitle} numberOfLines={1}>
                  {r.title}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {r.subtitle}
                </AppText>
                <View style={styles.spaceBetween}>
                  {locked ? (
                    <AppText variant="caption">Buka di Lv {r.minLevel}</AppText>
                  ) : (
                    <View style={styles.inline}>
                      <Image source={FISH} style={styles.smallFish} contentFit="contain" />
                      <AppText style={styles.cost}>{fmt(r.cost)}</AppText>
                    </View>
                  )}
                  <Pressable
                    onPress={() => redeem(r)}
                    style={[styles.redeem, (locked || redeemed) && { backgroundColor: Colors.inputBackground }]}>
                    <AppText style={[styles.redeemText, (locked || redeemed) && { color: Colors.textSecondary }]}>
                      {redeemed ? 'Ditukar' : 'Tukar'}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Pressable onPress={toggleHistory} style={styles.historyLink}>
        <View style={styles.inline}>
          <AppText variant="link">Riwayat Ikan</AppText>
          <Feather name={showHistory ? 'chevron-up' : 'arrow-right'} size={16} color={Colors.primary} />
        </View>
        <AppText variant="caption">Lihat semua perolehan & penukaran</AppText>
      </Pressable>
      {showHistory && (
        <Animated.View entering={FadeIn.duration(250)}>
        <ClayCard style={styles.historyCard}>
          {store.history[role].map((h, i, arr) => (
            <View key={h.id} style={[styles.historyRow, i < arr.length - 1 && styles.divider]}>
              <View style={styles.flex}>
                <AppText style={styles.missionTitle}>{h.title}</AppText>
                <AppText variant="caption">{h.time}</AppText>
              </View>
              <AppText style={[styles.historyAmount, { color: h.amount > 0 ? Colors.green : Colors.red }]}>
                {h.amount > 0 ? '+' : ''}
                {fmt(h.amount)}
              </AppText>
            </View>
          ))}
        </ClayCard>
        </Animated.View>
      )}
    </Screen>
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
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gap10: {
    gap: 10,
  },
  gap14: {
    gap: 14,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  help: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    borderRadius: Radius.lg,
    padding: 20,
    gap: 10,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.yellow,
  },
  levelPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  balanceLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  bigFish: {
    width: 42,
    height: 28,
  },
  balanceValue: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    lineHeight: 46,
    color: '#FFFFFF',
  },
  mascot: {
    width: 110,
    height: 110,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceSmall: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  balanceBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  nextLevel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellow,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: Colors.yellow,
  },
  cardTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  levels: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  // garis lewat tengah lingkaran: tinggi hereSlot (24) + setengah circleSlot (25)
  levelTrack: {
    position: 'absolute',
    top: 24 + 25 - 1.5,
    left: '10%',
    right: '10%',
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  levelTrackOn: {
    position: 'absolute',
    top: 24 + 25 - 1.5,
    left: '10%',
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  levelStep: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  hereSlot: {
    height: 24,
    width: '100%',
    alignItems: 'center',
  },
  here: {
    position: 'absolute',
    top: 0,
    width: 84,
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.pill,
    paddingVertical: 2,
  },
  hereText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  circleSlot: {
    height: 50,
    justifyContent: 'center',
    marginBottom: 2,
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleOn: {
    backgroundColor: Colors.primary,
  },
  levelCircleCurrent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.yellow,
  },
  levelFish: {
    width: 30,
    height: 20,
  },
  levelNum: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  levelName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  perkOn: {
    backgroundColor: Colors.greenSoft,
  },
  perkText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.primary,
  },
  mission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
  },
  missionReady: {
    backgroundColor: Colors.primarySoft,
  },
  missionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  reward: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellowDark,
  },
  smallFish: {
    width: 18,
    height: 12,
  },
  missionButton: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  missionButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: -10,
  },
  filters: {
    gap: 8,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
  },
  reward_card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 4,
  },
  rewardArt: {
    height: 90,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  lockPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lockText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  rewardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  cost: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.yellowDark,
  },
  redeem: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 6,
  },
  redeemText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  historyLink: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  historyCard: {
    paddingVertical: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyAmount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
});
