import type { UserRole } from './auth';

// user yang sedang login, diisi saat login (belum disimpan permanen)
let current: { role: UserRole; name: string } = { role: 'parent', name: 'Devi Anggraini' };

export function setSession(session: { role: UserRole; name: string }) {
  current = session;
}

export function getSession() {
  return current;
}
