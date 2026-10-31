import { useSyncExternalStore } from 'react';

import { children as initialChildren, type Child } from '@/data/parent';
import type { Skill } from '@/data/teachers';

// daftar anak milik orang tua, bisa bertambah lewat "Tambah anak" (khusus Plus)
let list: Child[] = initialChildren;
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

// kondisi dari form registrasi -> kategori skill untuk matching
const CONDITION_SKILL: Record<string, Skill> = {
  'Speech delay': 'speech',
  'Sulit menyampaikan kebutuhan': 'communication',
  'Kesulitan memahami instruksi': 'communication',
  'Sulit berinteraksi dengan teman': 'social',
  'Kurang kontak mata': 'autism',
  'Sulit bergiliran & berbagi': 'social',
  'Sulit fokus & konsentrasi': 'adhd',
  'Kesulitan membaca & menulis': 'academic',
  'Kesulitan berhitung': 'academic',
  'Sensitif terhadap suara': 'sensory',
  'Sensitif terhadap sentuhan': 'sensory',
  'Mencari stimulasi berlebih': 'sensory',
};

export function addChild(input: { name: string; schoolLevel: string; domicile: string; conditions: string[] }) {
  const needs = [...new Set(input.conditions.map((c) => CONDITION_SKILL[c]).filter(Boolean))];
  const child: Child = {
    id: `anak-${Date.now()}`,
    name: input.name.split(' ')[0],
    fullName: input.name,
    grade: input.schoolLevel,
    condition: input.conditions.slice(0, 2).join(' & ') || 'Belum diketahui',
    needs: needs.length ? needs : ['communication'],
    city: input.domicile.split(',')[0],
  };
  list = [...list, child];
  listeners.forEach((l) => l());
  return child;
}
