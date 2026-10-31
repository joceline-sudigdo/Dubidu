// ============================================================================
//  Contoh API client untuk frontend Expo (untuk Joce).
//  Salin ke frontend sebagai `src/lib/api.ts`, lalu ganti isi `src/lib/auth.ts`.
//
//  1. Di root frontend buat file `.env`:
//       EXPO_PUBLIC_API_URL=https://dubidu-api.onrender.com
//     (lokal di HP fisik: http://<IP-laptop>:4000, bukan localhost)
//  2. Token disimpan dengan expo-secure-store:  npx expo install expo-secure-store
//  3. Realtime chat (opsional):                  npm i socket.io-client
//  4. Push notification:  npx expo install expo-notifications expo-device expo-constants
//  5. Pembayaran & video call:  npx expo install expo-web-browser
// ============================================================================
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'dubidu:token';

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) await setToken(null); // token habis → paksa login ulang
    throw new ApiError(res.status, data?.error ?? 'Terjadi kesalahan', data?.details);
  }
  return data as T;
}

/** Upload file dari expo-image-picker / document picker. Balikan URL file. */
export async function uploadFile(uri: string, folder: string, mimeType = 'image/jpeg') {
  const token = await getToken();
  const form = new FormData();
  form.append('file', { uri, name: uri.split('/').pop() ?? 'file', type: mimeType } as any);
  const res = await fetch(`${BASE_URL}/api/uploads?folder=${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Upload gagal');
  return data.url as string;
}

// ---------------------------------------------------------------------------
//  Contoh pemakaian
// ---------------------------------------------------------------------------

/** Ganti `login()` di src/lib/auth.ts */
export async function login(contact: string, password: string) {
  const { token, user } = await api('/auth/login', { body: { contact, password } });
  await setToken(token);
  return user as { role: 'PARENT' | 'TEACHER' | 'PSYCHOLOGIST' | 'ADMIN'; fullName: string };
}

/** Dipanggil di child-needs.tsx saat tombol selesai ditekan (pengganti TODO(backend)) */
export async function registerParent(data: {
  account: { fullName: string; contact: string; password: string };
  identity: { ktpUri: string | null; domicile: string };
  child: { name: string; birthDate: string; gender: 'male' | 'female' | null; schoolLevel: 'TK' | 'SD' | 'SMP' | null; domicile: string };
  needs: { conditions: string[]; medicalRecordUri: string | null };
}) {
  const res = await api('/auth/register', {
    body: {
      role: 'PARENT',
      fullName: data.account.fullName,
      contact: data.account.contact,
      password: data.account.password,
      domicile: data.identity.domicile,
      child: {
        name: data.child.name,
        birthDate: data.child.birthDate || undefined, // format "YYYY-MM-DD"
        gender: data.child.gender?.toUpperCase(),
        schoolLevel: data.child.schoolLevel ?? undefined,
        domicile: data.child.domicile,
        conditions: data.needs.conditions,
      },
    },
  });
  await setToken(res.token);

  if (data.identity.ktpUri) {
    const ktpUrl = await uploadFile(data.identity.ktpUri, 'ktp');
    await api('/auth/me', { method: 'PATCH', body: { ktpUrl } });
  }
  if (data.needs.medicalRecordUri) {
    const medicalRecordUrl = await uploadFile(data.needs.medicalRecordUri, 'rekam-medis');
    await api(`/children/${res.children[0].id}`, { method: 'PATCH', body: { medicalRecordUrl } });
  }
  return res;
}

/** Beranda orang tua: satu request untuk seluruh layar */
export const getParentHome = (childId?: string) =>
  api(`/home/parent${childId ? `?childId=${childId}` : ''}`);

/** Tombol "Klaim madu hari ini!" */
export const claimCheckin = (childId: string, mood: string) =>
  api('/checkins', { body: { childId, mood: mood.toUpperCase() } });

/** Tombol "Ya, boleh!" / "Tidak hari ini" */
export const answerQuickQuestion = (id: string, yes: boolean) =>
  api(`/quick-questions/${id}/answer`, { body: { answer: yes ? 'YES' : 'NO' } });

/** Kotak "Yuk tanya pada Doobie!" */
export const askDoobie = (message: string, childId?: string, topic?: string) =>
  api<{ reply: string }>('/doobie/chat', { body: { message, childId, topic } });

// Realtime chat:
// import { io } from 'socket.io-client';
// const socket = io(BASE_URL, { auth: { token: await getToken() } });
// socket.on('message:new', ({ conversationId, message }) => { ... });

// ---------------------------------------------------------------------------
//  Lupa password (email)
// ---------------------------------------------------------------------------

/** Layar "Lupa password": kirim kode 6 digit ke email */
export const requestPasswordReset = (email: string) => api('/auth/forgot-password', { body: { email } });

/** Layar "Masukkan kode": kode + password baru → langsung login */
export async function resetPassword(email: string, code: string, newPassword: string) {
  const res = await api('/auth/reset-password', { body: { email, code, newPassword } });
  await setToken(res.token);
  return res.user;
}

// ---------------------------------------------------------------------------
//  Pembayaran — mode TRANSFER MANUAL (QRIS GoPay / rekening bank)
//  Layar bayar:
//   1. startPayment(payment.id) → tampilkan amountDue (besar & bisa disalin), countdown expiresAt,
//      dan daftar methods (QRIS: tampilkan gambar qrImageUrl; bank: bankName, accountNumber, accountName).
//   2. User pilih metode, transfer, lalu pilih screenshot bukti (expo-image-picker) + isi nama pengirim.
//   3. submitProof(...) → status "VERIFYING" → tampilkan "Menunggu konfirmasi admin".
//   4. Status jadi "PAID" lewat notifikasi push / GET /payments/:id.
// ---------------------------------------------------------------------------

/** Ambil instruksi bayar. Kalau server memakai mode lain, otomatis diteruskan. */
export async function startPayment(paymentId: string) {
  const checkout = await api(`/payments/${paymentId}/checkout`, { body: {} });
  if (checkout.mode === 'midtrans') return payWithMidtrans(paymentId);
  if (checkout.mode === 'mock') return api(`/payments/${paymentId}/pay`, { body: {} });
  return checkout as {
    mode: 'manual';
    amountDue: number;
    uniqueCode: number;
    expiresAt: string;
    steps: string[];
    methods: { id: string; type: 'QRIS' | 'BANK_TRANSFER'; label: string; bankName?: string; accountNumber?: string; accountName: string; qrImageUrl?: string; instructions?: string }[];
  };
}

/** Kirim bukti transfer (imageUri dari expo-image-picker) */
export async function submitProof(paymentId: string, methodId: string, imageUri: string, senderName: string, note?: string) {
  const proofUrl = await uploadFile(imageUri, 'bukti-bayar');
  return api(`/payments/${paymentId}/proof`, { body: { methodId, proofUrl, senderName, note } });
}

// ---------------------------------------------------------------------------
//  Pembayaran Midtrans (opsional, kalau nanti PAYMENT_MODE=midtrans)
// ---------------------------------------------------------------------------

/**
 * Panggil setelah membuat konsultasi / langganan (respons berisi `payment.id`).
 * Membuka halaman bayar Midtrans (QRIS, VA bank, GoPay, kartu, dll.), lalu
 * mengecek status saat user kembali ke aplikasi. Balikan: status pembayaran terbaru.
 */
export async function payWithMidtrans(paymentId: string) {
  const checkout = await api(`/payments/${paymentId}/checkout`, { body: {} });
  if (checkout.mode !== 'midtrans') {
    return api(`/payments/${paymentId}/pay`, { body: {} }); // server belum diisi kunci Midtrans
  }
  // halaman otomatis tertutup saat Midtrans mengarahkan ke dubidu://pembayaran
  await WebBrowser.openAuthSessionAsync(checkout.redirectUrl, 'dubidu://pembayaran');
  return api(`/payments/${paymentId}/refresh`, { body: {} }); // { status: 'PAID' | 'PENDING' | ... }
}

// ---------------------------------------------------------------------------
//  Video / voice call konsultasi psikolog
// ---------------------------------------------------------------------------

/** Tombol "Masuk Ruang Konsultasi" — bisa ditekan mulai 15 menit sebelum jadwal */
export async function joinConsultation(consultationId: string) {
  const { url } = await api(`/consultations/${consultationId}/join`);
  await WebBrowser.openBrowserAsync(url); // izinkan kamera & mikrofon saat diminta
}

// ---------------------------------------------------------------------------
//  Push notification (Expo)
//  Syarat: project sudah dihubungkan ke EAS (`npx eas-cli@latest init`) supaya ada projectId,
//  dan dijalankan di HP sungguhan (bukan simulator). Android build butuh kredensial FCM (lihat panduan).
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Panggil sekali setelah login berhasil (mis. di layout tabs). */
export async function registerForPush() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // id saluran HARUS sama dengan yang dipakai backend (chat, booking, laporan, default)
    await Notifications.setNotificationChannelAsync('default', { name: 'Umum', importance: Notifications.AndroidImportance.DEFAULT });
    await Notifications.setNotificationChannelAsync('chat', { name: 'Chat', importance: Notifications.AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync('booking', { name: 'Jadwal & Pembayaran', importance: Notifications.AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync('laporan', { name: 'Report Card', importance: Notifications.AndroidImportance.DEFAULT });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/auth/devices', { body: { token, platform: Platform.OS } });
  await SecureStore.setItemAsync('dubidu:push-token', token);
  return token;
}

/** Saat notifikasi ditekan → buka layar sesuai `data.link` (contoh "/chat/abc") */
export function listenNotificationTaps(navigate: (link: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = response.notification.request.content.data?.link as string | undefined;
    if (link) navigate(link);
  });
  return () => sub.remove();
}

/** Logout: hentikan notifikasi akun ini di HP ini, lalu hapus token login */
export async function logout() {
  const pushToken = await SecureStore.getItemAsync('dubidu:push-token');
  if (pushToken) await api('/auth/devices', { method: 'DELETE', body: { token: pushToken } }).catch(() => {});
  await setToken(null);
}
