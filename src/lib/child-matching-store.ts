import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';

import { CHILD_MATCH_COUNT, CHILD_MAX_SKIPS, demoSeekingChildren, seekingChildren, serverChildMatch, type SeekingChild } from '@/data/teacher';
import type { Skill } from '@/data/teachers';

import { api, errorMessage } from './api';
import { loadThreads } from './chat-store';
import { showAlert } from './dialog';
import { getPlan } from './membership-store';
import { getSession } from './session';

// Child Matching (sisi teacher): daftar anak paling cocok & batas skip harian dari server (GET /matching/children)
type State = {
  skipsLeft: number | null;
  shown: SeekingChild[] | null;
  connected: string[];
  declined: string[];
};

const EMPTY: State = { skipsLeft: CHILD_MAX_SKIPS, shown: null, connected: [], declined: [] };
let state: State = EMPTY;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function useChildMatching() {
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
  initials: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  grade: string | null;
  city: string | null;
  distanceKm: number | null;
  parent: string;
  needs: Skill[];
  matchPercent: number;
  connected: boolean;
  requestId: string | null;
};

type ChildList = { skipsLeft: number | null; cards: Card[] };

const toSeeking = (c: Card): SeekingChild => ({
  id: c.id,
  initials: c.initials,
  age: c.age ?? 0,
  gender: c.gender === 'MALE' ? 'male' : 'female',
  city: c.city ?? '-',
  area: c.city ?? '-',
  needs: c.needs,
  // detail jadwal & tujuan dibahas langsung dengan orang tua lewat chat
  frequency: 'Dibahas di chat',
  timeOfDay: '-',
  days: '-',
  hours: '-',
  system: 'Dibahas di chat',
  goal: '-',
  note: '',
  parent: c.parent,
  parentRating: 5,
  parentReviews: 0,
  budget: 0,
  distanceKm: c.distanceKm ?? 0,
  requestId: c.requestId,
});

// --- akun demo teacher ---------------------------------------------------------
// Anak yang mencari pendamping di server sedikit, jadi akun demo ditambah anak contoh
// dan kuota "Lewati" dihitung di perangkat: lewati 5× → halaman batas → Dubidu Plus selalu bisa didemokan.
// Anak yang dilewati pindah ke belakang antrian, jadi daftar tidak pernah habis.
let demoQueue: SeekingChild[] | null = null;
let demoSkips = { day: '', count: 0 };

const isDemo = () => getSession().isDemo;
const today = () => new Date().toDateString();

function demoSkipsLeft() {
  if (demoSkips.day !== today()) demoSkips = { day: today(), count: 0 };
  return Math.max(0, CHILD_MAX_SKIPS - demoSkips.count);
}

function demoList(server: SeekingChild[]) {
  const extras = demoSeekingChildren.filter((c) => !server.some((s) => s.id === c.id));
  // anak contoh juga masuk seekingChildren supaya profil & bandingkan bisa membacanya
  for (const c of extras) if (!seekingChildren.some((x) => x.id === c.id)) seekingChildren.push(c);
  const queue = demoQueue ? demoQueue.map((c) => server.find((x) => x.id === c.id) ?? c) : [...server, ...extras];
  for (const c of server) if (!queue.some((x) => x.id === c.id)) queue.push(c);
  demoQueue = queue;
  return queue.slice(0, CHILD_MATCH_COUNT);
}

export const isDemoChildMatching = isDemo;

/** Ulang demo: kuota lewati kembali penuh & urutan kartu seperti awal */
export function resetDemoChildMatching() {
  demoQueue = null;
  demoSkips = { day: today(), count: 0 };
  set({ ...state, skipsLeft: CHILD_MAX_SKIPS });
  return loadChildMatches();
}

function remember(list: ChildList) {
  const fromServer = list.cards.map(toSeeking);
  const children = isDemo() ? demoList(fromServer) : fromServer;
  for (const c of fromServer) {
    const i = seekingChildren.findIndex((x) => x.id === c.id);
    if (i >= 0) seekingChildren[i] = c;
    else seekingChildren.push(c);
  }
  list.cards.forEach((c) => (serverChildMatch[c.id] = c.matchPercent));
  set({
    ...state,
    skipsLeft: isDemo() ? demoSkipsLeft() : list.skipsLeft,
    shown: children,
    connected: [...new Set([...state.connected, ...list.cards.filter((c) => c.connected).map((c) => c.id)])],
  });
}

export async function loadChildMatches() {
  try {
    remember(await api<ChildList>('/matching/children'));
  } catch (e) {
    showAlert('Daftar anak belum termuat', errorMessage(e));
  }
}

// anak yang permintaannya dilewati di halaman detail tidak ditampilkan lagi
export function shownChildren(current: State) {
  return (current.shown ?? []).filter((c) => !current.declined.includes(c.id));
}

export async function skipChild(child: SeekingChild) {
  if (isDemo()) {
    if (!getPlan('teacher')) {
      if (demoSkipsLeft() <= 0) return;
      demoSkips.count++;
    }
    const queue = [...(demoQueue ?? []).filter((c) => c.id !== child.id), child];
    demoQueue = queue;
    set({ ...state, skipsLeft: demoSkipsLeft(), shown: queue.slice(0, CHILD_MATCH_COUNT) });
    return;
  }
  set({ ...state, shown: shownChildren(state).filter((c) => c.id !== child.id) });
  try {
    remember(await api<ChildList>(`/matching/children/${child.id}/skip`, { body: {} }));
  } catch (e) {
    showAlert('Belum bisa melewati anak ini', errorMessage(e));
    loadChildMatches();
  }
}

/** Tolak permintaan orang tua (PATCH /applications/:id) */
export async function declineRequest(childId: string) {
  const child = seekingChildren.find((c) => c.id === childId);
  if (!state.declined.includes(childId)) set({ ...state, declined: [...state.declined, childId] });
  if (child?.requestId) {
    await api(`/applications/${child.requestId}`, { method: 'PATCH', body: { status: 'REJECTED' } }).catch((e) =>
      showAlert('Permintaan belum ditolak', errorMessage(e))
    );
  }
}

/**
 * Teacher menawarkan diri (Hubungkan) atau menerima permintaan orang tua (accepted = true).
 * Server membuat chat + pesan pembuka, lalu room chat dibuka.
 */
export async function connectChild(child: SeekingChild, accepted = false) {
  // anak contoh (akun demo) tidak ada di server: cukup tandai sudah dihubungi
  if (child.id.startsWith('c-')) {
    set({ ...state, connected: [...new Set([...state.connected, child.id])] });
    showAlert('Pesan terkirim', `${child.parent} (orang tua ${child.initials}) akan membalas lewat chat.`);
    return;
  }
  try {
    let conversationId: string | undefined;
    if (accepted && child.requestId) {
      const res = await api<{ conversationId?: string }>(`/applications/${child.requestId}`, { method: 'PATCH', body: { status: 'ACCEPTED' } });
      conversationId = res.conversationId;
    }
    if (!conversationId) {
      ({ conversationId } = await api<{ conversationId: string }>(`/matching/children/${child.id}/connect`, { body: {} }));
    }
    set({ ...state, connected: [...new Set([...state.connected, child.id])] });
    await loadThreads();
    router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
  } catch (e) {
    showAlert(accepted ? 'Tawaran belum diterima' : 'Pesan belum terkirim', errorMessage(e));
  }
}

export function resetChildMatching() {
  demoQueue = null;
  demoSkips = { day: '', count: 0 };
  set(EMPTY);
}
