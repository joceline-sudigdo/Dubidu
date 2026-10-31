import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/theme';

// sementara, nanti diganti home per role
export default function HomeScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <AppText variant="title" style={styles.center}>
          Halo{name ? `, ${name}` : ''}! 👋
        </AppText>
        <AppText variant="subtitle" style={styles.center}>
          Halaman beranda sedang disiapkan.
        </AppText>
      </View>
      <PrimaryButton title="Keluar" onPress={() => router.replace('/login')} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    marginBottom: 8,
  },
});
