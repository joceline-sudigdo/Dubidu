import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChildSwitcher } from '@/components/parent/child-switcher';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { buildMonth, WEEKDAYS } from '@/components/parent/report-calendar';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { formatLongDate, MONTHS, toISODate } from '@/data/parent';
import { students, teacherSessions, type TeacherSession } from '@/data/teacher';

export default function TeacherJadwalScreen() {
  const [student, setStudent] = useState(students[0]);
  const sessions = teacherSessions
    .filter((s) => s.student === student.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  // default pilih sesi pertama yang laporannya belum dibuat
  const initial = (sessions.find((s) => !s.reportDone) ?? sessions[sessions.length - 1])?.date ?? toISODate(new Date());
  const [selected, setSelected] = useState(initial);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = initial.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const today = toISODate(new Date());
  const days = buildMonth(cursor.year, cursor.month);
  const session = sessions.find((s) => s.date === selected);
  const previous = [...sessions].reverse().find((s) => s.date < selected);

  const changeStudent = (s: (typeof students)[number]) => {
    setStudent(s);
    const list = teacherSessions.filter((x) => x.student === s.id).sort((a, b) => a.date.localeCompare(b.date));
    const next = (list.find((x) => !x.reportDone) ?? list[list.length - 1])?.date;
    if (next) {
      setSelected(next);
      const [y, m] = next.split('-').map(Number);
      setCursor({ year: y, month: m - 1 });
    }
  };

  const shiftMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <Screen>
      <TabHeader title="Jadwal" />
      <ChildSwitcher items={students} value={student} onChange={changeStudent} />

      <ClayCard style={styles.calendar}>
        <View style={styles.monthRow}>
          <AppText style={styles.month}>
            {MONTHS[cursor.month]} {cursor.year}
          </AppText>
          <Pressable accessibilityLabel="Bulan sebelumnya" onPress={() => shiftMonth(-1)} style={[styles.nav, Shadow.soft]}>
            <Feather name="chevron-left" size={20} color={Colors.text} />
          </Pressable>
          <Pressable accessibilityLabel="Bulan berikutnya" onPress={() => shiftMonth(1)} style={[styles.nav, Shadow.soft]}>
            <Feather name="chevron-right" size={20} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {WEEKDAYS.map((d, i) => (
            <AppText key={d} style={[styles.weekday, i === 0 && { color: Colors.red }]}>
              {d}
            </AppText>
          ))}
          {days.map((d) => {
            const s = sessions.find((x) => x.date === d.iso);
            const isSelected = d.iso === selected;
            return (
              <View key={d.iso} style={styles.cell}>
                {d.inMonth ? (
                  <Pressable
                    accessibilityLabel={formatLongDate(d.iso)}
                    onPress={() => setSelected(d.iso)}
                    style={[
                      styles.day,
                      s && styles.daySession,
                      isSelected && styles.daySelected,
                      d.iso === today && styles.dayToday,
                    ]}>
                    <AppText style={[styles.dayText, (s || isSelected) && { color: '#FFFFFF' }]}>{d.date}</AppText>
                    {s?.attention && <View style={styles.dot} />}
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
        <Legend color={Colors.primary} label="Sesi Ajar" />
        <Legend color={Colors.red} label="Perlu Perhatian" />
        <Legend color={Colors.yellow} label="Hari Ini" ring />
      </View>

      <DateTitle iso={selected} />
      {session ? (
        <SessionCard session={session} />
      ) : (
        <ClayCard>
          <EmptyState title="Tidak ada sesi" subtitle="Pilih tanggal yang ditandai biru untuk melihat sesi." />
        </ClayCard>
      )}

      {previous && (
        <>
          <DateTitle iso={previous.date} />
          <SessionCard session={previous} />
        </>
      )}

      <PrimaryButton
        title="Buat Laporan Mingguan"
        leadingIcon="file-text"
        onPress={() => router.push({ pathname: '/teacher/laporan', params: { student: student.id } })}
      />
    </Screen>
  );
}

function DateTitle({ iso }: { iso: string }) {
  return (
    <View style={styles.dateRow}>
      <MaterialCommunityIcons name="calendar-text" size={22} color={Colors.primary} />
      <AppText style={styles.dateTitle}>{formatLongDate(iso)}</AppText>
    </View>
  );
}

function SessionCard({ session }: { session: TeacherSession }) {
  const done = session.reportDone;
  return (
    <ClayCard style={styles.session}>
      <View style={styles.sessionTop}>
        <View style={[styles.sessionIcon, { backgroundColor: done ? Colors.green : Colors.primarySoft }]}>
          <Feather name={done ? 'check' : 'edit-3'} size={22} color={done ? '#FFFFFF' : Colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.sessionTitle}>Sesi {session.number}</AppText>
          <AppText variant="caption" color={done ? Colors.green : Colors.primary}>
            {done ? 'Laporan observasi sudah dikirim' : 'Laporan observasi belum dibuat'}
          </AppText>
        </View>
        <Pill label={session.time} tone="blue" size="md" />
      </View>
      {done ? (
        <Pressable
          onPress={() => router.push({ pathname: '/report-card/[id]', params: { id: 's1' } })}
          style={[styles.outline, Shadow.soft]}>
          <AppText style={styles.outlineText}>Lihat Laporan</AppText>
        </Pressable>
      ) : (
        <PrimaryButton
          title="Tulis Laporan Sekarang"
          leadingIcon="plus-circle"
          onPress={() =>
            router.push({
              pathname: '/teacher/laporan-harian',
              params: { student: session.student, session: String(session.number) },
            })
          }
        />
      )}
    </ClayCard>
  );
}

function Legend({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <View style={[styles.legendItem, Shadow.soft]}>
      <View style={[styles.legendDot, ring ? { borderWidth: 2, borderColor: color } : { backgroundColor: color }]} />
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
    lineHeight: 30,
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
  daySession: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  daySelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: '#123A66',
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
  dot: {
    position: 'absolute',
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
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
    lineHeight: 24,
  },
  session: {
    gap: 14,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  outline: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.blueMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
});
