import { useSyncExternalStore } from 'react';

import type { Child } from '@/data/parent';
import type { Skill } from '@/data/teachers';

import { api } from './api';

// daftar anak milik orang tua (dari server), bisa bertambah lewat "Tambah anak" (khusus Plus)
let list: Child[] = [];
const listeners = new Set<() => void>();

export function useChildren() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => list
  );
}

export function getChildren() {
  return list;
}

/** Anak versi server (presentChild di backend) → bentuk Child di aplikasi */
export type ServerChild = {
  id: string;
  name: string;
  fullName: string;
  grade: string;
  condition: string;
  city: string | null;
  skills: Skill[];
};

export const toChild = (c: ServerChild): Child => ({
  id: c.id,
  name: c.name,
  fullName: c.fullName,
  grade: c.grade || '-',
  condition: c.condition || 'Belum diketahui',
  needs: c.skills.length ? c.skills : ['communication'],
  city: c.city ?? '-',
});

export function setChildren(children: Child[]) {
  list = children;
  listeners.forEach((l) => l());
}

export async function addChild(input: { name: string; birthDate?: string; gender?: 'male' | 'female' | null; schoolLevel: string; domicile: string; conditions: string[] }) {
  const created = await api<ServerChild>('/children', {
    body: {
      name: input.name.split(' ')[0],
      fullName: input.name,
      birthDate: input.birthDate || undefined,
      gender: input.gender ? input.gender.toUpperCase() : undefined,
      schoolLevel: input.schoolLevel,
      domicile: input.domicile || undefined,
      conditions: input.conditions,
    },
  });
  const child = toChild(created);
  setChildren([...list, child]);
  return child;
}
