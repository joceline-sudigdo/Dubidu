import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline'}
          size={size}
          color={value >= i - 0.5 ? Colors.yellow : Colors.disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 1,
  },
});

export function StarInput({
  value,
  onChange,
  size = 26,
  color = Colors.yellow,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  color?: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: value }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} hitSlop={4} accessibilityLabel={`${i} bintang`} onPress={() => onChange(i)}>
          <MaterialCommunityIcons
            name={value >= i ? 'star' : 'star-outline'}
            size={size}
            color={value >= i ? color : Colors.disabled}
          />
        </Pressable>
      ))}
    </View>
  );
}
