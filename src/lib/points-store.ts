import { useSyncExternalStore } from 'react';

import type { PlusRole } from '@/data/plus';

import { api, errorMessage } from './api';
import type { UserRole } from './auth';
import { showAlert } from './dialog';
import { getSession } from './session';

// poin ikan per role (orang tua & teacher). Saldo dari server, riwayat lokal sejak aplikasi dibuka
export type PointLog = { id: string; title: string; amount: number; time: string };

// satu hari di kartu check-in mingguan (Sen → Min), dari GET /home/parent|teacher
export type CheckinDay = { day: string; reward: number; done?: boolean; today?: boolean; bonus?: boolean };

const DEFAULT_WEEK: CheckinDay[] = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => ({
  day,
  reward: [10, 15, 20, 25, 30, 40, 100][i],
  today: i === (new Date().getDay() + 6) % 7,
  bonus: i === 6,
}));

type State = {
  points: Record<PlusRole, number>;
  checkinClaimed: Record<PlusRole, boolean>;
  claimedMissions: Record<PlusRole, string[]>;
  redeemed: Record<PlusRole, string[]>;
  history: Record<PlusRole, PointLog[]>;
  week: CheckinDay[];
  checkinChildId: string | null; // anak yang dipakai untuk check-in
};

let state: State = {
  points: { parent: 0, teacher: 0 },
  checkinClaimed: { parent: false, teacher: false },
  claimedMissions: { parent: [], teacher: [] },
  redeemed: { parent: [], teacher: [] },
  history: { parent: [], teacher: [] },
  week: DEFAULT_WEEK,
  checkinChildId: null,
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

/** Saldo Madu dari server (GET /auth/me) */
export function setServerPoints(role: PlusRole, points: number) {
  set({ ...state, points: { ...state.points, [role]: points } });
}

export function addPoints(title: string, amount: number) {
  const role = currentRole();
  set({
    ...state,
    points: { ...state.points, [role]: state.points[role] + amount },
    history: { ...state.history, [role]: log(role, title, amount) },
  });
}

/** Kartu check-in dari server (GET /home/parent|teacher → checkin) + anak yang di-check-in */
export function setCheckinWeek(
  role: PlusRole,
  // null = belum ada anak / murid (akun baru) → kartu check-in bawaan, belum bisa diklaim
  checkin: { days: { day: string; reward: number; status: string }[]; todayDone: boolean } | null,
  childId: string | null
) {
  if (!checkin) {
    set({ ...state, week: DEFAULT_WEEK, checkinChildId: null, checkinClaimed: { ...state.checkinClaimed, [role]: false } });
    return;
  }
  const todayIndex = (new Date().getDay() + 6) % 7; // Sen = 0
  const week = checkin.days.map((d, i) => ({ day: d.day, reward: d.reward, done: d.status === 'done', today: i === todayIndex, bonus: i === 6 }));
  set({ ...state, week, checkinChildId: childId, checkinClaimed: { ...state.checkinClaimed, [role]: checkin.todayDone } });
}

/** Klaim Madu hari ini (POST /checkins). Balikan: jumlah Madu yang didapat, atau 0 kalau gagal. */
export async function claimCheckin(mood = 'SENANG') {
  const role = currentRole();
  if (state.checkinClaimed[role]) return 0;
  if (!state.checkinChildId) {
    showAlert('Check-in belum tersedia', role === 'teacher' ? 'Check-in harian bisa diklaim setelah kamu punya anak dampingan.' : 'Tambahkan profil anak dulu untuk mulai check-in harian.');
    return 0;
  }
  try {
    const res = await api<{ pointsEarned: number; points: number }>('/checkins', { body: { childId: state.checkinChildId, mood } });
    set({
      ...state,
      points: { ...state.points, [role]: res.points },
      checkinClaimed: { ...state.checkinClaimed, [role]: true },
      history: { ...state.history, [role]: log(role, 'Check-in harian', res.pointsEarned) },
    });
    return res.pointsEarned;
  } catch (e) {
    showAlert('Check-in belum berhasil', errorMessage(e));
    return 0;
  }
}

export function claimMission(id: string, title: string, amount: number) {
  const role = currentRole();
  if (state.claimedMissions[role].includes(id)) return;
  addPoints(title, amount);
  set({ ...state, claimedMissions: { ...state.claimedMissions, [role]: [...state.claimedMissions[role], id] } });
}

// tukar hadiah lewat server (POST /rewards/:id/redeem) → kode voucher
export async function redeemReward(id: string, title: string, cost: number) {
  const role = currentRole();
  if (state.points[role] < cost) return null;
  try {
    const res = await api<{ redemption: { code: string }; points: number }>(`/rewards/${id}/redeem`, { body: {} });
    set({
      ...state,
      points: { ...state.points, [role]: res.points },
      redeemed: { ...state.redeemed, [role]: [...state.redeemed[role], id] },
      history: { ...state.history, [role]: log(role, `Tukar ${title}`, -cost) },
    });
    return res.redemption.code;
  } catch (e) {
    showAlert('Penukaran gagal', errorMessage(e));
    return null;
  }
}
