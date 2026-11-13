import { useSyncExternalStore } from 'react';

import { api } from './api';

// riwayat transaksi akun yang login (GET /payments/history): pembayaran, pendapatan, dan tarik saldo
export type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  // positif = dana masuk, negatif = pembayaran / tarik saldo
  amount: number;
  method: string;
  date: string;
  status: 'Berhasil' | 'Diproses';
};

let data: Transaction[] = [];
const listeners = new Set<() => void>();

function set(next: Transaction[]) {
  data = next;
  listeners.forEach((l) => l());
}

export function useTransactions() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => data
  );
}

export async function loadTransactions() {
  set(await api<Transaction[]>('/payments/history'));
}

/** Tampil langsung di daftar sebelum dimuat ulang dari server (mis. setelah mengajukan pencairan) */
export function addTransaction(tx: Omit<Transaction, 'id' | 'date' | 'status'>) {
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  set([{ ...tx, id: `tx-${Date.now()}`, date, status: 'Diproses' }, ...data]);
}

export function resetTransactions() {
  set([]);
}
