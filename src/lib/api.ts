import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Alamat backend DUBIDU. Isi EXPO_PUBLIC_API_URL di file .env (lihat .env.example).
// Di HP fisik saat backend jalan di laptop: http://<IP-laptop>:4000, bukan localhost.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://dubidu-api.vercel.app').replace(/\/$/, '');

const TOKEN_KEY = 'dubidu.token';

// token login disimpan terenkripsi di HP; di web (expo start --web) SecureStore tidak ada → AsyncStorage
const storage = {
  get: (key: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key)),
};

let cachedToken: string | null | undefined;

export async function getToken() {
  if (cachedToken === undefined) cachedToken = await storage.get(TOKEN_KEY).catch(() => null);
  return cachedToken;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await storage.set(TOKEN_KEY, token);
  else await storage.remove(TOKEN_KEY).catch(() => {});
}

export const secureGet = storage.get;
export const secureSet = storage.set;
export const secureRemove = storage.remove;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// dipanggil saat token ditolak server (habis / akun dinonaktifkan) → aplikasi kembali ke login
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      await setToken(null);
      onUnauthorized?.();
    }
    const first = Array.isArray(data?.details) ? (data.details[0] as { field?: string; path?: unknown[]; message?: string }) : undefined;
    const detail = first?.message
      ? translateIssue(first.message, first.field ?? (Array.isArray(first.path) ? first.path.join('.') : ''))
      : undefined;
    throw new ApiError(res.status, detail ?? toIndonesian(data?.error) ?? 'Terjadi kesalahan. Coba lagi.', data?.details);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// semua pesan error yang tampil ke pengguna harus berbahasa Indonesia

// nama field dari server → sebutan yang dimengerti pengguna
const FIELD_LABEL: Record<string, string> = {
  text: 'Tulisan',
  content: 'Isi',
  caption: 'Keterangan',
  body: 'Isi pesan',
  message: 'Pesan',
  email: 'Email',
  password: 'Kata sandi',
  newPassword: 'Kata sandi baru',
  phone: 'Nomor HP',
  name: 'Nama',
  fullName: 'Nama lengkap',
  nickname: 'Nama panggilan',
  birthDate: 'Tanggal lahir',
  amount: 'Jumlah',
  rating: 'Rating',
  comment: 'Komentar',
  reason: 'Alasan',
  code: 'Kode',
};

const labelFor = (field: string) => {
  const key = field.split('.').pop() ?? '';
  return FIELD_LABEL[key] ?? (key ? 'Isian' : 'Data');
};

/** Pesan validasi dari server (zod, bahasa Inggris) → kalimat bahasa Indonesia */
export function translateIssue(message: string, field = ''): string {
  const label = labelFor(field);
  const num = message.match(/(\d+)/)?.[1];
  const m = message.toLowerCase();
  if (m.includes('too small') && m.includes('string')) return `${label} minimal ${num} karakter.`;
  if (m.includes('too big') && m.includes('string')) return `${label} maksimal ${num} karakter.`;
  if (m.includes('too small') && m.includes('array')) return `${label} minimal ${num} item.`;
  if (m.includes('too big') && m.includes('array')) return `${label} maksimal ${num} item.`;
  if (m.includes('too small')) return `${label} minimal ${num}.`;
  if (m.includes('too big')) return `${label} maksimal ${num}.`;
  if (m.includes('email')) return 'Format email tidak valid.';
  if (m.includes('url')) return 'Format tautan tidak valid.';
  if (m.includes('received undefined') || m.includes('required')) return `${label} wajib diisi.`;
  if (m.includes('invalid option') || m.includes('invalid enum')) return `Pilihan ${label.toLowerCase()} tidak valid.`;
  if (m.includes('date')) return 'Format tanggal tidak valid.';
  if (m.includes('invalid')) return `${label} tidak valid.`;
  return toIndonesian(message) ?? `${label} tidak valid.`;
}

// pesan teknis berbahasa Inggris yang sering muncul (jaringan, upload, server)
const ENGLISH_ERRORS: [RegExp, string][] = [
  [/network request failed|failed to fetch|network error|load failed/i, 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.'],
  [/timeout|timed out/i, 'Server terlalu lama merespons. Coba lagi sebentar lagi.'],
  [/file too large|payload too large|request entity too large/i, 'Ukuran file terlalu besar (maks. 4 MB).'],
  [/unexpected field|too many files/i, 'File yang dipilih tidak sesuai. Coba pilih ulang.'],
  [/unauthorized|jwt|token/i, 'Sesi login berakhir. Silakan masuk lagi.'],
  [/forbidden|permission/i, 'Kamu tidak punya akses untuk melakukan ini.'],
  [/not found/i, 'Data tidak ditemukan.'],
  [/internal server error|something went wrong/i, 'Terjadi kesalahan di server. Coba lagi nanti.'],
];

// kata-kata Inggris yang menandakan pesan belum diterjemahkan
const LOOKS_ENGLISH = /\b(the|is|are|expected|invalid|failed|error|cannot|could not|unable|must|should|please|received|unexpected|not)\b/i;

/** Terjemahkan pesan teknis berbahasa Inggris; pesan yang sudah Indonesia dikembalikan apa adanya */
export function toIndonesian(message: unknown): string | undefined {
  if (typeof message !== 'string' || !message.trim()) return undefined;
  for (const [pattern, text] of ENGLISH_ERRORS) if (pattern.test(message)) return text;
  if (LOOKS_ENGLISH.test(message)) return 'Terjadi kesalahan. Coba lagi.';
  return message;
}

/** Pesan error yang aman ditampilkan ke pengguna (selalu bahasa Indonesia) */
export function errorMessage(e: unknown) {
  return (e instanceof Error ? toIndonesian(e.message) : undefined) ?? 'Terjadi kesalahan. Coba lagi.';
}

/**
 * Upload file dari expo-image-picker / document picker → URL file di server.
 * Memakai XMLHttpRequest: fetch bawaan Expo versi baru menolak file berbentuk { uri, name, type }
 * ("Unsupported FormDataPart implementation"), sedangkan XHR React Native menerimanya.
 */
export async function uploadFile(uri: string, folder: string, mimeType = 'image/jpeg') {
  const token = await getToken();
  const form = new FormData();
  const name = uri.split('/').pop()?.split('?')[0] || `${folder}.jpg`;
  if (Platform.OS === 'web') {
    // di web uri berupa blob:/data: → ambil isinya dulu
    form.append('file', await (await fetch(uri)).blob(), name);
  } else {
    form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  }
  const { status, data } = await new Promise<{ status: number; data: { url?: string; error?: string } | null }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/uploads?folder=${encodeURIComponent(folder)}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 60000;
    xhr.onload = () => {
      let parsed = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        // balasan bukan JSON (mis. file terlalu besar ditolak server)
      }
      resolve({ status: xhr.status, data: parsed });
    };
    xhr.onerror = () => reject(new ApiError(0, 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.'));
    xhr.ontimeout = () => reject(new ApiError(0, 'Upload terlalu lama. Coba foto yang lebih kecil.'));
    xhr.send(form);
  });
  if (status < 200 || status >= 300 || !data?.url) {
    throw new ApiError(status, toIndonesian(data?.error) ?? 'Upload gagal, coba file yang lebih kecil (maks. 4 MB).');
  }
  return data.url;
}
