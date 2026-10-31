import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

export function Segmented({
  labels,
  value,
  onChange,
}: {
  labels: [string, string];
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  const [width, setWidth] = useState(0);
  const pos = useSharedValue(value);

  useEffect(() => {
    pos.value = withTiming(value, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [value, pos]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * ((width - 8) / 2) }],
  }));

  return (
    <View style={[styles.segment, Shadow.soft]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View style={[styles.thumb, Shadow.button, { width: (width - 8) / 2 }, thumbStyle]} />
      )}
      {labels.map((label, i) => (
        <Pressable
          key={label}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === i }}
          onPress={() => onChange(i as 0 | 1)}
          style={styles.segmentItem}>
          <AppText numberOfLines={1} style={[styles.segmentText, value === i && styles.segmentTextActive]}>
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.pill,
    padding: 4,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  segmentItem: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  segmentTextActive: {
    fontFamily: Fonts.bodyBold,
    color: '#FFFFFF',
  },
});
