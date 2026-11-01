import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';

import type { Child } from '@/data/parent';
import { connectedTeachers, MAX_SKIPS, serverMatch, teacherPool, type Skill, type Teacher } from '@/data/teachers';

import { api, errorMessage } from './api';
import { loadThreads } from './chat-store';
import { showAlert } from './dialog';

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
});

// kartu teacher juga disimpan di teacherPool supaya profil & bandingkan bisa membacanya
function remember(child: Child, list: MatchList) {
  const teachers = list.cards.map(toTeacher);
  for (const t of teachers) {
    const i = teacherPool.findIndex((x) => x.id === t.id);
    if (i >= 0) teacherPool[i] = t;
    else teacherPool.push(t);
  }
  serverMatch[child.id] = { ...serverMatch[child.id], ...Object.fromEntries(list.cards.map((c) => [c.id, c.matchPercent])) };
  const connected = list.cards.filter((c) => c.connected).map((c) => c.id);
  set({
    ...state,
    skipsLeft: list.skipsLeft,
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
  set(EMPTY);
}
