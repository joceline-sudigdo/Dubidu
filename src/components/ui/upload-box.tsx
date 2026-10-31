import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { openImages } from '@/components/ui/image-viewer';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { showAlert } from '@/lib/dialog';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type Props = {
  title: string;
  icon: ComponentProps<typeof Feather>['name'];
  value: string | null;
  onChange: (uri: string | null) => void;
};

export function UploadBox({ title, icon, value, onChange }: Props) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
      showAlert('File terlalu besar', 'Ukuran maksimal file adalah 5MB.');
      return;
    }
    onChange(asset.uri);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={pick}
      style={({ pressed }) => [styles.box, Shadow.soft, pressed && { opacity: 0.85 }]}>
      {value ? (
        <View style={styles.previewWrap}>
          <Pressable accessibilityLabel="Lihat file" onPress={() => openImages([value])}>
            <Image source={{ uri: value }} style={styles.preview} contentFit="cover" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hapus file"
            hitSlop={8}
            onPress={() => onChange(null)}
            style={styles.remove}>
            <Feather name="x" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.iconCircle}>
            <Feather name={icon} size={30} color={Colors.primaryDark} />
          </View>
          <AppText variant="label" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="caption">Format JPG/PNG, maks 5MB</AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    minHeight: 170,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
  },
  previewWrap: {
    width: '100%',
    height: 160,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 50, 74, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
