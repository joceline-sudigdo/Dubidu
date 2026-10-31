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
};

export const contracts: Contract[] = [
  {
    id: 'elisya',
    childName: 'Elisya',
    childAge: 8,
    gender: 'female',
    childId: 'elisya',
    parentName: 'Bunda Sarah',
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
    parentName: 'Bunda Larasati',
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
    parentName: 'Mama Rini',
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
    parentName: 'Bunda Devi',
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
    parentName: 'Bunda Devi',
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

export function findContract(id: string) {
  return contracts.find((c) => c.id === id);
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
