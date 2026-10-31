import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

export function StepProgress({ total, current }: { total: number; current: number }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.bar, i < current && styles.barActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  bar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blueSoft,
  },
  barActive: {
    backgroundColor: Colors.primary,
  },
});
