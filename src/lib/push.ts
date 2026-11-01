import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { api, secureGet, secureRemove, secureSet } from './api';

// Push notification lewat Expo. Syarat: project sudah dihubungkan ke EAS (ada projectId di app.json)
// dan dijalankan di HP sungguhan dari build EAS (bukan Expo Go / simulator).

const PUSH_KEY = 'dubidu.push-token';

// Expo Go (terutama Android) tidak mendukung push dan modul nativenya tidak lengkap,
// jadi expo-notifications baru dimuat saat dibutuhkan dan hanya di luar Expo Go.
const pushSupported = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');
let notifications: NotificationsModule | null = null;

function loadNotifications() {
  if (!pushSupported) return null;
  if (!notifications) {
    // require (bukan import di atas) supaya modul ini tidak dimuat sama sekali di Expo Go
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require('expo-notifications') as NotificationsModule;
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
  return notifications;
}

/** Minta izin & kirim Expo push token ke backend. Dipanggil setelah login. */
export async function registerForPush() {
  const Notifications = loadNotifications();
  if (!Notifications || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // id saluran HARUS sama dengan yang dipakai backend (lib/notify.ts)
    const { AndroidImportance } = Notifications;
    await Notifications.setNotificationChannelAsync('default', { name: 'Umum', importance: AndroidImportance.DEFAULT });
    await Notifications.setNotificationChannelAsync('chat', { name: 'Chat', importance: AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync('booking', { name: 'Jadwal & Pembayaran', importance: AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync('laporan', { name: 'Report Card', importance: AndroidImportance.DEFAULT });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null; // belum `eas init`
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/auth/devices', { body: { token, platform: Platform.OS } });
  await secureSet(PUSH_KEY, token);
  return token;
}

/** Saat logout: HP ini berhenti menerima notifikasi akun tersebut */
export async function unregisterPush() {
  const token = await secureGet(PUSH_KEY);
  if (!token) return;
  await api('/auth/devices', { method: 'DELETE', body: { token } }).catch(() => {});
  await secureRemove(PUSH_KEY);
}

/** Notifikasi ditekan → buka layar sesuai `data.link` dari backend (contoh "/chat/abc") */
export function listenNotificationTaps(open: (link: string) => void) {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = response.notification.request.content.data?.link;
    if (typeof link === 'string' && link.startsWith('/')) open(link);
  });
  return () => sub.remove();
}
