import { useSyncExternalStore } from 'react';

import type { PlusPlan, PlusRole } from '@/data/plus';

import type { UserRole } from './auth';
import { getSession } from './session';

// status langganan Dubidu Plus per role (disimpan di memori, nanti dari backend)
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

export function subscribePlus(role: PlusRole, plan: PlusPlan) {
  set({ ...plans, [role]: plan });
}

export function cancelPlus(role: PlusRole) {
  set({ ...plans, [role]: null });
}

// biaya platform shadow teacher: 10% (Gratis) / 5% (Plus)
export function platformFeeRate(plan: PlusPlan | null) {
  return plan ? 0.05 : 0.1;
}
