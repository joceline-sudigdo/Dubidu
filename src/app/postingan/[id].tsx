import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/parent/avatar';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { PostCard, roleTone } from '@/components/shared/post-card';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { addComment, commentCount, deleteComment, formatCount, loadComments, loadCommunity, reportContent, type PostComment, useCommunity } from '@/lib/community-store';
import { showActionSheet, showAlert } from '@/lib/dialog';
import { getSession } from '@/lib/session';

export default function PostinganScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const me = getSession();
  const [text, setText] = useState('');
  const [newestFirst, setNewestFirst] = useState(false);

  // dibuka dari tautan bagikan sebelum feed termuat → muat feed dulu sebelum menyatakan tidak ditemukan
  const [checked, setChecked] = useState(false);
  const found = community.posts.some((p) => p.id === id);

  // komentar dimuat dari server saat postingan dibuka
  useEffect(() => {
    if (id) loadComments(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (found || checked) return;
    loadCommunity()
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [found, checked]);

  const post = community.posts.find((p) => p.id === id);
  if (!post) {
    return (
      <Screen header={<ScreenHeader title="Postingan" />} fill>
        <EmptyFill>
          {checked ? (
            <EmptyState title="Postingan tidak ditemukan" subtitle="Mungkin sudah dihapus oleh penulisnya." />
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </EmptyFill>
      </Screen>
    );
  }

  const comments = community.comments[post.id] ?? [];
  const sorted = newestFirst ? [...comments].reverse() : comments;
  const total = commentCount(community, post);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    addComment(post.id, value);
    setText('');
  };

  return (
    <Screen
      header={<ScreenHeader title="Postingan" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.inputBar}>
          <Avatar name={me.name} size={36} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis komentar..."
            placeholderTextColor={Colors.placeholder}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityLabel="Kirim komentar"
            disabled={!text.trim()}
            onPress={send}
            style={[styles.send, !text.trim() && { backgroundColor: Colors.disabled }]}>
            <Feather name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      }>
      <PostCard post={post} detail onDeleted={() => router.back()} />

      <View style={styles.commentHead}>
        <AppText style={styles.commentTitle}>Komentar · {formatCount(total)}</AppText>
        <Pressable onPress={() => setNewestFirst((n) => !n)} style={styles.sort}>
          <Feather name="sliders" size={14} color={Colors.primary} />
          <AppText variant="link" style={styles.sortText}>
            {newestFirst ? 'Terbaru' : 'Teratas'}
          </AppText>
        </Pressable>
      </View>

      {sorted.map((c) => (
        <CommentItem key={c.id} comment={c} postId={post.id} />
      ))}
      {comments.length === 0 && (
        <AppText variant="caption" style={styles.center}>
          Belum ada komentar. Jadilah yang pertama memberi dukungan 💙
        </AppText>
      )}
    </Screen>
  );
}

function CommentItem({ comment, postId }: { comment: PostComment; postId: string }) {
  const [liked, setLiked] = useState(false);

  const openMenu = () =>
    showActionSheet({
      options: comment.mine
        ? [
            {
              label: 'Hapus komentar',
              icon: 'trash-2',
              destructive: true,
              onPress: () => deleteComment(postId, comment.id),
            },
          ]
        : [
            {
              label: 'Laporkan komentar',
              icon: 'flag',
              destructive: true,
              onPress: async () => {
                if (await reportContent('COMMENT', comment.id, 'Komentar tidak pantas')) {
                  showAlert('Laporan terkirim', 'Tim Dubidu akan meninjau komentar ini.');
                }
              },
            },
          ],
    });

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.comment}>
      <Avatar name={comment.author} size={38} source={comment.avatarUrl ? { uri: comment.avatarUrl } : undefined} />
      <View style={styles.flex}>
        <View style={styles.commentMeta}>
          <AppText style={styles.commentAuthor} numberOfLines={1}>
            {comment.author}
          </AppText>
          <Pill inRow label={comment.role} tone={roleTone(comment.role)} />
          <AppText variant="caption">· {comment.time}</AppText>
        </View>
        <AppText style={styles.commentText}>{comment.text}</AppText>
        <View style={styles.commentActions}>
          <Pressable hitSlop={8} onPress={() => setLiked((l) => !l)} style={styles.inline}>
            <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={16} color={Colors.red} />
            <AppText variant="caption">{liked ? 1 : 0}</AppText>
          </Pressable>
        </View>
      </View>
      <Pressable accessibilityLabel="Menu komentar" hitSlop={10} onPress={openMenu}>
        <Feather name="more-vertical" size={18} color={Colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
    paddingVertical: 8,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  commentTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    fontSize: 14,
  },
  comment: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  commentAuthor: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    flexShrink: 1,
  },
  commentText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    marginTop: 4,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
