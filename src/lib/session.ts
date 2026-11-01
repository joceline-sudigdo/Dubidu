import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { UserRole } from './auth';

// user yang sedang login. Disimpan di HP supaya tetap masuk setelah aplikasi ditutup
// (token login sendiri disimpan terpisah & terenkripsi, lihat lib/api.ts).
export type Session = {
  id: string;
  role: UserRole;
  name: string; // nama lengkap
  nickname: string; // sapaan "Halo, Devi"
  email: string | null;
  phone: string | null;
  domicile: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
};

const KEY = 'dubidu.session';
const EMPTY: Session = {
  id: '',
  role: 'parent',
  name: '',
  nickname: '',
  email: null,
  phone: null,
  domicile: null,
  avatarUrl: null,
  isDemo: false,
};

let current: Session = EMPTY;
const listeners = new Set<() => void>();

export function setSession(session: Session) {
  current = session;
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(session)).catch(() => {});
}

export function updateSession(values: Partial<Session>) {
  setSession({ ...current, ...values });
}

export function clearSession() {
  current = EMPTY;
  listeners.forEach((l) => l());
  AsyncStorage.removeItem(KEY).catch(() => {});
}

export function getSession() {
  return current;
}

export function useSession() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}

/** Baca sesi tersimpan saat aplikasi dibuka. null = belum login. */
export async function restoreSession() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    current = { ...EMPTY, ...(JSON.parse(raw) as Session) };
    return current.id ? current : null;
  } catch {
    return null;
  }
}
