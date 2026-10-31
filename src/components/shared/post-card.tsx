import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  commentCount,
  deletePost,
  formatCount,
  hidePost,
  likeCount,
  toggleLike,
  useCommunity,
  type FeedPost,
} from '@/lib/community-store';
import { showActionSheet, showAlert } from '@/lib/dialog';

import { PhotoCarousel } from './photo-carousel';

export const roleTone = (role: FeedPost['role']) =>
  role === 'Psikolog' ? 'red' : role === 'Shadow Teacher' ? 'green' : 'blue';

type Props = {
  post: FeedPost;
  // true di halaman detail: teks tampil penuh & kartu tidak bisa diklik lagi
  detail?: boolean;
  onDeleted?: () => void;
};

export function PostCard({ post, detail, onDeleted }: Props) {
  const community = useCommunity();
  const liked = community.liked.includes(post.id);
  const openDetail = () => router.push({ pathname: '/postingan/[id]', params: { id: post.id } });

  const openMenu = () =>
    showActionSheet({
      title: 'Postingan',
      options: [
        { label: 'Simpan postingan', icon: 'bookmark', onPress: () => showAlert('Postingan tersimpan') },
        { label: 'Bagikan', icon: 'share-2', onPress: () => Share.share({ message: `${post.author}: ${post.text}` }) },
        ...(post.mine
          ? [
              {
                label: 'Hapus postingan',
                icon: 'trash-2' as const,
                destructive: true,
                onPress: () =>
                  showAlert('Hapus postingan?', 'Postingan akan hilang dari komunitas.', [
                    { text: 'Batal', style: 'cancel' },
                    {
                      text: 'Hapus',
                      style: 'destructive',
                      onPress: () => {
                        deletePost(post.id);
                        onDeleted?.();
                      },
                    },
                  ]),
              },
            ]
          : [
              {
                label: 'Sembunyikan',
                icon: 'eye-off' as const,
                onPress: () => {
                  hidePost(post.id);
                  onDeleted?.();
                },
              },
              {
                label: 'Laporkan',
                icon: 'flag' as const,
                destructive: true,
                onPress: () =>
                  showAlert('Laporkan postingan?', 'Tim Dubidu akan meninjau postingan ini.', [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Laporkan', style: 'destructive', onPress: () => showAlert('Laporan terkirim') },
                  ]),
              },
            ]),
      ],
    });

  return (
    <ClayCard onPress={detail ? undefined : openDetail} style={styles.post}>
      <View style={styles.head}>
        <Avatar name={post.author} size={42} />
        <View style={styles.flex}>
          <View style={styles.authorRow}>
            <AppText style={styles.author} numberOfLines={1}>
              {post.author}
            </AppText>
            <Pill label={post.role} tone={roleTone(post.role)} />
          </View>
          <AppText variant="caption">{post.time}</AppText>
        </View>
        <Pressable accessibilityLabel="Menu postingan" hitSlop={10} onPress={openMenu}>
          <Feather name="more-horizontal" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {!!post.text && (
        <AppText style={styles.text} numberOfLines={detail ? undefined : 5}>
          {post.text}
        </AppText>
      )}

      <PhotoCarousel photos={post.photos} height={detail ? 280 : 200} />

      <View style={styles.divider} />
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={liked ? 'Batal suka' : 'Suka'}
          onPress={() => toggleLike(post.id)}
          style={[styles.action, { borderColor: Colors.red }, liked && { backgroundColor: Colors.redSoft }]}>
          <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
          <AppText style={[styles.actionText, { color: Colors.red }]}>
            {formatCount(likeCount(community, post))} Suka
          </AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Komentar"
          onPress={detail ? undefined : openDetail}
          style={[styles.action, { borderColor: Colors.primary }]}>
          <ChatIcon size={17} color={Colors.primary} />
          <AppText style={[styles.actionText, { color: Colors.primary }]}>
            {formatCount(commentCount(community, post))} Komentar
          </AppText>
        </Pressable>
      </View>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  post: {
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  author: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  actionText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
});
