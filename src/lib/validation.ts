import { api } from './api';

// validasi form pendaftaran per langkah: pesan muncul saat menekan Next, bukan di langkah terakhir

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pesan error untuk kolom "Email atau nomor HP", atau undefined kalau formatnya benar */
export function contactError(value: string) {
  const v = value.trim();
  if (!v) return 'Email atau nomor HP wajib diisi.';
  if (v.includes('@')) return EMAIL.test(v) ? undefined : 'Format email belum benar, contoh: nama@email.com.';
  const digits = v.replace(/[^\d]/g, '');
  if (/[^\d+\s-]/.test(v)) return 'Nomor HP hanya boleh berisi angka.';
  if (digits.length < 9 || digits.length > 15) return 'Nomor HP harus 9–15 digit, contoh: 081234567890.';
  return undefined;
}

export function requiredError(value: string, label: string, min = 1) {
  const v = value.trim();
  if (!v) return `${label} wajib diisi.`;
  if (v.length < min) return `${label} minimal ${min} karakter.`;
  return undefined;
}

/**
 * Cek ke server apakah email/HP sudah terdaftar.
 * Kalau server tidak bisa dihubungi, pendaftaran tetap boleh lanjut (dicek ulang saat dikirim).
 */
export async function contactTakenError(contact: string) {
  try {
    const res = await api<{ available: boolean; message?: string }>('/auth/check-contact', { body: { contact: contact.trim() } });
    return res.available ? undefined : (res.message ?? 'Email / nomor HP sudah terdaftar, silakan login.');
  } catch {
    return undefined;
  }
}

/** true kalau objek error tidak berisi pesan apa pun */
export const noErrors = (errors: Record<string, string | undefined>) => Object.values(errors).every((e) => !e);
