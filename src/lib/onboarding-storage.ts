import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dubidu:onboarding-seen';

export async function hasSeenOnboarding() {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen() {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // gagal simpan nggak apa-apa, onboarding cuma muncul lagi
  }
}
