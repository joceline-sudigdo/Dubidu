import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { api, secureGet, secureRemove, secureSet } from './api';

// Push notification lewat Expo. Syarat: project sudah dihubungkan ke EAS (ada projectId di app.json)
// dan dijalankan di HP sungguhan dari build EAS (bukan Expo Go / simulator).

const PUSH_KEY = 'dubidu.push-token';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Minta izin & kirim Expo push token ke backend. Dipanggil setelah login. */
export async function registerForPush() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // id saluran HARUS sama dengan yang dipakai backend (lib/notify.ts)
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
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const link = response.notification.request.content.data?.link;
    if (typeof link === 'string' && link.startsWith('/')) open(link);
  });
  return () => sub.remove();
}
