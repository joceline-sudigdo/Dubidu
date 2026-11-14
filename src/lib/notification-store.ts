import { useSyncExternalStore } from 'react';

import { api } from './api';

// daftar id notifikasi yang belum dibaca (semua role), dipakai titik merah di ikon lonceng
let unread = new Set<string>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Dipanggil saat sinkronisasi data akun: isi ulang notifikasi yang belum dibaca */
export function setUnreadNotifications(ids: string[]) {
  unread = new Set(ids);
  emit();
}

export function isNotificationUnread(id: string) {
  return unread.has(id);
}

/** Tandai satu notifikasi sudah dibaca (lokal + server) */
export function markNotificationRead(id: string) {
  if (!unread.has(id)) return;
  unread = new Set([...unread].filter((x) => x !== id));
  emit();
  api(`/notifications/${id}/read`, { body: {} }).catch(() => {});
}

/** Tandai semua notifikasi sudah dibaca (lokal + server) */
export function markAllNotificationsRead() {
  if (unread.size === 0) return;
  unread = new Set();
  emit();
  api('/notifications/read-all', { body: {} }).catch(() => {});
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Jumlah notifikasi belum dibaca; komponen tampil ulang saat berubah */
export function useUnreadCount() {
  return useSyncExternalStore(subscribe, () => unread.size, () => unread.size);
}

/** Set id yang belum dibaca; berubah referensi setiap ada perubahan */
export function useUnreadIds() {
  return useSyncExternalStore(subscribe, () => unread, () => unread);
}
