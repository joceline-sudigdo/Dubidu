// Detail kontrak pendampingan dari server (GET /engagements/:id) → bentuk Contract di src/data/contracts.ts
import type { Tone } from '@/components/parent/tones';
import { contracts, type Contract } from '@/data/contracts';

import { api } from './api';

type ServerEngagement = {
  id: string;
  status: string;
  teacher: { id: string; name: string };
  parent: { id: string; name: string };
  child: { id: string; name: string; fullName: string; age: number | null; gender: 'MALE' | 'FEMALE' | null };
  chatId: string | null;
  tags: { label: string; tone: Tone }[];
  done: number;
  total: number;
  phase: string;
  ratePerSession: number;
  frequency: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  sessions: { number: number; startAt: string; endAt: string; status: string }[];
};

const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
};

function toContract(e: ServerEngagement): Contract {
  const sessions = e.sessions.map((s) => ({ ...s, start: new Date(s.startAt), end: new Date(s.endAt) }));
  const weekdays = [...new Set(sessions.map((s) => s.start.getDay()))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const sample = sessions.find((s) => s.status === 'SCHEDULED') ?? sessions[sessions.length - 1];
  const minutes = sample ? Math.round((sample.end.getTime() - sample.start.getTime()) / 60000) : 0;
  const now = Date.now();
  return {
    id: e.id,
    childName: e.child.name,
    childAge: e.child.age ?? 0,
    gender: e.child.gender === 'MALE' ? 'male' : 'female',
    childId: e.child.id,
    parentName: e.parent.name,
    teacherName: e.teacher.name,
    teacherId: e.teacher.id,
    parentChatId: e.chatId ?? '',
    teacherChatId: e.chatId ?? '',
    tags: e.tags,
    done: e.done,
    total: e.total,
    phase: e.phase,
    period: e.startDate ? `${shortDate(e.startDate)} – ${e.endDate ? shortDate(e.endDate) : 'berjalan'}` : '-',
    weekdays,
    weekdayLabel: weekdays.length ? weekdays.map((d) => DAY_SHORT[d]).join(', ') : (e.frequency ?? '-'),
    hours: sample ? `${hhmm(sample.start)} - ${hhmm(sample.end)}` : '-',
    durationLabel: minutes ? `${minutes} menit per sesi` : '-',
    location: e.location ?? '-',
    rate: e.ratePerSession,
    sessionsPerTermin: 4,
    upcoming: sessions
      .filter((s) => s.status === 'SCHEDULED' && s.start.getTime() >= now)
      .map((s) => s.start),
  };
}

/** Muat detail kontrak aktif ke `contracts` (dipakai layar kontrak, chat, dan profil anak teacher) */
export async function loadContracts(engagementIds: string[]) {
  const rows = await Promise.all(engagementIds.map((id) => api<ServerEngagement>(`/engagements/${id}`).catch(() => null)));
  contracts.splice(0, contracts.length, ...rows.filter((r): r is ServerEngagement => r !== null).map(toContract));
}

/** Satu kontrak (mis. dibuka dari notifikasi sebelum daftar termuat) */
export async function loadContract(id: string) {
  const row = toContract(await api<ServerEngagement>(`/engagements/${id}`));
  const i = contracts.findIndex((c) => c.id === id);
  if (i >= 0) contracts[i] = row;
  else contracts.push(row);
  return row;
}
