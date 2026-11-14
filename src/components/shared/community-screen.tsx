import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BlurTargetView, BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  LinearTransition,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/parent/avatar";
import { Pill } from "@/components/parent/pill";
import { Screen } from "@/components/parent/screen";
import { TabHeader } from "@/components/parent/screen-header";
import { AppText } from "@/components/ui/app-text";
import {
  Colors,
  Fonts,
  MaxContentWidth,
  Radius,
  Shadow,
} from "@/constants/theme";
import { addPost, loadCommunity, useCommunity } from "@/lib/community-store";
import { showAlert } from "@/lib/dialog";
import { getSession } from "@/lib/session";

import { PostCard } from "./post-card";
import {
  MAX_POST_PHOTOS,
  MIN_CAPTION,
  POST_TOPICS,
  PostComposerSheet,
  type PostTopic,
} from "./post-composer-sheet";

const TOPICS = POST_TOPICS;

// transisi kolom posting <-> pencarian: geser pendek + memudar bersamaan (crossfade),
// durasi masuk & keluar sama supaya tidak ada momen kosong / berkedip
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const SWAP_MS = 280;

// komunitas dipakai bareng oleh orang tua, shadow teacher, dan psikolog
export function CommunityScreen() {
  const me = getSession();
  const community = useCommunity();
  // muat ulang postingan setiap tab dibuka (juga memulihkan bila gagal dimuat saat login)
  useFocusEffect(
    useCallback(() => {
      loadCommunity().catch(() => {});
    }, []),
  );
  const [topic, setTopic] = useState<(typeof TOPICS)[number] | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [postTopic, setPostTopic] = useState<PostTopic>("ADHD");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const insets = useSafeAreaInsets();

  // Bar posting/pencarian "menempel" di atas: bar dirender di luar ScrollView (di atas
  // BlurTargetView) lalu digeser mengikuti scroll. Di Android blur asli hanya bisa membaca
  // konten di dalam BlurTargetView, dan BlurView tidak boleh berada di dalamnya sendiri.
  const blurTarget = useRef<ComponentRef<typeof View>>(null);
  const barTop = insets.top + 8; // posisi bar saat menempel
  const scrollY = useSharedValue(0);
  const slotY = useSharedValue(-1); // posisi tempat bar di dalam konten (-1 = belum diukur)
  const blurOpacity = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  // blur muncul halus begitu bar mulai menempel, hilang lagi saat kembali ke posisi awal
  useAnimatedReaction(
    () => slotY.value >= 0 && slotY.value - scrollY.value <= barTop + 0.5,
    (stuck, prev) => {
      if (stuck !== prev)
        blurOpacity.value = withTiming(stuck ? 1 : 0, { duration: 180 });
    },
  );
  const barStyle = useAnimatedStyle(() => ({
    opacity: slotY.value < 0 ? 0 : 1,
    transform: [
      { translateY: Math.max(slotY.value - scrollY.value - barTop, 0) },
    ],
  }));
  const blurStyle = useAnimatedStyle(() => ({ opacity: blurOpacity.value }));

  const q = searchMode ? query.trim().toLowerCase() : "";
  const posts = community.posts
    .filter((p) => !community.hidden.includes(p.id))
    .filter((p) => !topic || p.topic === topic)
    .filter((p) => !q || (p.text + p.author).toLowerCase().includes(q));

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_POST_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((list) =>
        [...list, ...result.assets.map((a) => a.uri)].slice(0, MAX_POST_PHOTOS),
      );
      if (topic) setPostTopic(topic);
    }
  };

  // ketuk kolom "Bagikan sesuatu" → langsung buka lembar posting
  const openComposer = () => {
    if (topic) setPostTopic(topic);
    setSheetOpen(true);
  };

  const discard = () => {
    setPhotos([]);
    setDraft("");
  };

  const publish = async () => {
    const text = draft.trim();
    if (text.length < MIN_CAPTION || posting) return;
    setPosting(true);
    const ok = await addPost(text, photos, postTopic);
    setPosting(false);
    if (!ok) return;
    setSheetOpen(false);
    discard();
    showAlert("Postingan berhasil dibagikan");
  };

  const toggleMode = () => {
    setSearchMode((m) => !m);
    setQuery("");
  };

  return (
    <View style={styles.root}>
      <BlurTargetView ref={blurTarget} style={styles.root}>
        <Screen
          // konten digulir sampai ke tepi atas layar, supaya area di atas bar (status bar) ikut ter-blur
          edges={[]}
          contentStyle={{ paddingTop: insets.top + 8 }}
          onScroll={onScroll}
        >
          <TabHeader
            title="Komunitas"
            right={
              <Pressable
                accessibilityLabel={
                  searchMode ? "Kembali ke posting" : "Cari postingan"
                }
                onPress={toggleMode}
                style={[styles.headerButton, Shadow.button]}
              >
                <Animated.View
                  key={searchMode ? "post" : "search"}
                  entering={ZoomIn.duration(240).easing(
                    Easing.out(Easing.back(1.6)),
                  )}
                >
                  {searchMode ? (
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={22}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Feather name="search" size={20} color="#FFFFFF" />
                  )}
                </Animated.View>
              </Pressable>
            }
          />

          {/* tempat bar posting/pencarian di halaman (barnya sendiri ada di lapisan atas) */}
          <View
            style={styles.composerPlaceholder}
            onLayout={(e) => (slotY.value = e.nativeEvent.layout.y)}
          />

          <View style={styles.topics}>
            {TOPICS.map((t) => (
              <Pill
                key={t}
                label={t}
                tone="blue"
                size="md"
                solid={topic === t}
                onPress={() => setTopic((cur) => (cur === t ? null : t))}
                style={styles.topic}
              />
            ))}
          </View>

          {/* hasil filter/pencarian berganti dengan memudar & bergeser halus, bukan melompat */}
          {posts.map((post) => (
            <Animated.View
              key={post.id}
              entering={FadeIn.duration(240)}
              exiting={FadeOut.duration(160)}
              layout={LinearTransition.duration(260).easing(EASE)}
            >
              <PostCard post={post} />
            </Animated.View>
          ))}
          {posts.length === 0 && (
            <Animated.View entering={FadeIn.duration(240)}>
              <AppText variant="caption" style={styles.empty}>
                {q
                  ? `Tidak ada postingan untuk "${query.trim()}".`
                  : "Belum ada postingan."}
              </AppText>
            </Animated.View>
          )}
        </Screen>
      </BlurTargetView>

      {/* bar posting/pencarian: ikut tergulir bersama judul, lalu menempel di atas.
        Saat menempel, latar dari tepi atas layar sampai bawah bar di-blur bening
        (tanpa lapisan putih) sehingga gambar postingan di belakangnya tersamarkan. */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyBar, { paddingTop: barTop }, barStyle]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, blurStyle]}
        >
          {/* blur bening tanpa lapisan putih: intensity rendah = warna tint hampir tak terlihat,
            blurReductionFactor kecil = radius blur Android tetap besar (intensity / faktor) */}
          <BlurView
            blurTarget={blurTarget}
            blurMethod="dimezisBlurView"
            intensity={10}
            blurReductionFactor={1.2}
            tint="default"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.stickyInner}>
          <View style={styles.composerSlot}>
            {searchMode ? (
              <Animated.View
                key="search"
                entering={FadeInRight.duration(SWAP_MS).easing(EASE)}
                exiting={FadeOutRight.duration(SWAP_MS).easing(EASE)}
                style={[styles.composer, styles.composerLayer, Shadow.button]}
              >
                <View style={styles.searchIcon}>
                  <Feather name="search" size={18} color="#FFFFFF" />
                </View>
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Cari postingan atau nama..."
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.input}
                />
                {query.length > 0 && (
                  <Pressable
                    accessibilityLabel="Hapus pencarian"
                    onPress={() => setQuery("")}
                    style={styles.composerIcon}
                  >
                    <Feather name="x" size={18} color="#FFFFFF" />
                  </Pressable>
                )}
              </Animated.View>
            ) : (
              <Animated.View
                key="post"
                entering={FadeInLeft.duration(SWAP_MS).easing(EASE)}
                exiting={FadeOutLeft.duration(SWAP_MS).easing(EASE)}
                style={[styles.composer, styles.composerLayer, Shadow.button]}
              >
                <Avatar name={me.name} size={40} ring="#FFFFFF" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tulis postingan"
                  onPress={openComposer}
                  style={[styles.input, styles.fakeInput]}
                >
                  <AppText
                    numberOfLines={1}
                    color={draft ? Colors.text : Colors.textSecondary}
                    style={styles.fakeInputText}
                  >
                    {draft || "Bagikan sesuatu..."}
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityLabel="Unggah foto"
                  onPress={pickPhotos}
                  style={styles.composerIcon}
                >
                  <MaterialCommunityIcons
                    name="image-plus"
                    size={20}
                    color="#FFFFFF"
                  />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>

      {!searchMode && (
        <PostComposerSheet
          authorName={me.name}
          photos={photos}
          caption={draft}
          topic={postTopic}
          open={sheetOpen}
          posting={posting}
          onOpenChange={setSheetOpen}
          onCaptionChange={setDraft}
          onTopicChange={setPostTopic}
          onAddPhotos={pickPhotos}
          onRemovePhoto={(uri) =>
            setPhotos((list) => list.filter((x) => x !== uri))
          }
          onDiscard={discard}
          onSubmit={publish}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // lapisan bar selebar layar supaya blur rata dari tepi ke tepi
  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
  },
  stickyInner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  // ruang kosong seukuran bar di dalam halaman (jarak ke judul & filter sama seperti sebelumnya)
  composerPlaceholder: {
    height: 56,
    marginTop: 8,
    marginBottom: 10,
  },
  fakeInput: {
    justifyContent: "center",
  },
  fakeInputText: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  // kolom posting & pencarian ditumpuk di slot yang sama supaya animasinya tidak menggeser layout
  composerSlot: {
    height: 56,
    borderRadius: Radius.pill,
  },
  composerLayer: {
    ...StyleSheet.absoluteFill,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    padding: 8,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  composerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  // jarak lega antara bar posting dan filter topik
  topics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  topic: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  empty: {
    textAlign: "center",
    paddingVertical: 20,
  },
});
