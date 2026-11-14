import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

// pesan error di bawah kolom yang tidak punya prop error sendiri (upload, pilihan chip, tanggal)
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.row}>
      <Feather name="alert-circle" size={13} color={Colors.red} />
      <AppText variant="caption" color={Colors.red} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
    marginTop: -4,
  },
  text: {
    flexShrink: 1,
  },
});
