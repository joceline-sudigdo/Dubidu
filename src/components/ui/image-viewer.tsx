import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState, useSyncExternalStore } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Fonts, Radius } from '@/constants/theme';

// number = require(...), string = uri, null = belum ada foto (tampil placeholder)
export type ViewerImage = { source: number | string | null; caption?: string };

let state: { images: ViewerImage[]; index: number } | null = null;
const listeners = new Set<() => void>();

function set(next: typeof state) {
  state = next;
  listeners.forEach((l) => l());
}

// buka gambar layar penuh, bisa geser kalau lebih dari satu
export function openImages(images: (ViewerImage | number | string | null)[], index = 0) {
  const list = images.map((img) => (img && typeof img === 'object' ? img : { source: img }));
  if (list.length) set({ images: list, index: Math.min(index, list.length - 1) });
}

export function ImageViewerHost() {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
  return current ? <Viewer key={current.images.length + ':' + current.index} {...current} /> : null;
}

function Viewer({ images, index }: { images: ViewerImage[]; index: number }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(index);
  const close = () => set(null);
  const caption = images[page]?.caption;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.root}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            // ScrollView biar bisa dicubit untuk zoom (iOS)
            <ScrollView
              style={{ width, height }}
              contentContainerStyle={styles.center}
              maximumZoomScale={3}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}>
              {item.source ? (
                <Image
                  source={typeof item.source === 'string' ? { uri: item.source } : item.source}
                  style={{ width, height: height * 0.8 }}
                  contentFit="contain"
                />
              ) : (
                <View style={[styles.placeholder, { width: width - 48, height: (width - 48) * 1.2 }]}>
                  <MaterialCommunityIcons name="image-outline" size={56} color="rgba(255,255,255,0.6)" />
                  <AppText style={styles.placeholderText}>Foto belum tersedia</AppText>
                </View>
              )}
            </ScrollView>
          )}
        />

        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable accessibilityLabel="Tutup" hitSlop={10} onPress={close} style={styles.close}>
            <Feather name="x" size={22} color="#FFFFFF" />
          </Pressable>
          {images.length > 1 && (
            <AppText style={styles.counter}>
              {page + 1} / {images.length}
            </AppText>
          )}
        </View>

        {!!caption && (
          <View style={[styles.captionBox, { paddingBottom: insets.bottom + 16 }]}>
            <AppText style={styles.caption}>{caption}</AppText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 30, 0.96)',
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  placeholder: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  captionBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
