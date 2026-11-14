import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { formatPrice, matchScore, SKILL_LABELS, teacherPool, type Skill, type Teacher } from '@/data/teachers';
import { connectTeacher, useMatching } from '@/lib/matching-store';
import { useChildren } from '@/lib/children-store';

const A_COLOR = Colors.primary;
const B_COLOR = Colors.yellow;

type Stat = { label: string; a: number; b: number; format: (v: number) => string; lowerIsBetter?: boolean };

export default function BandingkanTeacherScreen() {
  const children = useChildren();
  const params = useLocalSearchParams<{ a: string; b: string; child: string }>();
  const matching = useMatching();
  const child = children.find((c) => c.id === params.child) ?? children[0];
  const a = teacherPool.find((t) => t.id === params.a) ?? teacherPool[0];
  const b = teacherPool.find((t) => t.id === params.b) ?? teacherPool[1];

  const matchA = matchScore(a, child);
  const matchB = matchScore(b, child);
  const skills = Object.keys(SKILL_LABELS) as Skill[];
  // kebutuhan anak ditaruh paling atas
  const orderedSkills = [...child.needs, ...skills.filter((k) => !child.needs.includes(k))];

  const aWins = skills.filter((k) => a.skills[k] - b.skills[k] >= 5);
  const bWins = skills.filter((k) => b.skills[k] - a.skills[k] >= 5);
  const recommended = matchA === matchB ? (a.rating >= b.rating ? a : b) : matchA > matchB ? a : b;

  const stats: Stat[] = [
    { label: 'Rating', a: a.rating, b: b.rating, format: (v) => v.toFixed(1) },
    { label: 'Ulasan', a: a.reviews, b: b.reviews, format: String },
    { label: 'Pengalaman', a: a.experience, b: b.experience, format: (v) => `${v} thn` },
    { label: 'Sesi Selesai', a: a.sessions, b: b.sessions, format: String },
    { label: 'Respons', a: a.responseRate, b: b.responseRate, format: (v) => `${v}%` },
    { label: 'Harga', a: a.price, b: b.price, format: (v) => formatPrice(v).replace('/jam', ''), lowerIsBetter: true },
  ];

  return (
    <Screen header={<ScreenHeader title="Bandingkan Teacher" />} edges={['top', 'bottom']}>
      <View style={styles.heads}>
        <TeacherHead teacher={a} match={matchA} color={A_COLOR} />
        <View style={styles.vs}>
          <AppText style={styles.vsText}>VS</AppText>
        </View>
        <TeacherHead teacher={b} match={matchB} color={B_COLOR} />
      </View>

      <ClayCard tone="green" style={styles.reco}>
        <View style={styles.inline}>
          <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.green} />
          <AppText style={styles.recoTitle}>Rekomendasi Dubidu</AppText>
        </View>
        <AppText variant="body">
          <AppText style={styles.bold}>{recommended.name.split(',')[0]}</AppText> lebih cocok untuk {child.name} dengan
          kecocokan {Math.max(matchA, matchB)}%, terutama di{' '}
          {child.needs.map((n) => SKILL_LABELS[n]).join(' & ')}.
        </AppText>
      </ClayCard>

      <SectionHeader title="Keunggulan Masing-masing" />
      <View style={styles.winsRow}>
        <WinsCard teacher={a} wins={aWins} color={A_COLOR} />
        <WinsCard teacher={b} wins={bWins} color={B_COLOR} />
      </View>

      <SectionHeader title="Kompetensi" />
      <ClayCard style={styles.gap14}>
        <View style={styles.legend}>
          <Legend color={A_COLOR} label={a.name.split(' ')[0]} />
          <Legend color={B_COLOR} label={b.name.split(' ')[0]} />
        </View>
        {orderedSkills.map((k) => (
          <SkillRow
            key={k}
            label={SKILL_LABELS[k]}
            a={a.skills[k]}
            b={b.skills[k]}
            isNeed={child.needs.includes(k)}
          />
        ))}
      </ClayCard>

      <SectionHeader title="Statistik" />
      <ClayCard style={styles.stats}>
        {stats.map((s, i) => (
          <StatRow key={s.label} stat={s} last={i === stats.length - 1} />
        ))}
      </ClayCard>

      <View style={styles.actions}>
        {[a, b].map((t) => {
          const connected = matching.connected.includes(t.id);
          return (
            <PrimaryButton
              key={t.id}
              title={connected ? 'Buka Chat' : `Connect ${t.name.split(' ')[0]}`}
              icon={connected ? undefined : 'send'}
              leadingIcon={connected ? 'chat' : undefined}
              color={t.id === a.id ? A_COLOR : Colors.primaryDark}
              onPress={() => connectTeacher(t, child)}
              style={styles.flex}
            />
          );
        })}
      </View>
    </Screen>
  );
}

function TeacherHead({ teacher, match, color }: { teacher: Teacher; match: number; color: string }) {
  return (
    <ClayCard style={[styles.head, { borderColor: color }]}>
      <Avatar name={teacher.name} size={64} ring={color} />
      <AppText style={styles.headName} numberOfLines={2}>
        {teacher.name}
      </AppText>
      <View style={[styles.matchPill, { backgroundColor: color }]}>
        <AppText style={styles.matchText}>{match}% Match</AppText>
      </View>
    </ClayCard>
  );
}

function WinsCard({ teacher, wins, color }: { teacher: Teacher; wins: Skill[]; color: string }) {
  return (
    <ClayCard style={[styles.wins, { borderColor: color }]}>
      <AppText style={styles.winsTitle}>{teacher.name.split(' ')[0]} lebih jago di</AppText>
      {wins.length > 0 ? (
        wins.map((k) => (
          <View key={k} style={styles.inline}>
            <Feather name="check-circle" size={14} color={Colors.green} />
            <AppText variant="caption" color={Colors.text}>
              {SKILL_LABELS[k]}
            </AppText>
          </View>
        ))
      ) : (
        <AppText variant="caption">Kompetensi relatif setara</AppText>
      )}
    </ClayCard>
  );
}

function SkillRow({ label, a, b, isNeed }: { label: string; a: number; b: number; isNeed: boolean }) {
  return (
    <View style={styles.skillRow}>
      <View style={styles.skillHead}>
        <AppText style={[styles.skillValue, a >= b && styles.winner, { color: A_COLOR }]}>{a}</AppText>
        <View style={styles.inline}>
          <AppText style={styles.skillLabel}>{label}</AppText>
          {isNeed && <Pill inRow label="Kebutuhan" tone="blue" />}
        </View>
        <AppText style={[styles.skillValue, b >= a && styles.winner, { color: Colors.yellowDark }]}>{b}</AppText>
      </View>
      <View style={styles.bars}>
        <View style={[styles.track, styles.trackLeft]}>
          <View style={[styles.fill, { width: `${a}%`, backgroundColor: A_COLOR }]} />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${b}%`, backgroundColor: B_COLOR }]} />
        </View>
      </View>
    </View>
  );
}

function StatRow({ stat, last }: { stat: Stat; last: boolean }) {
  const aBetter = stat.lowerIsBetter ? stat.a < stat.b : stat.a > stat.b;
  const bBetter = stat.lowerIsBetter ? stat.b < stat.a : stat.b > stat.a;
  return (
    <View style={[styles.statRow, !last && styles.statBorder]}>
      <View style={[styles.statSide, styles.statLeft]}>
        {aBetter && <Feather name="check" size={14} color={Colors.green} />}
        <AppText style={[styles.statValue, aBetter && styles.winner]}>{stat.format(stat.a)}</AppText>
      </View>
      <AppText variant="caption" style={styles.statLabel}>
        {stat.label}
      </AppText>
      <View style={styles.statSide}>
        <AppText style={[styles.statValue, bBetter && styles.winner]}>{stat.format(stat.b)}</AppText>
        {bBetter && <Feather name="check" size={14} color={Colors.green} />}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.inline}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption" color={Colors.text}>
        {label}
      </AppText>
    </View>
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
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  gap14: {
    gap: 14,
  },
  heads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  head: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  headName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
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
  reco: {
    gap: 8,
  },
  recoTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.green,
  },
  winsRow: {
    flexDirection: 'row',
    gap: 10,
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  skillRow: {
    gap: 6,
  },
  skillHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  skillValue: {
    fontFamily: Fonts.body,
    fontSize: 14,
    width: 32,
    textAlign: 'center',
  },
  winner: {
    fontFamily: Fonts.bodyBold,
  },
  bars: {
    flexDirection: 'row',
    gap: 6,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  // bar kiri tumbuh dari tengah ke kiri
  trackLeft: {
    transform: [{ scaleX: -1 }],
  },
  fill: {
    height: '100%',
    borderRadius: 5,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
