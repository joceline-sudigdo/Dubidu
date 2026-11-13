import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { openImages } from '@/components/ui/image-viewer';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { showAlert } from '@/lib/dialog';

// sama dengan batas server (backend/src/lib/upload.ts)
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

type Props = {
  title: string;
  icon: ComponentProps<typeof Feather>['name'];
  value: string | null;
  onChange: (uri: string | null) => void;
  // 'document' = dokumen PDF (ijazah, sertifikat), 'image' = foto dari galeri
  accept?: 'image' | 'document';
};

// nama file dari uri (dokumen hasil picker disalin ke cache dengan nama aslinya)
const fileName = (uri: string) => {
  const raw = decodeURIComponent(uri.split('/').pop()?.split('?')[0] ?? '');
  return raw.toLowerCase().endsWith('.pdf') ? raw : 'Dokumen PDF';
};

export function UploadBox({ title, icon, value, onChange, accept = 'image' }: Props) {
  const isDocument = accept === 'document';

  const pick = async () => {
    if (isDocument) {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.mimeType && asset.mimeType !== 'application/pdf') {
        showAlert('Format belum sesuai', 'Unggah dokumen dalam format PDF.');
        return;
      }
      if (asset.size && asset.size > MAX_SIZE_BYTES) {
        showAlert('File terlalu besar', 'Ukuran maksimal file adalah 4 MB.');
        return;
      }
      onChange(asset.uri);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
      showAlert('File terlalu besar', 'Ukuran maksimal file adalah 4 MB.');
      return;
    }
    onChange(asset.uri);
  };

  // pratinjau PDF dibuka di penampil bawaan / browser
  const openDocument = (uri: string) =>
    WebBrowser.openBrowserAsync(uri).catch(() => showAlert('Dokumen belum bisa dibuka', 'Dokumen tetap tersimpan dan akan diunggah.'));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={pick}
      style={({ pressed }) => [styles.box, Shadow.soft, pressed && { opacity: 0.85 }]}>
      {value && isDocument ? (
        <View style={styles.docRow}>
          <Pressable accessibilityLabel="Lihat dokumen" onPress={() => openDocument(value)} style={styles.docInfo}>
            <View style={styles.docIcon}>
              <Feather name="file-text" size={24} color={Colors.red} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" numberOfLines={1}>
                {fileName(value)}
              </AppText>
              <AppText variant="caption">PDF · ketuk untuk melihat</AppText>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hapus file"
            hitSlop={8}
            onPress={() => onChange(null)}
            style={styles.docRemove}>
            <Feather name="x" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : value ? (
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
          <AppText variant="caption">{isDocument ? 'Format PDF, maks 4 MB' : 'Format JPG/PNG, maks 4 MB'}</AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  docRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 50, 74, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
