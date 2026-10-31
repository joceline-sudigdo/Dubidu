import { router } from 'expo-router';

import { AnimatedSplash } from '@/components/splash/animated-splash';
import { hasSeenOnboarding } from '@/lib/onboarding-storage';

export default function SplashRoute() {
  const handleFinish = async () => {
    router.replace((await hasSeenOnboarding()) ? '/login' : '/onboarding');
  };

  return <AnimatedSplash onFinish={handleFinish} />;
}
