import { router } from 'expo-router';

import { showAlert } from './dialog';
import { getPlan } from './membership-store';

// tambah anak khusus Plus: kalau sudah Plus langsung ke form data anak (mode tambah)
export function startAddChild() {
  if (!getPlan('parent')) {
    showAlert(
      'Khusus Dubidu Plus',
      'Kelola lebih dari satu anak, lengkap dengan profil kebutuhan dan report card masing-masing, dengan Dubidu Plus.',
      [
        { text: 'Nanti saja', style: 'cancel' },
        { text: 'Lihat Plus', onPress: () => router.push('/plus') },
      ]
    );
    return;
  }
  router.push({ pathname: '/parent/child-data', params: { mode: 'add' } });
}
