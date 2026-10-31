import { useSyncExternalStore } from 'react';

import { getSession } from './session';
import { addTransaction } from './transactions-store';

// saldo pendapatan teacher & psikolog yang bisa dicairkan (memori, nanti dari backend)
type Balance = { available: number; held: number; heldNote: string };

let balances: Record<'teacher' | 'psychologist', Balance> = {
  teacher: { available: 1200000, held: 1620000, heldNote: 'Termin 3 cair setelah laporan akhir dikirim' },
  psychologist: { available: 3600000, held: 504000, heldNote: '2 sesi menunggu konfirmasi selesai dari orang tua' },
};
const listeners = new Set<() => void>();

const roleKey = () => (getSession().role === 'psychologist' ? 'psychologist' : 'teacher');

export const MIN_PAYOUT = 50000;
export const PAYOUT_FEE = 2500;

export function useBalance() {
  const all = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => balances
  );
  return all[roleKey()];
}

export function withdraw(amount: number, destination: string) {
  const key = roleKey();
  const b = balances[key];
  if (amount < MIN_PAYOUT || amount > b.available) return false;
  balances = { ...balances, [key]: { ...b, available: b.available - amount } };
  listeners.forEach((l) => l());
  addTransaction({
    title: `Tarik saldo ke ${destination.split(' ')[0]}`,
    subtitle: `Diterima ${(amount - PAYOUT_FEE).toLocaleString('id-ID')} setelah biaya transfer`,
    amount: -amount,
    method: destination,
  });
  return true;
}
