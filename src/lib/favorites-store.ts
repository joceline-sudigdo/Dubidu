import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import { getSession } from './session';

// teacher & psikolog favorit milik akun yang sedang login, disimpan di perangkat
type Kind = 'teachers' | 'psychologists';
type State = { userId: string; teachers: string[]; psychologists: string[] };

let state: State = { userId: '', teachers: [], psychologists: [] };
const listeners = new Set<() => void>();

const key = (userId: string) => `dubidu:favorites:${userId}`;

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
  if (next.userId) {
    AsyncStorage.setItem(key(next.userId), JSON.stringify({ teachers: next.teachers, psychologists: next.psychologists })).catch(
      () => {}
    );
  }
}

/** Muat favorit akun yang sedang login (sekali per akun) */
async function ensureLoaded() {
  const userId = getSession().id;
  if (!userId || state.userId === userId) return;
  state = { userId, teachers: [], psychologists: [] };
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
    state = { userId, teachers: saved.teachers ?? [], psychologists: saved.psychologists ?? [] };
  } catch {
    // data rusak / storage tidak bisa dibaca → mulai dari kosong
  }
  listeners.forEach((l) => l());
}

export function useFavorites() {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export const isFavorite = (current: State, kind: Kind, id: string) => current[kind].includes(id);

/** Tambah / hapus favorit; mengembalikan status baru (true = sekarang favorit) */
export function toggleFavorite(kind: Kind, id: string) {
  const on = !state[kind].includes(id);
  set({ ...state, [kind]: on ? [...state[kind], id] : state[kind].filter((x) => x !== id) });
  return on;
}
