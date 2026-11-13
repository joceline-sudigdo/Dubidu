// Growth timeline dihitung dari report card anak (terbaru di depan, dari GET /children/:id/reports)
import type { Tone } from '@/components/parent/tones';

import type { SessionReport } from './parent';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** "2026-09-22" → Senin minggu itu, sebagai kunci kelompok */
function weekKey(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

export function buildGrowth(reports: SessionReport[]) {
  const oldestFirst = [...reports].sort((a, b) => a.date.localeCompare(b.date));

  // skor holistik per minggu (rata-rata semua aspek di semua sesi minggu itu), 6 minggu terakhir
  const weeks = new Map<number, { label: string; values: number[] }>();
  for (const r of oldestFirst) {
    const start = weekKey(r.date);
    const key = start.getTime();
    const week = weeks.get(key) ?? { label: `${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`, values: [] };
    week.values.push(avg(r.scores.map((s) => s.value)));
    weeks.set(key, week);
  }
  const weeklyScores = [...weeks.values()].slice(-6).map((w) => ({ label: w.label, value: round1(avg(w.values)) }));

  // per aspek: sesi pertama vs sesi terbaru
  const first = oldestFirst[0];
  const latest = oldestFirst[oldestFirst.length - 1];
  const aspectGrowth = (latest?.scores ?? []).map((s) => {
    const start = first.scores.find((x) => x.label === s.label)?.value ?? s.value;
    const tone: Tone = s.value > start ? 'green' : s.value < start ? 'red' : 'blue';
    return { label: s.label, start, now: s.value, tone };
  });

  // momen penting: pencapaian yang dicatat shadow teacher (4 terbaru)
  const tones: Tone[] = ['green', 'blue', 'yellow', 'red'];
  const milestones = reports
    .filter((r) => r.achievement)
    .slice(0, 4)
    .map((r, i) => {
      const [y, m, d] = r.date.split('-').map(Number);
      return {
        date: `${d} ${MONTH_SHORT[m - 1]} ${y}`,
        title: r.achievement,
        text: `Sesi ke-${r.number} bersama ${r.teacher.split(',')[0]}`,
        tone: tones[i % tones.length],
      };
    });

  return { weeklyScores, aspectGrowth, milestones };
}
