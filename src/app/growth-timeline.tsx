import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { aspectGrowth, milestones, weeklyScores } from '@/data/growth';
import { useChildren } from '@/lib/children-store';

const MAX = 5;
const CHART_H = 120;

// perkembangan anak dari minggu ke minggu: skor holistik, per aspek, dan momen penting
export default function GrowthTimelineScreen() {
  const child = useChildren()[0];
  const first = weeklyScores[0].value;
  const last = weeklyScores[weeklyScores.length - 1].value;
  const growth = Math.round(((last - first) / first) * 100);

  return (
    <Screen header={<ScreenHeader title="Growth Timeline" />} edges={['top', 'bottom']}>
      <ClayCard tone="blue" style={styles.summary}>
        <View style={styles.flex}>
          <AppText variant="caption">Skor holistik {child.name}</AppText>
          <AppText style={styles.score}>
            {last.toFixed(1)} <AppText variant="caption">/ 5.0</AppText>
          </AppText>
          <AppText variant="caption">6 minggu terakhir</AppText>
        </View>
        <Pill label={`+${growth}%`} tone="green" solid icon="trending-up" size="md" />
      </ClayCard>

      <SectionHeader title="Skor Mingguan" />
      <ClayCard>
        <View style={styles.chart}>
          {weeklyScores.map((w, i) => {
            const isLast = i === weeklyScores.length - 1;
            return (
              <View key={w.label} style={styles.barCol}>
                <AppText style={[styles.barValue, isLast && { color: Colors.primary }]}>{w.value.toFixed(1)}</AppText>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: (w.value / MAX) * CHART_H, backgroundColor: isLast ? Colors.primary : Colors.blueMid },
                    ]}
                  />
                </View>
                <AppText style={styles.barLabel}>{w.label}</AppText>
              </View>
            );
          })}
        </View>
      </ClayCard>

      <SectionHeader title="Per Aspek" />
      <ClayCard style={styles.aspects}>
        {aspectGrowth.map((a) => {
          const t = Tones[a.tone];
          const up = a.now >= a.start;
          return (
            <View key={a.label} style={styles.aspect}>
              <View style={styles.aspectHead}>
                <AppText style={styles.aspectLabel}>{a.label}</AppText>
                <View style={styles.inline}>
                  <AppText variant="caption">{a.start.toFixed(1)}</AppText>
                  <Feather name="arrow-right" size={12} color={Colors.textSecondary} />
                  <AppText style={[styles.aspectNow, { color: up ? Colors.green : Colors.red }]}>{a.now.toFixed(1)}</AppText>
                </View>
              </View>
              {/* bar tipis = skor awal, bar tebal = skor sekarang */}
              <View style={styles.track}>
                <View style={[styles.fillStart, { width: `${(a.start / MAX) * 100}%` }]} />
                <View style={[styles.fillNow, { width: `${(a.now / MAX) * 100}%`, backgroundColor: t.fg }]} />
              </View>
            </View>
          );
        })}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
          <AppText variant="caption">Sesi pertama</AppText>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <AppText variant="caption">Sekarang</AppText>
        </View>
      </ClayCard>

      <SectionHeader title="Momen Penting" />
      <View>
        {milestones.map((m, i) => {
          const t = Tones[m.tone];
          return (
            <View key={m.title} style={styles.milestone}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: t.fg }]} />
                {i < milestones.length - 1 && <View style={styles.line} />}
              </View>
              <ClayCard style={styles.milestoneCard}>
                <AppText variant="caption" color={t.fg}>
                  {m.date}
                </AppText>
                <AppText style={styles.milestoneTitle}>{m.title}</AppText>
                <AppText variant="caption">{m.text}</AppText>
              </ClayCard>
            </View>
          );
        })}
      </View>
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
    gap: 4,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 40,
    color: Colors.primaryDark,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  barTrack: {
    height: CHART_H,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 22,
    borderRadius: 8,
  },
  barLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  aspects: {
    gap: 14,
  },
  aspect: {
    gap: 6,
  },
  aspectHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aspectLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  aspectNow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
  },
  fillStart: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  fillNow: {
    height: 10,
    borderRadius: 5,
    opacity: 0.85,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  milestone: {
    flexDirection: 'row',
    gap: 12,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
  },
  milestoneCard: {
    flex: 1,
    gap: 2,
    marginBottom: 12,
    borderRadius: Radius.md,
  },
  milestoneTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
