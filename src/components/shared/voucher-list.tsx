import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { EdgeScroll } from '@/components/parent/edge-scroll';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { rewardPhotos } from '@/data/images';
import type { Reward } from '@/data/rewards';
import { showAlert } from '@/lib/dialog';

// kode voucher demo, konsisten per hadiah (nanti dari backend)
export const voucherCode = (id: string) =>
  `DBD-${id.replace(/^t?r-/, '').toUpperCase().slice(0, 6)}-${[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9000, 7) + 1000}`;

const copy = async (code: string) => {
  await Clipboard.setStringAsync(code);
  showAlert('Kode tersalin', `${code} siap ditempel saat pembayaran.`);
};

// voucher yang sudah ditukar, digeser horizontal
export function VoucherList({ items }: { items: Reward[] }) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="tag" size={18} color={Colors.textMuted} />
        <AppText variant="caption" style={styles.flex}>
          Belum ada voucher. Tukar ikanmu dengan hadiah di bawah, nanti vouchernya muncul di sini.
        </AppText>
      </View>
    );
  }

  return (
    <EdgeScroll contentContainerStyle={styles.row}>
      {items.map((r) => {
        const code = voucherCode(r.id);
        const t = Tones[r.tone];
        return (
          <Pressable
            key={r.id}
            onPress={() =>
              showAlert(r.title, `Kode voucher: ${code}\n${r.subtitle}\nBerlaku 30 hari sejak ditukar.`, [
                { text: 'Tutup', style: 'cancel' },
                { text: 'Salin kode', onPress: () => copy(code) },
              ])
            }
            style={[styles.card, Shadow.soft]}>
            <View style={[styles.art, { backgroundColor: t.bg }]}>
              {rewardPhotos[r.id] ? (
                <Image source={rewardPhotos[r.id]} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Feather name={r.icon} size={22} color={t.fg} />
              )}
            </View>
            <View style={styles.flex}>
              <AppText style={styles.title} numberOfLines={1}>
                {r.title}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                Berlaku 30 hari
              </AppText>
              {/* garis putus-putus ala tiket voucher */}
              <View style={styles.codeRow}>
                <AppText style={styles.code} numberOfLines={1}>
                  {code}
                </AppText>
                <Pressable hitSlop={8} accessibilityLabel="Salin kode" onPress={() => copy(code)}>
                  <Feather name="copy" size={15} color={Colors.primary} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      })}
    </EdgeScroll>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    gap: 12,
    paddingBottom: 6,
    paddingRight: 4,
  },
  card: {
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  code: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.primaryDark,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
});
