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
    const firstDetail = Array.isArray(data?.details) ? data.details[0]?.message : undefined;
    throw new ApiError(res.status, firstDetail ?? data?.error ?? 'Terjadi kesalahan. Coba lagi.', data?.details);
  }
  return data as T;
}

/** Pesan error yang aman ditampilkan ke pengguna */
export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.';
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
    throw new ApiError(status, data?.error ?? 'Upload gagal, coba file yang lebih kecil (maks. 4 MB).');
  }
  return data.url;
}
