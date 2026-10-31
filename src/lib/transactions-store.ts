import { useSyncExternalStore } from 'react';

import type { UserRole } from './auth';
import { getSession } from './session';

// riwayat transaksi per role (memori), checkout menambah transaksi baru
export type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  // positif = dana masuk, negatif = pembayaran keluar
  amount: number;
  method: string;
  date: string;
  status: 'Berhasil' | 'Diproses';
};

let data: Record<UserRole, Transaction[]> = {
  parent: [
    { id: 'tx1', title: 'Kontrak Nielsen Dave', subtitle: 'Termin 2 · Pendampingan Elisya', amount: -1800000, method: 'VA BCA', date: '15 Okt 2026', status: 'Berhasil' },
    { id: 'tx2', title: 'Konsultasi Psikolog', subtitle: 'Amanda Putri, M.Psi · Video call', amount: -280000, method: 'QRIS', date: '2 Okt 2026', status: 'Berhasil' },
    { id: 'tx3', title: 'Refund sesi batal', subtitle: 'Sesi 28 Sep dibatalkan teacher', amount: 150000, method: 'Saldo Dubidu', date: '29 Sep 2026', status: 'Berhasil' },
    { id: 'tx4', title: 'Kontrak Nielsen Dave', subtitle: 'Termin 1 · Pendampingan Elisya', amount: -1800000, method: 'VA BCA', date: '15 Sep 2026', status: 'Berhasil' },
  ],
  teacher: [
    { id: 'tt1', title: 'Pencairan Termin 2', subtitle: 'Pendampingan Elisya · Sarah Wijaya', amount: 1620000, method: 'BCA •••• 4821', date: '16 Okt 2026', status: 'Berhasil' },
    { id: 'tt2', title: 'Pencairan Termin 1', subtitle: 'Pendampingan Bella · Rini Hartati', amount: 1440000, method: 'BCA •••• 4821', date: '1 Okt 2026', status: 'Berhasil' },
    { id: 'tt3', title: 'Pencairan Termin 1', subtitle: 'Pendampingan Elisya · Sarah Wijaya', amount: 1620000, method: 'BCA •••• 4821', date: '16 Sep 2026', status: 'Berhasil' },
    { id: 'tt4', title: 'Termin 3 (ditahan)', subtitle: 'Menunggu laporan akhir', amount: 1620000, method: 'BCA •••• 4821', date: '15 Nov 2026', status: 'Diproses' },
  ],
  psychologist: [
    { id: 'tp1', title: 'Honor konsultasi', subtitle: '3 sesi · minggu ke-3 Oktober', amount: 756000, method: 'Mandiri •••• 1190', date: '20 Okt 2026', status: 'Berhasil' },
    { id: 'tp2', title: 'Honor konsultasi', subtitle: '5 sesi · minggu ke-2 Oktober', amount: 1260000, method: 'Mandiri •••• 1190', date: '13 Okt 2026', status: 'Berhasil' },
    { id: 'tp3', title: 'Honor konsultasi', subtitle: '2 sesi · minggu ke-1 Oktober', amount: 504000, method: 'Mandiri •••• 1190', date: '6 Okt 2026', status: 'Berhasil' },
  ],
};
const listeners = new Set<() => void>();

export function useTransactions() {
  const all = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => data
  );
  return all[getSession().role];
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'date' | 'status'>) {
  const role = getSession().role;
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  data = { ...data, [role]: [{ ...tx, id: `tx-${Date.now()}`, date, status: 'Berhasil' as const }, ...data[role]] };
  listeners.forEach((l) => l());
}
