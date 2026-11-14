import { router } from 'expo-router';

import { toIsoDate } from '@/components/ui/date-field';
import type { ParentRegistration } from '@/context/parent-registration';
import accounts from '@/data/dummy-accounts.json';

import { api, ApiError, setToken, uploadFile } from './api';
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
    retry: true, // login aman dikirim ulang bila koneksi sempat putus
  });
  return startSession(token, user);
}

/**
 * Kirim pendaftaran, aman bila koneksi putus di tengah jalan. Bila server menjawab "sudah terdaftar"
 * karena percobaan sebelumnya sebenarnya sudah masuk (koneksi putus saat menunggu jawaban, atau
 * upload dokumen sesudahnya gagal lalu pengguna menekan kirim lagi), akun itu dipakai dengan login
 * memakai kata sandi yang sama. Hanya pemilik akun yang tahu kata sandinya, jadi email/HP milik
 * orang lain tetap ditolak seperti biasa.
 */
async function sendRegistration<T extends { token: string; user: BackendUser }>(
  body: { contact: string; password: string } & Record<string, unknown>,
): Promise<T> {
  try {
    return await api<T>('/auth/register', { body, retry: true });
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 409) throw e;
    try {
      return (await api<T>('/auth/login', { body: { contact: body.contact, password: body.password }, retry: true })) as T;
    } catch {
      throw e; // memang email/HP orang lain
    }
  }
}

/** Langkah terakhir pendaftaran orang tua (layar child-needs). */
export async function registerParent(data: ParentRegistration) {
  const res = await sendRegistration<{ token: string; user: BackendUser; children?: { id: string }[] }>({
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
  });
  await setToken(res.token);
  // file diunggah setelah akun jadi (butuh token)
  if (data.identity.ktpUri) {
    const ktpUrl = await uploadFile(data.identity.ktpUri, 'ktp');
    await api('/auth/me', { method: 'PATCH', body: { ktpUrl } });
  }
  // jawaban login (pendaftaran yang ternyata sudah masuk) tidak membawa daftar anak → ambil dari server
  const childId = res.children?.[0]?.id ?? (await api<{ id: string }[]>('/children').catch(() => []))[0]?.id;
  if (data.needs.medicalRecordUri && childId) {
    // rekam medis selalu dokumen PDF
    const medicalRecordUrl = await uploadFile(data.needs.medicalRecordUri, 'rekam-medis', 'application/pdf');
    await api(`/children/${childId}`, { method: 'PATCH', body: { medicalRecordUrl } });
  }
  return startSession(res.token, res.user);
}

// pilihan "Pengalaman" di layar pendaftaran → tahun pengalaman (batas bawah)
const EXPERIENCE_YEARS: Record<string, number> = { '< 1 tahun': 0, '1-3 tahun': 1, '3-5 tahun': 3, '> 5 tahun': 5 };

/** Langkah terakhir pendaftaran shadow teacher (layar persetujuan). Akun langsung bisa login, menunggu verifikasi. */
export async function registerTeacher({ account, identity, teacher }: ParentRegistration) {
  const res = await sendRegistration<{ token: string; user: BackendUser }>({
    role: 'TEACHER',
    fullName: account.fullName,
    contact: account.contact,
    password: account.password,
    domicile: identity.domicile || undefined,
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
  // ijazah, sertifikat & CV selalu dokumen PDF; KTP foto
  const docs: [string | null, string, string, boolean][] = [
    [identity.ktpUri, 'KTP', 'ktp', false],
    [teacher.ijazahUri, 'IJAZAH', 'ijazah', true],
    [teacher.certificateUri, 'SERTIFIKAT', 'sertifikat', true],
    [teacher.cvUri, 'CV', 'cv', true],
  ];
  for (const [uri, type, folder, pdf] of docs) {
    if (!uri) continue;
    const url = await uploadFile(uri, folder, pdf || uri.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
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
