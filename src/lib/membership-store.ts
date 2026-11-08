import { useSyncExternalStore } from 'react';

import type { PlusPlan, PlusRole } from '@/data/plus';

import type { UserRole } from './auth';
import { getSession } from './session';

// status langganan Dubidu Plus per role (dimuat dari server saat login, lihat lib/sync.ts)
let plans: Record<PlusRole, PlusPlan | null> = { parent: null, teacher: null };
const listeners = new Set<() => void>();

function set(next: typeof plans) {
  plans = next;
  listeners.forEach((l) => l());
}

export function useMembership() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => plans
  );
}

export const isPlusRole = (role: UserRole): role is PlusRole => role === 'parent' || role === 'teacher';

// paket Plus untuk role yang sedang login (null = Gratis)
export function usePlus(): PlusPlan | null {
  const all = useMembership();
  const role = getSession().role;
  return isPlusRole(role) ? all[role] : null;
}

// dipakai di luar komponen (misal store matching)
export function getPlan(role: PlusRole) {
  return plans[role];
}

// Plus yang dihentikan akun demo di perangkat ini: tidak ditimpa lagi oleh data server sampai logout
const stopped = new Set<PlusRole>();

export function setPlans(next: Partial<typeof plans>) {
  if (next.parent === null && next.teacher === null) stopped.clear(); // logout
  const kept = Object.fromEntries(Object.entries(next).filter(([role]) => !stopped.has(role as PlusRole)));
  set({ ...plans, ...kept });
}

export function subscribePlus(role: PlusRole, plan: PlusPlan) {
  stopped.delete(role);
  set({ ...plans, [role]: plan });
}

export function cancelPlus(role: PlusRole) {
  stopped.add(role);
  set({ ...plans, [role]: null });
}

// biaya platform shadow teacher: 10% (Gratis) / 5% (Plus)
export function platformFeeRate(plan: PlusPlan | null) {
  return plan ? 0.05 : 0.1;
}
