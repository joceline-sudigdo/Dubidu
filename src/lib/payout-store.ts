import { useSyncExternalStore } from 'react';

import { api, errorMessage } from './api';
import { showAlert } from './dialog';
import { addTransaction } from './transactions-store';

// saldo pendapatan teacher & psikolog yang bisa dicairkan (GET /api/payouts/balance)
type Account = { bankName: string; accountNumberMasked: string; accountName: string | null };
type Balance = {
  available: number;
  held: number;
  heldNote: string;
  minPayout: number;
  payoutFee: number;
  account: Account | null;
};

let balance: Balance = { available: 0, held: 0, heldNote: '', minPayout: 50000, payoutFee: 2500, account: null };
const listeners = new Set<() => void>();

function set(next: Balance) {
  balance = next;
  listeners.forEach((l) => l());
}

export function useBalance() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => balance
  );
}

export function getPayoutAccount() {
  return balance.account;
}

export async function loadBalance() {
  set(await api<Balance>('/payouts/balance'));
}

/** Simpan rekening tujuan pencairan di server */
export async function savePayoutAccount(bankName: string, accountNumber: string, accountName: string) {
  const account = await api<Account>('/payouts/account', { method: 'PUT', body: { bankName, accountNumber, accountName } });
  set({ ...balance, account });
  return account;
}

/** Ajukan pencairan; admin mentransfer manual lalu status dikabarkan lewat notifikasi */
export async function withdraw(amount: number, destination: string) {
  try {
    await api('/payouts', { body: { amount } });
    addTransaction({
      title: `Tarik saldo ke ${destination.split(' ')[0]}`,
      subtitle: `Diterima ${(amount - balance.payoutFee).toLocaleString('id-ID')} setelah biaya transfer`,
      amount: -amount,
      method: destination,
    });
    await loadBalance();
    return true;
  } catch (e) {
    showAlert('Pencairan belum diajukan', errorMessage(e));
    return false;
  }
}
