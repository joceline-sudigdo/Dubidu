import { useSyncExternalStore } from 'react';

import type { PlusRole } from '@/data/plus';

import type { UserRole } from './auth';
import { getSession } from './session';

// poin ikan per role (orang tua & teacher), disimpan di memori sampai backend siap
export type PointLog = { id: string; title: string; amount: number; time: string };

type State = {
  points: Record<PlusRole, number>;
  checkinClaimed: Record<PlusRole, boolean>;
  claimedMissions: Record<PlusRole, string[]>;
  redeemed: Record<PlusRole, string[]>;
  history: Record<PlusRole, PointLog[]>;
};

let state: State = {
  points: { parent: 1240, teacher: 860 },
  checkinClaimed: { parent: false, teacher: false },
  claimedMissions: { parent: [], teacher: [] },
  redeemed: { parent: ['r-kopi'], teacher: [] },
  history: {
    parent: [
      { id: 'h1', title: 'Check-in harian', amount: 20, time: 'Kemarin' },
      { id: 'h2', title: 'Isi laporan perkembangan', amount: 30, time: '2 hari lalu' },
      { id: 'h3', title: 'Tukar voucher kopi', amount: -300, time: 'Minggu lalu' },
    ],
    teacher: [
      { id: 'h1', title: 'Check-in harian', amount: 20, time: 'Kemarin' },
      { id: 'h2', title: 'Kirim laporan harian tepat waktu', amount: 40, time: '2 hari lalu' },
    ],
  },
};
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function usePoints() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export const hasPoints = (role: UserRole): role is PlusRole => role === 'parent' || role === 'teacher';

const currentRole = (): PlusRole => {
  const role = getSession().role;
  return hasPoints(role) ? role : 'parent';
};

function log(role: PlusRole, title: string, amount: number) {
  return [{ id: `p-${Date.now()}`, title, amount, time: 'Baru saja' }, ...state.history[role]];
}

export function addPoints(title: string, amount: number) {
  const role = currentRole();
  set({
    ...state,
    points: { ...state.points, [role]: state.points[role] + amount },
    history: { ...state.history, [role]: log(role, title, amount) },
  });
}

export function claimCheckin(amount: number) {
  const role = currentRole();
  if (state.checkinClaimed[role]) return false;
  addPoints('Check-in harian', amount);
  set({ ...state, checkinClaimed: { ...state.checkinClaimed, [role]: true } });
  return true;
}

export function claimMission(id: string, title: string, amount: number) {
  const role = currentRole();
  if (state.claimedMissions[role].includes(id)) return;
  addPoints(title, amount);
  set({ ...state, claimedMissions: { ...state.claimedMissions, [role]: [...state.claimedMissions[role], id] } });
}

// tukar hadiah: kurangi poin, false kalau poin tidak cukup
export function redeemReward(id: string, title: string, cost: number) {
  const role = currentRole();
  if (state.points[role] < cost) return false;
  set({
    ...state,
    points: { ...state.points, [role]: state.points[role] - cost },
    redeemed: { ...state.redeemed, [role]: [...state.redeemed[role], id] },
    history: { ...state.history, [role]: log(role, `Tukar ${title}`, -cost) },
  });
  return true;
}
