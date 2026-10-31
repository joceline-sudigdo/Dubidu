import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

type Props = {
  title: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  options: string[];
  selected: string[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleOption: (option: string) => void;
};

export function NeedCategory({
  title,
  icon,
  color,
  options,
  selected,
  expanded,
  onToggleExpanded,
  onToggleOption,
}: Props) {
  const count = options.filter((o) => selected.includes(o)).length;

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={[styles.card, Shadow.soft]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggleExpanded}
        style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
        </View>
        <AppText style={styles.title}>{title}</AppText>
        {count > 0 && (
          <View style={styles.count}>
            <AppText style={styles.countText}>{count}</AppText>
          </View>
        )}
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.text} />
      </Pressable>

      {expanded && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.options}>
          {options.map((option) => (
            <ChoiceChip
              key={option}
              size="tag"
              label={option}
              selected={selected.includes(option)}
              onPress={() => onToggleOption(option)}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.text,
  },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.primary,
  },
  options: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
});
