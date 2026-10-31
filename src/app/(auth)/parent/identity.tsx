import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';

export default function IdentityScreen() {
  const { data, update } = useParentRegistration();
  const [ktpUri, setKtpUri] = useState(data.identity.ktpUri);
  const [domicile, setDomicile] = useState(data.identity.domicile);

  const canSubmit = !!ktpUri && domicile.trim().length > 0;

  return (
    <FormScreen
      title="Verifikasi Identitas"
      subtitle="Agar kami merasa aman berinteraksi dengan kamu."
      step={{ current: 1, total: 3 }}>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          KTP/Kartu Identitas
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah foto KTP"
          icon="camera"
          value={ktpUri}
          onChange={setKtpUri}
        />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Domisili <AppText style={styles.hint}>(Kota/Kabupaten)</AppText>
        </AppText>
        <TextField
          icon="map-pin"
          placeholder="Contoh: Malang, Jawa Timur"
          value={domicile}
          onChangeText={setDomicile}
        />
      </View>

      <PrimaryButton
        title="Next"
        disabled={!canSubmit}
        style={styles.button}
        onPress={() => {
          update('identity', { ktpUri, domicile: domicile.trim() });
          router.push('/parent/child-data');
        }}
      />
      <SecureNote />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  label: {
    marginLeft: 4,
  },
  hint: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 8,
  },
});
