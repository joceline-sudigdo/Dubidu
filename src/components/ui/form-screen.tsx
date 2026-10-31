import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { StepProgress } from '@/components/ui/step-progress';
import { Colors, MaxContentWidth } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  step?: { current: number; total: number };
  showBack?: boolean;
  children: ReactNode;
};

export function FormScreen({ title, subtitle, step, showBack = true, children }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 203, 76, 0.16)', 'rgba(255, 203, 76, 0)']}
        start={{ x: 1, y: 0.2 }}
        end={{ x: 0.4, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(61, 122, 189, 0)', 'rgba(61, 122, 189, 0.12)']}
        start={{ x: 0.6, y: 0.55 }}
        end={{ x: 0, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Android edge-to-edge nggak auto resize, jadi pakai padding di semua platform */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
            {showBack && <BackButton />}
            {step && (
              <View style={styles.progress}>
                <StepProgress current={step.current} total={step.total} />
              </View>
            )}
            <View style={styles.header}>
              <AppText variant="title">{title}</AppText>
              {subtitle && <AppText variant="subtitle">{subtitle}</AppText>}
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  progress: {
    marginTop: 14,
  },
  header: {
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
});
