import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeOut, SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';

import { Avatar } from '@/components/parent/avatar';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { AppText } from '@/components/ui/app-text';
import { openImages } from '@/components/ui/image-viewer';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { addPost, useCommunity } from '@/lib/community-store';
import { showAlert } from '@/lib/dialog';
import { getSession } from '@/lib/session';

import { PostCard } from './post-card';

const TOPICS = ['ADHD', 'Autism', 'Speech Delay'] as const;
const MAX_PHOTOS = 5;

// komunitas dipakai bareng oleh orang tua, shadow teacher, dan psikolog
export function CommunityScreen() {
  const me = getSession();
  const community = useCommunity();
  const [topic, setTopic] = useState<(typeof TOPICS)[number] | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const q = searchMode ? query.trim().toLowerCase() : '';
  const posts = community.posts
    .filter((p) => !community.hidden.includes(p.id))
    .filter((p) => !topic || p.topic === topic)
    .filter((p) => !q || (p.text + p.author).toLowerCase().includes(q));

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) setPhotos((list) => [...list, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  const publish = async () => {
    const text = draft.trim();
    if (!text && photos.length === 0) return;
    if (!(await addPost(text, photos, topic ?? 'ADHD'))) return;
    setDraft('');
    setPhotos([]);
    showAlert('Postingan berhasil dibagikan');
  };

  const toggleMode = () => {
    setSearchMode((m) => !m);
    setQuery('');
  };

  const canPost = !!draft.trim() || photos.length > 0;

  return (
    <Screen>
      <TabHeader
        title="Komunitas"
        right={
          <Pressable
            accessibilityLabel={searchMode ? 'Kembali ke posting' : 'Cari postingan'}
            onPress={toggleMode}
            style={[styles.headerButton, Shadow.button]}>
            <Animated.View key={searchMode ? 'post' : 'search'} entering={ZoomIn.duration(200)}>
              {searchMode ? (
                <MaterialCommunityIcons name="image-plus" size={22} color="#FFFFFF" />
              ) : (
                <Feather name="search" size={20} color="#FFFFFF" />
              )}
            </Animated.View>
          </Pressable>
        }
      />

      <View style={styles.composerSlot}>
        {searchMode ? (
          <Animated.View
            key="search"
            entering={SlideInRight.duration(260).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(120)}
            style={[styles.composer, styles.composerLayer, Shadow.button]}>
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
              <Pressable accessibilityLabel="Hapus pencarian" onPress={() => setQuery('')} style={styles.composerIcon}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            key="post"
            entering={SlideInLeft.duration(260).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(120)}
            style={[styles.composer, styles.composerLayer, Shadow.button]}>
            <Avatar name={me.name} size={40} ring="#FFFFFF" />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Bagikan sesuatu..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />
            {canPost ? (
              <Pressable accessibilityLabel="Kirim postingan" onPress={publish} style={styles.composerIcon}>
                <Feather name="send" size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable accessibilityLabel="Tambah foto" onPress={pickPhotos} style={styles.composerIcon}>
                <MaterialCommunityIcons name="image-plus" size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>

      {!searchMode && photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {photos.map((uri, i) => (
            <View key={uri} style={styles.thumb}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => openImages(photos, i)}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Pressable>
              <Pressable
                accessibilityLabel={`Hapus foto ${i + 1}`}
                onPress={() => setPhotos((list) => list.filter((x) => x !== uri))}
                style={styles.remove}>
                <Feather name="x" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable accessibilityLabel="Tambah foto lagi" onPress={pickPhotos} style={[styles.thumb, styles.addThumb]}>
              <Feather name="plus" size={22} color={Colors.primary} />
              <AppText variant="caption">
                {photos.length}/{MAX_PHOTOS}
              </AppText>
            </Pressable>
          )}
        </ScrollView>
      )}

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

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === 0 && (
        <AppText variant="caption" style={styles.empty}>
          {q ? `Tidak ada postingan untuk "${query.trim()}".` : 'Belum ada postingan.'}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // kolom posting & pencarian ditumpuk di slot yang sama supaya animasinya tidak menggeser layout
  composerSlot: {
    height: 56,
    overflow: 'hidden',
    borderRadius: Radius.pill,
  },
  composerLayer: {
    ...StyleSheet.absoluteFill,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    padding: 8,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbs: {
    gap: 10,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  addThumb: {
    alignItems: 'center',
    justifyContent: 'center',
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
  topics: {
    flexDirection: 'row',
    gap: 10,
  },
  topic: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
});
