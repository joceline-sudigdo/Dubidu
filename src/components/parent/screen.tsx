import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth } from '@/constants/theme';

type Props = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
};

// kerangka halaman parent: background putih + gelembung biru lembut
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: Props) {
  return (
    <View style={styles.root}>
      <Blobs />
      <SafeAreaView style={styles.flex} edges={edges}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {header && <View style={styles.header}>{header}</View>}
          {scroll ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.content, contentStyle]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.flex, contentStyle]}>{children}</View>
          )}
          {footer}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Blobs() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, { top: -60, right: -70, width: 220, height: 220 }]} />
      <View style={[styles.blob, { top: 420, left: -120, width: 240, height: 240, opacity: 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.blueSoft,
    opacity: 0.7,
  },
});
