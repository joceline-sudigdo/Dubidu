import { StyleSheet } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { EmptyState } from '@/components/parent/empty-state';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { PostCard } from '@/components/shared/post-card';
import { AppText } from '@/components/ui/app-text';
import { useCommunity } from '@/lib/community-store';

// postingan komunitas yang disimpan user (urutan terbaru disimpan di atas)
export default function TersimpanScreen() {
  const community = useCommunity();
  const posts = community.saved
    .map((id) => community.posts.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <Screen header={<ScreenHeader title="Postingan Tersimpan" />} edges={['top', 'bottom']}>
      {posts.length === 0 ? (
        <EmptyState
          title="Belum ada postingan tersimpan"
          subtitle="Ketuk titik tiga di postingan komunitas lalu pilih Simpan postingan."
        />
      ) : (
        <>
          <AppText variant="caption" style={styles.count}>
            {posts.length} postingan tersimpan
          </AppText>
          {posts.map((p) => (
            <Animated.View key={p.id} layout={LinearTransition} exiting={FadeOut.duration(200)}>
              <PostCard post={p} />
            </Animated.View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: {
    marginBottom: -4,
  },
});
