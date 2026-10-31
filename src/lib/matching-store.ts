import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';

import { parentProfile, type Child } from '@/data/parent';
import { findReplacement, initialMatches, MAX_SKIPS, type Teacher } from '@/data/teachers';

import { getThread, upsertThread } from './chat-store';
import { getPlan } from './membership-store';

// disimpan di memori aja (reset kalau app di-reload), batas harian beneran nanti dicek backend
type State = {
  skipsUsed: number;
  shown: Record<string, Teacher[]>;
  seen: Record<string, string[]>;
  connected: string[];
};

let state: State = { skipsUsed: 0, shown: {}, seen: {}, connected: [] };
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

// belum pernah skip: pakai 5 teacher paling cocok
export function shownFor(current: State, child: Child) {
  return current.shown[child.id] ?? initialMatches(child);
}

export function skipTeacher(child: Child, teacher: Teacher) {
  if (state.skipsUsed >= MAX_SKIPS && !getPlan('parent')) return;
  const current = shownFor(state, child);
  const seen = state.seen[child.id] ?? current.map((t) => t.id);
  const replacement = findReplacement(teacher, child, seen);
  const shown = current.flatMap((t) =>
    t.id === teacher.id ? (replacement ? [replacement] : []) : [t]
  );
  set({
    ...state,
    skipsUsed: state.skipsUsed + 1,
    shown: { ...state.shown, [child.id]: shown },
    seen: { ...state.seen, [child.id]: replacement ? [...seen, replacement.id] : seen },
  });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// kirim chat penawaran otomatis ke teacher lalu buka room chat-nya
export function connectTeacher(teacher: Teacher, child: Child) {
  if (!state.connected.includes(teacher.id)) {
    const time = nowTime();
    const text = `Halo Kak ${teacher.name.split(' ')[0]}! Saya ${parentProfile.name}, orang tua dari ${child.name} (${child.condition}). Saya tertarik dengan pendampingan Kakak. Apakah Kakak bersedia untuk sesi observasi/trial di ${child.city}?`;
    if (!getThread(teacher.id)) {
      upsertThread({
        id: teacher.id,
        name: teacher.name,
        role: 'Shadow Teacher',
        owner: 'parent',
        verified: true,
        online: true,
        child: child.name,
        preview: text,
        time,
        unread: 0,
        messages: [{ id: `offer-${Date.now()}`, from: 'me', type: 'text', text, time, read: false }],
      });
    }
    set({ ...state, connected: [...state.connected, teacher.id] });
  }
  router.push({ pathname: '/chat/[id]', params: { id: teacher.id } });
}
