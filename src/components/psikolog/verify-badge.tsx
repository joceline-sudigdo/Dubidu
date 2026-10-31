import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import type { VerifyResult, VerifyStatus } from '@/data/psychologist';

export const VERIFY_META: Record<
  VerifyStatus,
  { label: string; icon: ComponentProps<typeof MaterialCommunityIcons>['name']; bg: string; fg: string }
> = {
  verified: { label: 'Verified', icon: 'check-decagram', bg: Colors.primary, fg: '#FFFFFF' },
  revision: { label: 'Perlu Perbaikan', icon: 'alert-circle', bg: Colors.yellow, fg: Colors.text },
  rejected: { label: 'Ditolak', icon: 'close-circle', bg: Colors.red, fg: '#FFFFFF' },
};

export function VerifyBadge({ result }: { result: VerifyResult }) {
  const m = VERIFY_META[result.status];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }, Shadow.soft]}>
      <MaterialCommunityIcons name={m.icon} size={18} color={m.fg} />
      <AppText style={[styles.text, { color: m.fg }]}>{m.label}</AppText>
      {result.issues.length > 0 && (
        <View style={styles.count}>
          <AppText style={styles.countText}>{result.issues.length} catatan</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    marginRight: 6,
  },
  count: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.text,
  },
});
