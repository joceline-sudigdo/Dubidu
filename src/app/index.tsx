import { router } from 'expo-router';

import { AnimatedSplash } from '@/components/splash/animated-splash';
import { homeRoute } from '@/lib/auth';
import { hasSeenOnboarding } from '@/lib/onboarding-storage';
import { getSession } from '@/lib/session';

// sesi sudah dipulihkan di _layout: langsung ke beranda, kalau belum login ke onboarding / login
export default function SplashRoute() {
  const handleFinish = async () => {
    const session = getSession();
    if (session.id) router.replace(homeRoute(session.role));
    else router.replace((await hasSeenOnboarding()) ? '/login' : '/onboarding');
  };

  return <AnimatedSplash onFinish={handleFinish} />;
}
