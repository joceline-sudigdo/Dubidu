import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import type { PhotoSource } from '@/lib/community-store';

const PLACEHOLDERS: [string, string][] = [
  [Colors.blueSoft, Colors.blueMid],
  [Colors.yellowSoft, '#FCE3A6'],
  [Colors.greenSoft, '#CFE2D5'],
];

// carousel foto postingan, bisa digeser kiri-kanan
export function PhotoCarousel({ photos, height = 220 }: { photos: PhotoSource[]; height?: number }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  if (photos.length === 0) return null;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View>
      <View style={[styles.frame, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== index) setIndex(i);
            }}>
            {photos.map((photo, i) =>
              photo ? (
                <Image
                  key={i}
                  source={typeof photo === 'string' ? { uri: photo } : photo}
                  style={{ width, height }}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient key={i} colors={PLACEHOLDERS[i % PLACEHOLDERS.length]} style={{ width, height }} />
              )
            )}
          </ScrollView>
        )}
        {photos.length > 1 && (
          <View style={styles.counter}>
            <AppText style={styles.counterText}>
              {index + 1}/{photos.length}
            </AppText>
          </View>
        )}
      </View>
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <Pressable key={i} hitSlop={6} accessibilityLabel={`Foto ${i + 1}`} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  counter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34, 50, 74, 0.6)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.disabled,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
});
