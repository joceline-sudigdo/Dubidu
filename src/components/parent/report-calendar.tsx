import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatLongDate, MONTHS, toISODate, type SessionReport } from '@/data/parent';
import { useChildren } from '@/lib/children-store';
import { useReports } from '@/lib/reports-store';

import { Avatar } from './avatar';
import { ChildSwitcher } from './child-switcher';
import { ClayCard } from './clay-card';
import { EmptyState } from './empty-state';
import { Pill } from './pill';
import { Tones } from './tones';

export const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// isi 6 minggu, termasuk tanggal bulan sebelum/sesudah biar grid penuh
export function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const days: { iso: string; date: number; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({ iso: toISODate(d), date: d.getDate(), inMonth: d.getMonth() === month });
  }
  // buang minggu terakhir kalau isinya bulan depan semua
  return days.slice(35).every((d) => !d.inMonth) ? days.slice(0, 35) : days;
}

export function ReportCalendar() {
  const children = useChildren();
  const [childId, setChildId] = useState(children[0]?.id);
  const child = children.find((c) => c.id === childId) ?? children[0];
  const { reports: sessionReports } = useReports(child?.id);
  const latest = sessionReports[0]?.date ?? toISODate(new Date());
  const [cursor, setCursor] = useState(() => {
    const [y, m] = latest.split('-').map(Number);
    return { year: y, month: m - 1 };
  });
  const [selected, setSelected] = useState(latest);
  // begitu report card anak termuat, buka bulan & tanggal laporan terbaru
  const [shownFor, setShownFor] = useState<string | undefined>();
  if (sessionReports.length && shownFor !== child?.id) {
    const [y, m] = sessionReports[0].date.split('-').map(Number);
    setShownFor(child?.id);
    setCursor({ year: y, month: m - 1 });
    setSelected(sessionReports[0].date);
  }

  const today = toISODate(new Date());
  const days = buildMonth(cursor.year, cursor.month);
  const report = sessionReports.find((r) => r.date === selected);

  const shiftMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <>
      {child && <ChildSwitcher value={child} onChange={(c) => setChildId(c.id)} />}

      <ClayCard style={styles.calendar}>
        <View style={styles.monthRow}>
          <AppText style={styles.month}>
            {MONTHS[cursor.month]} {cursor.year}
          </AppText>
          <NavButton icon="chevron-left" label="Bulan sebelumnya" onPress={() => shiftMonth(-1)} />
          <NavButton icon="chevron-right" label="Bulan berikutnya" onPress={() => shiftMonth(1)} />
        </View>
        <View style={styles.grid}>
          {WEEKDAYS.map((d, i) => (
            <AppText key={d} style={[styles.weekday, i === 0 && { color: Colors.red }]}>
              {d}
            </AppText>
          ))}
          {days.map((d) => {
            const r = sessionReports.find((x) => x.date === d.iso);
            const isSelected = d.iso === selected;
            return (
              <View key={d.iso} style={styles.cell}>
                {d.inMonth ? (
                  <Pressable
                    accessibilityLabel={formatLongDate(d.iso)}
                    onPress={() => setSelected(d.iso)}
                    style={[
                      styles.day,
                      isSelected && styles.daySelected,
                      d.iso === today && styles.dayToday,
                    ]}>
                    <AppText style={[styles.dayText, isSelected && { color: '#FFFFFF' }]}>{d.date}</AppText>
                    {r && (
                      <View
                        style={[
                          styles.dayDot,
                          { backgroundColor: r.needsAttention ? Colors.red : isSelected ? '#FFFFFF' : Colors.green },
                        ]}
                      />
                    )}
                  </Pressable>
                ) : (
                  <AppText style={styles.dayOut}>{d.date}</AppText>
                )}
              </View>
            );
          })}
        </View>
      </ClayCard>

      <View style={styles.legend}>
        <Legend color={Colors.green} label="Laporan Tersedia" />
        <Legend color={Colors.red} label="Perlu Perhatian" />
        <Legend color={Colors.yellow} label="Hari Ini" ring />
      </View>

      <View style={styles.dateRow}>
        <MaterialCommunityIcons name="calendar-text" size={22} color={Colors.primary} />
        <AppText style={styles.dateTitle}>{formatLongDate(selected)}</AppText>
        {report && <Pill label={`Sesi #${report.number}`} tone="red" />}
      </View>

      {report ? (
        <SessionCard report={report} />
      ) : (
        <ClayCard>
          <EmptyState title="Tidak ada sesi" />
        </ClayCard>
      )}
    </>
  );
}

function SessionCard({ report }: { report: SessionReport }) {
  return (
    <ClayCard style={styles.session}>
      <View style={styles.teacherRow}>
        <Avatar name={report.teacher} size={52} ring="#FFFFFF" />
        <View style={styles.flex}>
          <AppText style={styles.teacher} numberOfLines={2}>
            {report.teacher}
          </AppText>
          <AppText variant="caption" color={Colors.primary}>
            Shadow Teacher
          </AppText>
        </View>
        <Pill label={report.time} tone="blue" size="md" />
      </View>

      <View style={styles.scores}>
        {report.scores.map((s) => {
          const t = Tones[s.tone];
          return (
            <View key={s.label} style={[styles.score, { backgroundColor: t.bg, borderColor: t.edge }]}>
              <AppText style={styles.scoreLabel} numberOfLines={2}>
                {s.label}
              </AppText>
              <View style={styles.scoreValueRow}>
                <MaterialCommunityIcons name="star" size={16} color={t.fg} />
                <AppText style={[styles.scoreValue, { color: t.fg }]}>{s.value.toFixed(1)}</AppText>
              </View>
              <AppText style={[styles.scoreStatus, { color: t.fg }]} numberOfLines={1}>
                {s.status}
              </AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.note}>
        <View style={styles.noteHead}>
          <MaterialCommunityIcons name="format-quote-open" size={18} color={Colors.primary} />
          <AppText style={styles.noteLabel}>CATATAN PENGAMATAN HARIAN</AppText>
        </View>
        <AppText style={styles.noteText}>{report.dailyNote}</AppText>
      </View>

      <Highlight icon="trending-up" tone="green" title="Pencapaian" text={report.achievement} />
      <Highlight icon="volume-2" tone="red" title="Catatan Sensori" text={report.sensoryNote} />

      <PrimaryButton
        title="Buka Laporan Lengkap"
        icon="arrow-right"
        onPress={() => router.push({ pathname: '/report-card/[id]', params: { id: report.id } })}
      />
    </ClayCard>
  );
}

function Highlight({
  icon,
  tone,
  title,
  text,
}: {
  icon: 'trending-up' | 'volume-2';
  tone: 'green' | 'red';
  title: string;
  text: string;
}) {
  const t = Tones[tone];
  return (
    <View style={[styles.highlight, { backgroundColor: t.bg, borderColor: t.edge }]}>
      <View style={[styles.highlightIcon, { backgroundColor: '#FFFFFF' }]}>
        <Feather name={icon} size={16} color={t.fg} />
      </View>
      <AppText variant="caption" color={Colors.text} style={styles.flex}>
        <AppText style={styles.highlightTitle}>{title}: </AppText>
        {text}
      </AppText>
    </View>
  );
}

function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: 'chevron-left' | 'chevron-right';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.nav, Shadow.soft]}>
      <Feather name={icon} size={20} color={Colors.text} />
    </Pressable>
  );
}

function Legend({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <View style={[styles.legendItem, Shadow.soft]}>
      <View
        style={[
          styles.legendDot,
          ring ? { borderWidth: 2, borderColor: color } : { backgroundColor: color },
        ]}
      />
      <AppText style={styles.legendLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  calendar: {
    padding: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  month: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 22,
  },
  nav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.9,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderBottomWidth: 3,
    borderColor: Colors.blueMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  dayToday: {
    borderWidth: 2,
    borderBottomWidth: 3,
    borderColor: Colors.yellow,
  },
  dayText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  dayDot: {
    position: 'absolute',
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayOut: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateTitle: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 17,
  },
  session: {
    gap: 14,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teacher: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  // grid 3 kolom: aspek penilaian bisa 3–7, jangan dipaksa satu baris
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  score: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderBottomWidth: 3,
    paddingVertical: 12,
    gap: 2,
  },
  scoreLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    color: Colors.text,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scoreValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
  scoreStatus: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  note: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderBottomWidth: 3,
    borderColor: Colors.border,
    padding: 16,
    gap: 10,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.primaryDark,
  },
  noteText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderBottomWidth: 3,
    padding: 12,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
});
