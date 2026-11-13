import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';

import type { Child } from '@/data/parent';
import {
  AYAS,
  connectedTeachers,
  demoTeachers,
  MATCH_COUNT,
  MAX_SKIPS,
  serverMatch,
  SKILL_LABELS,
  teacherPool,
  type Skill,
  type Teacher,
} from '@/data/teachers';

import { api, errorMessage } from './api';
import { loadThreads } from './chat-store';
import { showAlert } from './dialog';
import { getPlan } from './membership-store';
import { getSession } from './session';

// Teacher Matching: 5 teacher paling cocok per anak dihitung server (GET /matching/teachers).
// Batas skip harian juga dicek server (skipsLeft null = Dubidu Plus, tanpa batas).
type State = {
  skipsLeft: number | null;
  shown: Record<string, Teacher[]>;
  loading: Record<string, boolean>;
  connected: string[];
};

const EMPTY: State = { skipsLeft: MAX_SKIPS, shown: {}, loading: {}, connected: [] };
let state: State = EMPTY;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function useMatching() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

type Card = {
  id: string;
  name: string;
  about: string | null;
  city: string | null;
  price: number;
  rating: number;
  reviews: number;
  experience: number;
  responseRate: number;
  sessions: number;
  skills: Record<Skill, number>;
  matchPercent: number;
  connected: boolean;
  reasons?: string[];
  caution?: string | null;
};

type MatchList = { skipsLeft: number | null; cards: Card[] };

const toTeacher = (c: Card): Teacher => ({
  id: c.id,
  name: c.name,
  city: c.city ?? '-',
  price: c.price,
  rating: c.rating,
  reviews: c.reviews,
  experience: c.experience,
  responseRate: c.responseRate,
  sessions: c.sessions,
  about: c.about ?? '',
  skills: c.skills,
  reasons: c.reasons,
  caution: c.caution,
});

// --- akun demo orang tua -------------------------------------------------------
// Antrian kandidat & jumlah "Lewati" hari ini dihitung di perangkat, supaya alur
// lewati 5× → halaman batas → Dubidu Plus selalu bisa didemokan (teacher demo di server sedikit).
// Teacher yang dilewati pindah ke belakang antrian, jadi daftar tidak pernah habis.
const demoQueue: Record<string, Teacher[]> = {};
let demoSkips = { day: '', count: 0 };

const isDemo = () => getSession().isDemo;
const today = () => new Date().toDateString();

function demoSkipsLeft() {
  if (demoSkips.day !== today()) demoSkips = { day: today(), count: 0 };
  return Math.max(0, MAX_SKIPS - demoSkips.count);
}

// kartu contoh (bukan dari server) diberi alasan dengan pola yang sama seperti alasan dari server
function demoReasons(t: Teacher, child: Child): Teacher {
  if (t.reasons?.length) return t;
  const strong = (Object.entries(t.skills) as [Skill, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => `${SKILL_LABELS[k]} (${v})`);
  return {
    ...t,
    reasons: [
      `Kuat di ${strong.join(' & ')}, sesuai kebutuhan ${child.name}`,
      `Berdomisili di ${t.city}`,
      `Rating ${t.rating} dari ${t.reviews} ulasan orang tua`,
    ],
    caution: null,
  };
}

function demoList(child: Child, server: Teacher[]) {
  const names = new Set(server.map((t) => t.name.split(',')[0]));
  const extras = demoTeachers.filter((t) => !names.has(t.name.split(',')[0])).map((t) => demoReasons(t, child));
  // kartu contoh juga masuk teacherPool supaya profil & bandingkan bisa membacanya
  for (const t of extras) if (!teacherPool.some((x) => x.id === t.id)) teacherPool.push(t);
  serverMatch[child.id] = { [AYAS.id]: 97, ...serverMatch[child.id] };

  const prev = demoQueue[child.id];
  const queue = prev
    ? prev.map((t) => server.find((x) => x.id === t.id) ?? t)
    : [...extras.filter((t) => t.id === AYAS.id), ...server, ...extras.filter((t) => t.id !== AYAS.id)];
  for (const t of server) if (!queue.some((x) => x.id === t.id)) queue.push(t);
  demoQueue[child.id] = queue;
  return queue.slice(0, MATCH_COUNT);
}

export const isDemoMatching = isDemo;

/** Ulang demo: kuota lewati kembali penuh & urutan kartu seperti awal */
export function resetDemoMatching(child: Child) {
  for (const key of Object.keys(demoQueue)) delete demoQueue[key];
  demoSkips = { day: today(), count: 0 };
  set({ ...state, skipsLeft: MAX_SKIPS });
  return loadMatches(child);
}

// kartu teacher juga disimpan di teacherPool supaya profil & bandingkan bisa membacanya
function remember(child: Child, list: MatchList) {
  const fromServer = list.cards.map(toTeacher);
  const teachers = isDemo() ? demoList(child, fromServer) : fromServer;
  for (const t of fromServer) {
    const i = teacherPool.findIndex((x) => x.id === t.id);
    if (i >= 0) teacherPool[i] = t;
    else teacherPool.push(t);
  }
  serverMatch[child.id] = { ...serverMatch[child.id], ...Object.fromEntries(list.cards.map((c) => [c.id, c.matchPercent])) };
  const connected = list.cards.filter((c) => c.connected).map((c) => c.id);
  set({
    ...state,
    skipsLeft: isDemo() ? demoSkipsLeft() : list.skipsLeft,
    shown: { ...state.shown, [child.id]: teachers },
    loading: { ...state.loading, [child.id]: false },
    connected: [...new Set([...state.connected, ...connected])],
  });
}

export async function loadMatches(child: Child) {
  set({ ...state, loading: { ...state.loading, [child.id]: true } });
  try {
    remember(child, await api<MatchList>(`/matching/teachers?childId=${child.id}`));
  } catch (e) {
    set({ ...state, loading: { ...state.loading, [child.id]: false } });
    showAlert('Daftar teacher belum termuat', errorMessage(e));
  }
}

export function shownFor(current: State, child: Child) {
  return current.shown[child.id] ?? [];
}

export async function skipTeacher(child: Child, teacher: Teacher) {
  if (isDemo()) {
    if (!getPlan('parent')) {
      if (demoSkipsLeft() <= 0) return;
      demoSkips.count++;
    }
    const queue = [...(demoQueue[child.id] ?? []).filter((t) => t.id !== teacher.id), teacher];
    demoQueue[child.id] = queue;
    set({ ...state, skipsLeft: demoSkipsLeft(), shown: { ...state.shown, [child.id]: queue.slice(0, MATCH_COUNT) } });
    return;
  }
  // langsung hilang dari layar, daftar pengganti datang dari server
  set({ ...state, shown: { ...state.shown, [child.id]: shownFor(state, child).filter((t) => t.id !== teacher.id) } });
  try {
    remember(child, await api<MatchList>(`/matching/teachers/${teacher.id}/skip`, { body: { childId: child.id } }));
  } catch (e) {
    showAlert('Belum bisa melewati teacher', errorMessage(e));
    loadMatches(child);
  }
}

/** Kirim pesan penawaran (server membuat chat + pengajuan), lalu buka room chat-nya */
export async function connectTeacher(teacher: Teacher, child: Child) {
  // teacher contoh (akun demo) tidak ada di server: cukup tandai sudah dihubungi
  if (teacher.id.startsWith('t-')) {
    set({ ...state, connected: [...new Set([...state.connected, teacher.id])] });
    showAlert('Penawaran terkirim', `${teacher.name.split(',')[0]} akan membalas penawaranmu untuk ${child.name} lewat chat.`);
    return;
  }
  try {
    const { conversationId } = await api<{ conversationId: string }>(`/matching/teachers/${teacher.id}/connect`, {
      body: { childId: child.id },
    });
    set({ ...state, connected: [...new Set([...state.connected, teacher.id])] });
    await loadThreads();
    router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
  } catch (e) {
    showAlert('Penawaran belum terkirim', errorMessage(e));
  }
}

type TeacherDetail = {
  id: string;
  fullName: string;
  about: string | null;
  area: string | null;
  pricePerSession: number;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  sessionsDone: number;
  skills: Record<Skill, number>;
};

/** Profil teacher yang belum ada di daftar matching (mis. dibuka dari chat) */
export async function loadTeacher(id: string) {
  const t = await api<TeacherDetail>(`/teachers/${id}`);
  const teacher: Teacher = {
    id: t.id,
    name: t.fullName,
    city: (t.area ?? '-').split(',').pop()?.trim() ?? '-',
    price: t.pricePerSession,
    rating: t.rating,
    reviews: t.reviewCount,
    experience: t.experienceYears,
    responseRate: 100,
    sessions: t.sessionsDone,
    about: t.about ?? '',
    skills: t.skills,
  };
  if (!connectedTeachers.some((x) => x.id === id)) connectedTeachers.push(teacher);
  set({ ...state });
  return teacher;
}

export function resetMatching() {
  for (const key of Object.keys(demoQueue)) delete demoQueue[key];
  demoSkips = { day: '', count: 0 };
  set(EMPTY);
}
