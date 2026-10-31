import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { Stars } from '@/components/parent/stars';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { reviewDetail as r } from '@/data/teacher';
import { showAlert } from '@/lib/dialog';

const MAX = 300;

export default function BalasUlasanScreen() {
  const [reply, setReply] = useState('');

  return (
    <Screen header={<ScreenHeader title="Notifikasi" />} edges={['top', 'bottom']}>
      <ClayCard style={styles.card}>
        <View style={styles.head}>
          <Avatar name={r.name} size={52} />
          <View style={styles.flex}>
            <AppText style={styles.name}>{r.name}</AppText>
            <AppText variant="caption">{r.time}</AppText>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="check-decagram" size={22} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.inline}>
          <Stars value={r.rating} size={24} />
          <AppText style={styles.score}>{r.rating.toFixed(1)}</AppText>
        </View>
        <AppText style={styles.text}>{r.text}</AppText>
        <Pill label={r.tag} tone="blue" solid size="md" />
      </ClayCard>

      <View style={styles.labelRow}>
        <AppText variant="label">Balas Ulasan</AppText>
        <AppText variant="caption">
          {reply.length}/{MAX}
        </AppText>
      </View>
      <TextInput
        value={reply}
        onChangeText={(t) => setReply(t.slice(0, MAX))}
        multiline
        placeholder="Tulis balasan yang akan tampil di profilmu..."
        placeholderTextColor={Colors.placeholder}
        style={styles.input}
      />
      <SecureNote text="Balasanmu akan terlihat publik di halaman profilmu" />
      <PrimaryButton
        title="Kirim Balasan"
        disabled={reply.trim().length === 0}
        onPress={() => showAlert('Terkirim', 'Balasanmu sudah tampil di profil.', [{ text: 'OK', onPress: () => router.back() }])}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  card: {
    gap: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 25,
    color: Colors.text,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  input: {
    minHeight: 130,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
});
