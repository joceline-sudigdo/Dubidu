import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { SKILL_LABELS } from '@/data/teachers';
import { childMatchScore, seekingChildren, teacherProfile, type SeekingChild } from '@/data/teacher';
import { connectChild, useChildMatching } from '@/lib/child-matching-store';

const A_COLOR = Colors.primary;
const B_COLOR = Colors.yellow;

type Stat = { label: string; a: number; b: number; format: (v: number) => string; lowerIsBetter?: boolean };

const perWeek = (c: SeekingChild) => Number(c.frequency.match(/\d+/)?.[0] ?? 0);
const minutes = (c: SeekingChild) => Number(c.hours.match(/(\d+) menit/)?.[1] ?? 0);
const rupiah = (v: number) => `Rp${(v / 1000).toFixed(0)}rb`;

export default function BandingkanAnakScreen() {
  const params = useLocalSearchParams<{ a: string; b: string }>();
  const matching = useChildMatching();
  const a = seekingChildren.find((c) => c.id === params.a) ?? seekingChildren[0];
  const b = seekingChildren.find((c) => c.id === params.b) ?? seekingChildren[1];
  const matchA = childMatchScore(a);
  const matchB = childMatchScore(b);
  const recommended = matchA >= matchB ? a : b;

  const stats: Stat[] = [
    { label: 'Kecocokan', a: matchA, b: matchB, format: (v) => `${v}%` },
    { label: 'Jarak', a: a.distanceKm, b: b.distanceKm, format: (v) => `${v} km`, lowerIsBetter: true },
    { label: 'Budget/sesi', a: a.budget, b: b.budget, format: rupiah },
    { label: 'Frekuensi', a: perWeek(a), b: perWeek(b), format: (v) => `${v}x/mgg` },
    { label: 'Durasi sesi', a: minutes(a), b: minutes(b), format: (v) => `${v} mnt` },
    { label: 'Rating ortu', a: a.parentRating, b: b.parentRating, format: (v) => v.toFixed(1) },
  ];
  const winsOf = (side: 'a' | 'b') =>
    stats
      .filter((s) => {
        const [mine, other] = side === 'a' ? [s.a, s.b] : [s.b, s.a];
        return s.lowerIsBetter ? mine < other : mine > other;
      })
      .map((s) => s.label);

  return (
    <Screen header={<ScreenHeader title="Bandingkan Anak" />} edges={['top', 'bottom']}>
      <View style={styles.heads}>
        <ChildHead child={a} match={matchA} color={A_COLOR} />
        <View style={styles.vs}>
          <AppText style={styles.vsText}>VS</AppText>
        </View>
        <ChildHead child={b} match={matchB} color={B_COLOR} />
      </View>

      <ClayCard tone="green" style={styles.gap8}>
        <View style={styles.inline}>
          <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.green} />
          <AppText style={styles.recoTitle}>Rekomendasi Dubidu</AppText>
        </View>
        <AppText variant="body">
          <AppText style={styles.bold}>{recommended.initials}</AppText> lebih cocok dengan keahlianmu (
          {Math.max(matchA, matchB)}% match), karena kebutuhannya di{' '}
          {recommended.needs.map((n) => SKILL_LABELS[n]).join(' & ')} sesuai spesialisasimu.
        </AppText>
      </ClayCard>

      <SectionHeader title="Keunggulan Masing-masing" />
      <View style={styles.row}>
        <WinsCard name={a.initials} wins={winsOf('a')} color={A_COLOR} />
        <WinsCard name={b.initials} wins={winsOf('b')} color={B_COLOR} />
      </View>

      <SectionHeader title="Kebutuhan vs Keahlianmu" />
      <ClayCard style={styles.gap14}>
        {[a, b].map((c, i) => (
          <View key={c.id} style={styles.gap8}>
            <AppText style={[styles.needTitle, { color: i === 0 ? A_COLOR : Colors.yellowDark }]}>
              {c.initials} butuh:
            </AppText>
            {c.needs.map((n) => (
              <View key={n} style={styles.needRow}>
                <AppText variant="caption" color={Colors.text} style={styles.needLabel}>
                  {SKILL_LABELS[n]}
                </AppText>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${teacherProfile.skills[n]}%`, backgroundColor: i === 0 ? A_COLOR : B_COLOR },
                    ]}
                  />
                </View>
                <AppText style={styles.needValue}>{teacherProfile.skills[n]}</AppText>
              </View>
            ))}
          </View>
        ))}
        <AppText variant="caption">Angka menunjukkan skor keahlianmu di bidang kebutuhan anak.</AppText>
      </ClayCard>

      <SectionHeader title="Statistik" />
      <ClayCard style={styles.stats}>
        {stats.map((s, i) => {
          const aBetter = s.lowerIsBetter ? s.a < s.b : s.a > s.b;
          const bBetter = s.lowerIsBetter ? s.b < s.a : s.b > s.a;
          return (
            <View key={s.label} style={[styles.statRow, i < stats.length - 1 && styles.statBorder]}>
              <View style={[styles.statSide, styles.statLeft]}>
                {aBetter && <Feather name="check" size={14} color={Colors.green} />}
                <AppText style={[styles.statValue, aBetter && styles.winner]}>{s.format(s.a)}</AppText>
              </View>
              <AppText variant="caption" style={styles.statLabel}>
                {s.label}
              </AppText>
              <View style={styles.statSide}>
                <AppText style={[styles.statValue, bBetter && styles.winner]}>{s.format(s.b)}</AppText>
                {bBetter && <Feather name="check" size={14} color={Colors.green} />}
              </View>
            </View>
          );
        })}
      </ClayCard>

      <View style={styles.row}>
        {[a, b].map((c, i) => (
          <PrimaryButton
            key={c.id}
            title={matching.connected.includes(c.id) ? 'Buka Chat' : `Ajukan ke ${c.initials}`}
            icon={matching.connected.includes(c.id) ? undefined : 'send'}
            leadingIcon={matching.connected.includes(c.id) ? 'chat' : undefined}
            color={i === 0 ? A_COLOR : Colors.primaryDark}
            onPress={() => connectChild(c)}
            style={styles.flex}
          />
        ))}
      </View>
    </Screen>
  );
}

function ChildHead({ child, match, color }: { child: SeekingChild; match: number; color: string }) {
  return (
    <ClayCard style={[styles.head, { borderColor: color }]}>
      <BearAvatar gender={child.gender} size={64} />
      <AppText style={styles.headName}>
        {child.initials} · {child.age} thn
      </AppText>
      <AppText variant="caption">{child.city}</AppText>
      <View style={[styles.matchPill, { backgroundColor: color }]}>
        <AppText style={styles.matchText}>{match}% Match</AppText>
      </View>
    </ClayCard>
  );
}

function WinsCard({ name, wins, color }: { name: string; wins: string[]; color: string }) {
  return (
    <ClayCard style={[styles.wins, { borderColor: color }]}>
      <AppText style={styles.winsTitle}>{name} lebih unggul di</AppText>
      {wins.length > 0 ? (
        wins.map((w) => (
          <View key={w} style={styles.inline}>
            <Feather name="check-circle" size={14} color={Colors.green} />
            <AppText variant="caption" color={Colors.text}>
              {w}
            </AppText>
          </View>
        ))
      ) : (
        <AppText variant="caption">Relatif setara</AppText>
      )}
    </ClayCard>
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  gap8: {
    gap: 8,
  },
  gap14: {
    gap: 14,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  heads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  head: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  headName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  matchPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  matchText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  vs: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: '#FFFFFF',
  },
  recoTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.green,
  },
  wins: {
    flex: 1,
    gap: 6,
    padding: 14,
    borderTopWidth: 4,
  },
  winsTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    marginBottom: 2,
  },
  needTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  needLabel: {
    width: 110,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  needValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    width: 26,
    textAlign: 'right',
  },
  stats: {
    paddingVertical: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLeft: {
    justifyContent: 'flex-end',
  },
  statLabel: {
    width: 100,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  winner: {
    fontFamily: Fonts.bodyBold,
  },
});
