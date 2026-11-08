import { router } from 'expo-router';

import { toIsoDate } from '@/components/ui/date-field';
import type { ParentRegistration } from '@/context/parent-registration';
import accounts from '@/data/dummy-accounts.json';

import { api, setToken, uploadFile } from './api';
import { registerForPush, unregisterPush } from './push';
import { clearSession, setSession, type Session } from './session';
import { loadAppData, resetAppData } from './sync';

export type UserRole = 'parent' | 'teacher' | 'psychologist';

export type Account = {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
};

// akun demo (data contoh di server) untuk mencoba aplikasi tanpa mendaftar
export function demoAccounts() {
  return accounts as Account[];
}

type BackendUser = {
  id: string;
  role: 'PARENT' | 'TEACHER' | 'PSYCHOLOGIST' | 'ADMIN';
  fullName: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  domicile: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
};

const ROLE: Record<Exclude<BackendUser['role'], 'ADMIN'>, UserRole> = {
  PARENT: 'parent',
  TEACHER: 'teacher',
  PSYCHOLOGIST: 'psychologist',
};

export function toSession(user: BackendUser): Session {
  if (user.role === 'ADMIN') throw new Error('Akun admin hanya bisa dipakai di web admin.');
  return {
    id: user.id,
    role: ROLE[user.role],
    name: user.fullName,
    nickname: user.nickname ?? user.fullName.split(' ')[0],
    email: user.email,
    phone: user.phone,
    domicile: user.domicile,
    avatarUrl: user.avatarUrl,
    isDemo: user.isDemo,
  };
}

export function homeRoute(role: UserRole) {
  if (role === 'teacher') return '/teacher/beranda' as const;
  if (role === 'psychologist') return '/psikolog/beranda' as const;
  return '/beranda' as const;
}

/** Simpan token & sesi, muat data awal dari server, lalu daftarkan HP untuk push notification. */
async function startSession(token: string, user: BackendUser) {
  const session = toSession(user);
  await setToken(token);
  setSession(session);
  await loadAppData(session.role);
  registerForPush().catch(() => {}); // izin notifikasi ditolak / simulator → aplikasi tetap jalan
  return session;
}

/** Login dengan email atau nomor HP. Error berisi pesan yang siap ditampilkan. */
export async function login(contact: string, password: string) {
  const { token, user } = await api<{ token: string; user: BackendUser }>('/auth/login', {
    body: { contact: contact.trim(), password },
  });
  return startSession(token, user);
}

/** Langkah terakhir pendaftaran orang tua (layar child-needs). */
export async function registerParent(data: ParentRegistration) {
  const res = await api<{ token: string; user: BackendUser; children: { id: string }[] }>('/auth/register', {
    body: {
      role: 'PARENT',
      fullName: data.account.fullName,
      contact: data.account.contact,
      password: data.account.password,
      domicile: data.identity.domicile || undefined,
      child: {
        name: data.child.name.split(' ')[0],
        fullName: data.child.name,
        birthDate: toIsoDate(data.child.birthDate),
        gender: data.child.gender ? data.child.gender.toUpperCase() : undefined,
        schoolLevel: data.child.schoolLevel ?? undefined,
        domicile: data.child.domicile || data.identity.domicile || undefined,
        conditions: data.needs.conditions,
      },
    },
  });
  await setToken(res.token);
  // file diunggah setelah akun jadi (butuh token)
  if (data.identity.ktpUri) {
    const ktpUrl = await uploadFile(data.identity.ktpUri, 'ktp');
    await api('/auth/me', { method: 'PATCH', body: { ktpUrl } });
  }
  if (data.needs.medicalRecordUri && res.children[0]) {
    const medicalRecordUrl = await uploadFile(data.needs.medicalRecordUri, 'rekam-medis');
    await api(`/children/${res.children[0].id}`, { method: 'PATCH', body: { medicalRecordUrl } });
  }
  return startSession(res.token, res.user);
}

// pilihan "Pengalaman" di layar pendaftaran → tahun pengalaman (batas bawah)
const EXPERIENCE_YEARS: Record<string, number> = { '< 1 tahun': 0, '1-3 tahun': 1, '3-5 tahun': 3, '> 5 tahun': 5 };

/** Langkah terakhir pendaftaran shadow teacher (layar persetujuan). Akun langsung bisa login, menunggu verifikasi. */
export async function registerTeacher({ account, identity, teacher }: ParentRegistration) {
  const res = await api<{ token: string; user: BackendUser }>('/auth/register', {
    body: {
      role: 'TEACHER',
      fullName: account.fullName,
      contact: account.contact,
      password: account.password,
      domicile: identity.domicile || undefined,
    },
  });
  await setToken(res.token);
  const years = EXPERIENCE_YEARS[teacher.experience ?? ''] ?? 0;
  await api('/teachers/me', {
    method: 'PATCH',
    body: {
      education: [teacher.education, teacher.major, teacher.institution].filter(Boolean).join(' · ') || undefined,
      experienceYears: years,
      about: teacher.bio || undefined,
      specializations: teacher.specializations,
    },
  });
  const docs: [string | null, string, string][] = [
    [identity.ktpUri, 'KTP', 'ktp'],
    [teacher.ijazahUri, 'IJAZAH', 'ijazah'],
    [teacher.certificateUri, 'SERTIFIKAT', 'sertifikat'],
    [teacher.cvUri, 'CV', 'cv'],
  ];
  for (const [uri, type, folder] of docs) {
    if (!uri) continue;
    const url = await uploadFile(uri, folder, uri.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    await api('/teachers/me/documents', { body: { type, url } });
  }
  // pendaftaran selesai → kembali ke login (akun aktif penuh setelah diverifikasi admin)
  await setToken(null);
  return res.user;
}

/** Lupa kata sandi: kirim kode 6 digit ke email */
export function requestPasswordReset(email: string) {
  return api<{ ok: true; message: string }>('/auth/forgot-password', { body: { email: email.trim() } });
}

/** Kode + kata sandi baru → langsung masuk */
export async function resetPassword(email: string, code: string, newPassword: string) {
  const res = await api<{ token: string; user: BackendUser }>('/auth/reset-password', {
    body: { email: email.trim(), code, newPassword },
  });
  return startSession(res.token, res.user);
}

/** Keluar: HP berhenti menerima notifikasi akun ini, token & data di memori dihapus */
export async function logout() {
  await unregisterPush().catch(() => {});
  await setToken(null);
  clearSession();
  resetAppData();
  router.dismissAll();
  router.replace('/login');
}
