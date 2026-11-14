import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/parent/avatar';
import { Pill } from '@/components/parent/pill';
import { AppText } from '@/components/ui/app-text';
import { openImages } from '@/components/ui/image-viewer';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

export const POST_TOPICS = ['ADHD', 'Autism', 'Speech Delay'] as const;
export type PostTopic = (typeof POST_TOPICS)[number];
export const MAX_POST_PHOTOS = 5;
// sama dengan validasi server (POST /posts: teks minimal 3 karakter)
export const MIN_CAPTION = 3;

type Props = {
  authorName: string;
  photos: string[];
  caption: string;
  topic: PostTopic;
  open: boolean;
  posting: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptionChange: (text: string) => void;
  onTopicChange: (topic: PostTopic) => void;
  onAddPhotos: () => void;
  onRemovePhoto: (uri: string) => void;
  onDiscard: () => void;
  onSubmit: () => void;
};

// alur posting komunitas:
// 1. pilih foto → kartu kecil muncul di bawah layar (bisa digeser ke atas / diketuk)
// 2. kartu terbuka jadi lembar penuh berisi foto + caption + topik, lalu "Bagikan"
export function PostComposerSheet(props: Props) {
  const { photos, open } = props;
  return (
    <>
      {photos.length > 0 && !open && <PeekCard {...props} />}
      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => props.onOpenChange(false)}>
        {open && <Sheet {...props} />}
      </Modal>
    </>
  );
}

// panah "geser ke atas" yang memantul pelan supaya pengguna paham kartunya bisa ditarik
function BouncingChevron() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-4, { duration: 450, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 450 })),
      -1
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={style}>
      <Feather name="chevrons-up" size={18} color={Colors.primary} />
    </Animated.View>
  );
}

function PeekCard({ photos, onOpenChange, onDiscard }: Props) {
  // geser ke atas lebih dari 24px = buka lembar caption
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
        onPanResponderRelease: (_, g) => {
          if (g.dy < -24 || g.vy < -0.4) onOpenChange(true);
        },
      }),
    [onOpenChange]
  );

  return (
    <Animated.View
      entering={SlideInDown.duration(320).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutDown.duration(220)}
      style={[styles.peek, Shadow.clay]}
      {...responder.panHandlers}>
      <Pressable accessibilityLabel="Buka lembar caption" onPress={() => onOpenChange(true)} style={styles.peekInner}>
        <View style={styles.handle} />
        <View style={styles.peekRow}>
          <View style={styles.peekThumbs}>
            {photos.slice(0, 3).map((uri, i) => (
              <Image
                key={uri}
                source={{ uri }}
                style={[styles.peekThumb, i > 0 && styles.peekThumbStacked]}
                contentFit="cover"
              />
            ))}
          </View>
          <View style={styles.flex}>
            <AppText style={styles.peekTitle}>{photos.length} foto siap dibagikan</AppText>
            <View style={styles.peekHint}>
              <BouncingChevron />
              <AppText variant="caption" color={Colors.primary}>
                Geser ke atas untuk tulis caption
              </AppText>
            </View>
          </View>
          <Pressable accessibilityLabel="Batalkan postingan" hitSlop={10} onPress={onDiscard} style={styles.peekClose}>
            <Feather name="x" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Sheet({
  authorName,
  photos,
  caption,
  topic,
  posting,
  onOpenChange,
  onCaptionChange,
  onTopicChange,
  onAddPhotos,
  onRemovePhoto,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const length = caption.trim().length;
  const valid = length >= MIN_CAPTION;

  // tarik pegangan ke bawah untuk menutup (draft tetap tersimpan)
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
        onPanResponderRelease: (_, g) => {
          if (g.dy > 40 || g.vy > 0.5) onOpenChange(false);
        },
      }),
    [onOpenChange]
  );

  return (
    <View style={styles.modalRoot}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Tutup" style={styles.backdrop} onPress={() => onOpenChange(false)} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.duration(340).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(220)}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View {...responder.panHandlers} style={styles.grab}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <AppText style={styles.sheetTitle}>Buat Postingan</AppText>
              <Pressable accessibilityLabel="Tutup" hitSlop={10} onPress={() => onOpenChange(false)}>
                <Feather name="chevron-down" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <View style={styles.author}>
              <Avatar name={authorName} size={40} />
              <AppText style={styles.authorName} numberOfLines={1}>
                {authorName}
              </AppText>
            </View>

            <TextInput
              autoFocus={photos.length === 0}
              multiline
              value={caption}
              onChangeText={onCaptionChange}
              placeholder={photos.length ? 'Tulis caption untuk fotomu...' : 'Bagikan cerita, pertanyaan, atau tips...'}
              placeholderTextColor={Colors.placeholder}
              maxLength={3000}
              style={styles.caption}
              textAlignVertical="top"
            />
            <AppText variant="caption" color={valid || length === 0 ? Colors.textSecondary : Colors.red} style={styles.counter}>
              {valid ? `${length} karakter` : `Minimal ${MIN_CAPTION} karakter`}
            </AppText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {photos.map((uri, i) => (
                <View key={uri} style={styles.thumb}>
                  <Pressable style={StyleSheet.absoluteFill} onPress={() => openImages(photos, i)}>
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </Pressable>
                  <Pressable accessibilityLabel={`Hapus foto ${i + 1}`} onPress={() => onRemovePhoto(uri)} style={styles.remove}>
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_POST_PHOTOS && (
                <Pressable accessibilityLabel="Tambah foto" onPress={onAddPhotos} style={[styles.thumb, styles.addThumb]}>
                  <Feather name="image" size={20} color={Colors.primary} />
                  <AppText variant="caption">
                    {photos.length}/{MAX_POST_PHOTOS}
                  </AppText>
                </Pressable>
              )}
            </ScrollView>

            <AppText style={styles.label}>Topik</AppText>
            <View style={styles.topics}>
              {POST_TOPICS.map((t) => (
                <Pill key={t} label={t} tone="blue" size="md" solid={topic === t} onPress={() => onTopicChange(t)} style={styles.topic} />
              ))}
            </View>
          </ScrollView>

          <PrimaryButton
            title={posting ? 'Membagikan...' : 'Bagikan'}
            leadingIcon="send"
            disabled={!valid || posting}
            onPress={onSubmit}
            style={styles.submit}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.blueMid,
  },
  // kartu kecil di atas tab bar
  peek: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  peekInner: {
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  peekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peekThumbs: {
    flexDirection: 'row',
  },
  peekThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: Colors.surface,
  },
  peekThumbStacked: {
    marginLeft: -18,
  },
  peekTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  peekHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  peekClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // lembar penuh
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(34, 50, 74, 0.45)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grab: {
    gap: 10,
    paddingBottom: 6,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
  },
  sheetBody: {
    gap: 12,
    paddingVertical: 8,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorName: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  caption: {
    minHeight: 110,
    maxHeight: 200,
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    padding: 14,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  thumbs: {
    gap: 10,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  addThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.blueMid,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34, 50, 74, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  topics: {
    flexDirection: 'row',
    gap: 8,
  },
  topic: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  submit: {
    marginTop: 8,
  },
});
