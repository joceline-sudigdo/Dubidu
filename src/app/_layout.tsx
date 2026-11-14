import { FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { Lato_300Light, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { DialogHost } from '@/components/ui/dialog-host';
import { FishCelebrationHost } from '@/components/ui/fish-celebration';
import { ImageViewerHost } from '@/components/ui/image-viewer';
import { Colors } from '@/constants/theme';
import { ParentRegistrationProvider } from '@/context/parent-registration';
import { getToken, setUnauthorizedHandler } from '@/lib/api';
import { listenNotificationTaps } from '@/lib/push';
import { clearSession, getSession, restoreSession } from '@/lib/session';
import { appLink, loadAppData, resetAppData } from '@/lib/sync';

SplashScreen.preventAutoHideAsync();

// sesi tersimpan + token masih berlaku → muat data akun sebelum layar apa pun tampil
// (termasuk saat aplikasi dibuka langsung ke layar tertentu dari notifikasi)
async function resumeSession() {
  const [session, token] = await Promise.all([restoreSession(), getToken()]);
  if (!session || !token) return;
  try {
    await loadAppData(session.role);
  } catch {
    clearSession(); // token kedaluwarsa / akun dinonaktifkan / offline → minta login ulang
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    FredokaOne_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
  });

  const [restored, setRestored] = useState(false);

  useEffect(() => {
    resumeSession().finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && restored) SplashScreen.hideAsync();
  }, [loaded, error, restored]);

  useEffect(() => {
    // token ditolak server (habis / akun dinonaktifkan admin) → kembali ke login
    setUnauthorizedHandler(() => {
      clearSession();
      resetAppData();
      router.replace('/login');
    });
    // notifikasi push ditekan → buka layar terkait
    const stop = listenNotificationTaps((link) => {
      if (getSession().id) router.push(appLink(link, getSession().role) as never);
    });
    return () => {
      setUnauthorizedHandler(null);
      stop();
    };
  }, []);

  if ((!loaded && !error) || !restored) return null;

  return (
    <ParentRegistrationProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="teacher/(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="psikolog/(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="psikolog/panggilan/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
      <DialogHost />
      <FishCelebrationHost />
      <ImageViewerHost />
    </ParentRegistrationProvider>
  );
}
