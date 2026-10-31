import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';

import {
  CHILD_MAX_SKIPS,
  findChildReplacement,
  initialChildMatches,
  needLabels,
  teacherProfile,
  type SeekingChild,
} from '@/data/teacher';

import { getThread, upsertThread } from './chat-store';
import { getPlan } from './membership-store';

// sama seperti matching parent: disimpan di memori, batas harian beneran nanti dicek backend
type State = {
  skipsUsed: number;
  shown: SeekingChild[] | null;
  seen: string[];
  connected: string[];
  declined: string[];
};

let state: State = { skipsUsed: 0, shown: null, seen: [], connected: [], declined: [] };
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

// anak yang permintaannya dilewati di halaman detail tidak ditampilkan lagi
export function shownChildren(current: State) {
  return (current.shown ?? initialChildMatches()).filter((c) => !current.declined.includes(c.id));
}

export function skipChild(child: SeekingChild) {
  if (state.skipsUsed >= CHILD_MAX_SKIPS && !getPlan('teacher')) return;
  const current = shownChildren(state);
  const seen = state.seen.length ? state.seen : current.map((c) => c.id);
  const replacement = findChildReplacement(child, [...seen, ...state.declined]);
  set({
    ...state,
    skipsUsed: state.skipsUsed + 1,
    shown: current.flatMap((c) => (c.id === child.id ? (replacement ? [replacement] : []) : [c])),
    seen: replacement ? [...seen, replacement.id] : seen,
  });
}

export function declineRequest(childId: string) {
  if (!state.declined.includes(childId)) set({ ...state, declined: [...state.declined, childId] });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// teacher menawarkan diri: kirim chat ke orang tua lalu buka room chat-nya
export function connectChild(child: SeekingChild, accepted = false) {
  const threadId = `tc-${child.id}`;
  if (!state.connected.includes(child.id)) {
    const time = nowTime();
    const text = accepted
      ? `Halo ${child.parent}! Saya ${teacherProfile.name}, saya menerima tawaran pendampingan untuk ${child.initials}. Kapan kita bisa atur jadwal observasi pertama?`
      : `Halo ${child.parent}! Saya ${teacherProfile.name}, shadow teacher ${teacherProfile.title.toLowerCase()}. Saya melihat profil ${child.initials} (${child.age} tahun, ${needLabels(child.needs).join(' & ')}) dan tertarik untuk mendampingi. Boleh kita diskusi lebih lanjut?`;
    if (!getThread(threadId)) {
      upsertThread({
        id: threadId,
        name: child.parent,
        role: 'Orang Tua',
        owner: 'teacher',
        verified: true,
        online: true,
        child: child.initials,
        preview: text,
        time,
        unread: 0,
        messages: [{ id: `offer-${Date.now()}`, from: 'me', type: 'text', text, time, read: false }],
      });
    }
    set({ ...state, connected: [...state.connected, child.id] });
  }
  router.push({ pathname: '/chat/[id]', params: { id: threadId } });
}
