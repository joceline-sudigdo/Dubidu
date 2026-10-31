import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export function SecureNote({
  text = 'Data dienkripsi secara ketat untuk verifikasi keamanan komunitas Dubidu.',
}: {
  text?: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="shield-check" size={26} color={Colors.primaryDark} />
      <AppText variant="caption" color={Colors.textMuted} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
});
