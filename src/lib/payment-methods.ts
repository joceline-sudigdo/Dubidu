import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import type { UserRole } from './auth';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type Method = { id: string; label: string; detail: string; icon: IconName; color: string };
type Saved = { list: Method[]; main: string };

// metode pembayaran (orang tua) & rekening pencairan (teacher/psikolog), disimpan di memori
const saved: Record<UserRole, Saved> = {
  parent: {
    list: [
      { id: 'va-bca', label: 'Virtual Account BCA', detail: 'Otomatis dibuat saat bayar', icon: 'bank', color: '#0060AF' },
      { id: 'gopay', label: 'GoPay', detail: '0812 •••• 0001', icon: 'wallet', color: '#00AED6' },
    ],
    main: 'va-bca',
  },
  teacher: {
    list: [{ id: 'bca', label: 'BCA', detail: '•••• 4821 a.n. pemilik akun', icon: 'bank', color: '#0060AF' }],
    main: 'bca',
  },
  psychologist: {
    list: [{ id: 'mandiri', label: 'Mandiri', detail: '•••• 1190 a.n. pemilik akun', icon: 'bank', color: '#003D79' }],
    main: 'mandiri',
  },
};

export function getMethods(role: UserRole) {
  return saved[role];
}

export function saveMethods(role: UserRole, list: Method[], main: string) {
  saved[role] = { list, main };
}

// rekening/metode utama, misal untuk tujuan pencairan
export function mainMethod(role: UserRole) {
  const s = saved[role];
  return s.list.find((m) => m.id === s.main) ?? s.list[0];
}
