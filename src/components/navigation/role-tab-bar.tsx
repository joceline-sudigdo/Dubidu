import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Shadow } from '@/constants/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// tab pakai ikon gambar; tab yang belum punya gambar pakai ikon vektor
type TabConfig =
  | { label: string; icon: number; activeIcon: number }
  | { label: string; vector: IconName; activeVector: IconName };

const TABS: Record<string, TabConfig> = {
  beranda: {
    label: 'Beranda',
    icon: require('@/assets/images/icons/home.png'),
    activeIcon: require('@/assets/images/icons/home-active.png'),
  },
  chat: {
    label: 'Chat',
    icon: require('@/assets/images/icons/chat.png'),
    activeIcon: require('@/assets/images/icons/chat-active.png'),
  },
  jadwal: {
    label: 'Jadwal',
    icon: require('@/assets/images/icons/jadwal.png'),
    activeIcon: require('@/assets/images/icons/jadwal-active.png'),
  },
  riwayat: {
    label: 'Riwayat',
    icon: require('@/assets/images/icons/riwayat.png'),
    activeIcon: require('@/assets/images/icons/riwayat-active.png'),
  },
  verifikasi: {
    label: 'Verifikasi',
    vector: 'shield-check-outline',
    activeVector: 'shield-check',
  },
  komunitas: {
    label: 'Komunitas',
    icon: require('@/assets/images/icons/community.png'),
    activeIcon: require('@/assets/images/icons/community-active.png'),
  },
};

const RADIUS = 28;
const LINE = 4;

export function RoleTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = width / count;
  // ujung kiri & kanan garis (dalam satuan index tab), digerakkan terpisah biar jalannya kayak cacing
  const start = useSharedValue(state.index);
  const end = useSharedValue(state.index);

  useEffect(() => {
    const target = state.index;
    const lead = { duration: 260, easing: Easing.out(Easing.cubic) };
    const trail = { duration: 340, easing: Easing.inOut(Easing.cubic) };
    if (target > end.value) {
      end.value = withTiming(target, lead);
      start.value = withDelay(110, withTiming(target, trail));
    } else if (target < start.value) {
      start.value = withTiming(target, lead);
      end.value = withDelay(110, withTiming(target, trail));
    } else {
      // kalau ditap saat garis masih bergerak
      start.value = withTiming(target, lead);
      end.value = withTiming(target, lead);
    }
  }, [state.index, start, end]);

  // lengkungan sudut baru muncul setelah ujung belakang garis sampai di tab pojok
  const indicatorStyle = useAnimatedStyle(() => {
    const leftCurve = interpolate(end.value, [0, 0.6], [1, 0], 'clamp');
    const rightCurve = interpolate(start.value, [count - 1.6, count - 1], [0, 1], 'clamp');
    return {
      width: (end.value - start.value + 1) * tabWidth,
      transform: [{ translateX: start.value * tabWidth }],
      borderLeftWidth: LINE * leftCurve,
      borderRightWidth: LINE * rightCurve,
      borderTopLeftRadius: 2 + (RADIUS - 2) * leftCurve,
      borderTopRightRadius: 2 + (RADIUS - 2) * rightCurve,
    };
  });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.bar, Shadow.clay, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {width > 0 && (
        <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
      )}
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              // event 'tabPress' dipakai useScrollToTop: tab yang sedang aktif diketuk lagi → halaman kembali ke atas
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={styles.item}>
            {'vector' in tab ? (
              <MaterialCommunityIcons
                name={focused ? tab.activeVector : tab.vector}
                size={28}
                color={focused ? Colors.primary : '#4A5568'}
              />
            ) : (
              <Image source={focused ? tab.activeIcon : tab.icon} style={styles.icon} contentFit="contain" />
            )}
            <AppText style={[styles.label, focused && styles.labelActive]}>{tab.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingTop: 14,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: RADIUS,
    borderTopWidth: LINE,
    borderColor: Colors.primary,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 28,
    height: 28,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#4A5568',
  },
  labelActive: {
    color: Colors.primary,
  },
});
