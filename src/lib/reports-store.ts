import { useEffect, useSyncExternalStore } from 'react';

import type { SessionReport } from '@/data/parent';

import { api } from './api';

// report card per anak (GET /children/:id/reports), dimuat saat anak dipilih di layar Jadwal / Growth Timeline
let byChild: Record<string, SessionReport[]> = {};
let loading: Record<string, boolean> = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export async function loadReports(childId: string) {
  loading = { ...loading, [childId]: true };
  emit();
  try {
    const rows = await api<SessionReport[]>(`/children/${childId}/reports`);
    byChild = { ...byChild, [childId]: rows };
  } finally {
    loading = { ...loading, [childId]: false };
    emit();
  }
}

/** Report card anak (terbaru di depan). `loading` true selama permintaan pertama berjalan. */
export function useReports(childId: string | undefined) {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (childId ? byChild[childId] : undefined)
  );
  const isLoading = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (childId ? (loading[childId] ?? !byChild[childId]) : false)
  );
  useEffect(() => {
    if (childId) loadReports(childId).catch(() => {});
  }, [childId]);
  return { reports: snapshot ?? [], loading: isLoading };
}

export function resetReports() {
  byChild = {};
  loading = {};
  emit();
}
