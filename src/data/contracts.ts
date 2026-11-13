// data kontrak pendampingan, dipakai oleh orang tua & teacher
import type { Tone } from '@/components/parent/tones';

import type { Gender } from './teacher';

export type Contract = {
  id: string;
  childName: string;
  childAge: number;
  gender: Gender;
  childId: string;
  parentName: string;
  teacherName: string;
  teacherId: string;
  parentChatId: string;
  teacherChatId: string;
  tags: { label: string; tone: Tone }[];
  done: number;
  total: number;
  phase: string;
  period: string;
  weekdays: number[]; // 0 = Minggu
  weekdayLabel: string;
  hours: string;
  durationLabel: string;
  location: string;
  rate: number;
  sessionsPerTermin: number;
  // true = dibangun dari data kontrak di server (bukan data contoh)
  server?: boolean;
};

export const contracts: Contract[] = [
  {
    id: 'elisya',
    childName: 'Elisya',
    childAge: 8,
    gender: 'female',
    childId: 'elisya',
    parentName: 'Sarah Wijaya',
    teacherName: 'Pras Karunia, S.Pd',
    teacherId: 'pras',
    parentChatId: 'tc-sarah',
    teacherChatId: 'tc-sarah',
    tags: [
      { label: 'Speech Delay', tone: 'green' },
      { label: 'Sulit Fokus', tone: 'red' },
    ],
    done: 8,
    total: 12,
    phase: 'Target Smt 1',
    period: '10 Agu – 12 Des 2026',
    weekdays: [5, 6],
    weekdayLabel: 'Jumat & Sabtu',
    hours: '08:00 – 11:30 WIB',
    durationLabel: '3,5 jam per sesi',
    location: 'SDN Klojen 01, Kota Malang',
    rate: 150000,
    sessionsPerTermin: 4,
  },
  {
    id: 'kenneth',
    childName: 'Kenneth',
    childAge: 7,
    gender: 'male',
    childId: 'kenneth',
    parentName: 'Laras Setiawati',
    teacherName: 'Pras Karunia, S.Pd',
    teacherId: 'pras',
    parentChatId: 'tc-larasati',
    teacherChatId: 'tc-larasati',
    tags: [
      { label: 'ADHD', tone: 'red' },
      { label: 'Sensorik', tone: 'blue' },
    ],
    done: 3,
    total: 8,
    phase: 'Fase Adaptasi',
    period: '1 Sep – 20 Nov 2026',
    weekdays: [6],
    weekdayLabel: 'Sabtu',
    hours: '10:00 – 12:00 WIB',
    durationLabel: '2 jam per sesi',
    location: 'Rumah (Home visit), Lowokwaru',
    rate: 140000,
    sessionsPerTermin: 4,
  },
  {
    id: 'bella',
    childName: 'Bella',
    childAge: 9,
    gender: 'female',
    childId: 'bella',
    parentName: 'Rini Hartati',
    teacherName: 'Pras Karunia, S.Pd',
    teacherId: 'pras',
    parentChatId: 'tc-rini',
    teacherChatId: 'tc-rini',
    tags: [{ label: 'Speech Delay', tone: 'green' }],
    done: 10,
    total: 12,
    phase: 'Hampir Selesai',
    period: '2 Jul – 30 Okt 2026',
    weekdays: [1],
    weekdayLabel: 'Senin',
    hours: '14:00 – 16:00 WIB',
    durationLabel: '2 jam per sesi',
    location: 'SD Tunas Bangsa, Kota Malang',
    rate: 150000,
    sessionsPerTermin: 4,
  },
];

// kontrak di sisi orang tua (id mengikuti kartu "Sedang Didampingi")
contracts.push(
  {
    id: 'm-nielsen',
    childName: 'Elisya',
    childAge: 8,
    gender: 'female',
    childId: 'elisya',
    parentName: 'Devi Anggraini',
    teacherName: 'Nielsen Dave, S.Pd',
    teacherId: 'nielsen',
    parentChatId: 'nielsen',
    teacherChatId: 'nielsen',
    tags: [
      { label: 'Speech Delay', tone: 'green' },
      { label: 'Sulit Fokus', tone: 'red' },
    ],
    done: 8,
    total: 12,
    phase: 'Target Smt 1',
    period: '10 Agu – 12 Des 2026',
    weekdays: [5, 6],
    weekdayLabel: 'Jumat & Sabtu',
    hours: '08:00 – 11:30 WIB',
    durationLabel: '3,5 jam per sesi',
    location: 'SDN Klojen 01, Kota Malang',
    rate: 150000,
    sessionsPerTermin: 4,
  },
  {
    id: 'm-larasati',
    childName: 'Cheryl',
    childAge: 8,
    gender: 'female',
    childId: 'cheryl',
    parentName: 'Devi Anggraini',
    teacherName: 'Larasati Sudigdo, S.Psi',
    teacherId: 'larasati',
    parentChatId: 'larasati',
    teacherChatId: 'larasati',
    tags: [
      { label: 'ADHD', tone: 'red' },
      { label: 'Sensorik', tone: 'blue' },
    ],
    done: 3,
    total: 8,
    phase: 'Fase Adaptasi',
    period: '1 Sep – 20 Nov 2026',
    weekdays: [6],
    weekdayLabel: 'Sabtu',
    hours: '10:00 – 12:00 WIB',
    durationLabel: '2 jam per sesi',
    location: 'Rumah (Home visit), Lowokwaru',
    rate: 140000,
    sessionsPerTermin: 4,
  }
);

// teacher membuka kontrak lewat id anak, orang tua lewat id kontrak
export function findContract(id: string) {
  return contracts.find((c) => c.id === id) ?? contracts.find((c) => c.server && c.childId === id);
}

// ---------------------------------------------------------------------------
// kontrak dari server (GET /engagements) → bentuk Contract di aplikasi

export type ServerEngagement = {
  id: string;
  teacher: { id: string; name: string };
  parent: { id: string; name: string };
  child: { id: string; name: string; fullName: string };
  chatId: string | null;
  tags: { label: string; tone: Tone }[];
  done: number;
  total: number;
  phase: string | null;
  ratePerSession?: number;
  frequency?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
};

export function contractFromEngagement(e: ServerEngagement, extra: { childAge?: number; gender?: Gender } = {}): Contract {
  // "2x seminggu (Jumat & Sabtu)" → Jumat & Sabtu; "3x seminggu" → Sen/Rab/Jum; "Setiap hari sekolah" → Sen–Jum
  const freq = (e.frequency ?? '').toLowerCase();
  const named = DAY_NAMES.map((d, i) => (freq.includes(d.toLowerCase()) ? i : -1)).filter((i) => i >= 0);
  const perWeek = Number(freq.match(/(\d)\s*x/)?.[1] ?? 0);
  const weekdays = named.length
    ? named
    : freq.includes('setiap hari')
      ? [1, 2, 3, 4, 5]
      : ({ 1: [1], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] } as Record<number, number[]>)[perWeek] ?? [1, 4];
  const period =
    e.startDate && e.endDate
      ? `${shortDate(e.startDate)} – ${shortDate(e.endDate)}`
      : e.startDate
        ? `Mulai ${shortDate(e.startDate)}`
        : 'Sesuai kesepakatan';
  return {
    id: e.id,
    server: true,
    childName: e.child.name,
    childAge: extra.childAge ?? 0,
    gender: extra.gender ?? 'female',
    childId: e.child.id,
    parentName: e.parent.name,
    teacherName: e.teacher.name,
    teacherId: e.teacher.id,
    parentChatId: e.chatId ?? '',
    teacherChatId: e.chatId ?? '',
    tags: e.tags,
    done: e.done,
    total: e.total,
    phase: e.phase ?? 'Pendampingan',
    period,
    weekdays,
    weekdayLabel:
      weekdays.length === 5 && !weekdays.includes(0) && !weekdays.includes(6)
        ? 'Senin – Jumat'
        : weekdays.map((d) => DAY_NAMES[d]).join(', ').replace(/, ([^,]+)$/, ' & $1'),
    hours: '08:00 – 10:00 WIB',
    durationLabel: '2 jam per sesi',
    location: e.location ?? 'Sekolah anak',
    rate: e.ratePerSession ?? 150000,
    sessionsPerTermin: 4,
  };
}

/** Ganti kontrak hasil server (data contoh tetap) */
export function setServerContracts(list: Contract[]) {
  for (let i = contracts.length - 1; i >= 0; i--) if (contracts[i].server) contracts.splice(i, 1);
  contracts.push(...list);
}

export const PLATFORM_FEE = 0.1;

export function termins(c: Contract) {
  const count = Math.ceil(c.total / c.sessionsPerTermin);
  return Array.from({ length: count }, (_, i) => {
    const from = i * c.sessionsPerTermin + 1;
    const to = Math.min(c.total, (i + 1) * c.sessionsPerTermin);
    return { label: `Termin ${i + 1}`, sessions: `Sesi ${from}–${to}`, gross: (to - from + 1) * c.rate, paid: to <= c.done };
  });
}

// 3 jadwal sesi berikutnya mulai hari ini
export function nextSessionDates(c: Contract, count = 3) {
  const dates: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    d.setDate(d.getDate() + 1);
    if (c.weekdays.includes(d.getDay())) dates.push(new Date(d));
  }
  return dates;
}
