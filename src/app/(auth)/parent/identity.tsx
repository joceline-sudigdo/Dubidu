import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FieldError } from '@/components/ui/field-error';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { noErrors, requiredError } from '@/lib/validation';

export default function IdentityScreen() {
  const { data, update } = useParentRegistration();
  // dipakai juga untuk pendaftaran shadow teacher (4 langkah)
  const isTeacher = useLocalSearchParams<{ role?: string }>().role === 'teacher';
  const [ktpUri, setKtpUri] = useState(data.identity.ktpUri);
  const [domicile, setDomicile] = useState(data.identity.domicile);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const next = () => {
    const found = {
      ktp: ktpUri ? undefined : 'Unggah foto KTP atau kartu identitas.',
      domicile: requiredError(domicile, 'Domisili', 3),
    };
    setErrors(found);
    if (!noErrors(found)) return;
    update('identity', { ktpUri, domicile: domicile.trim() });
    router.push(isTeacher ? '/daftar-teacher/pendidikan' : '/parent/child-data');
  };

  return (
    <FormScreen
      title="Verifikasi Identitas"
      subtitle="Agar kami merasa aman berinteraksi dengan kamu."
      step={{ current: 1, total: isTeacher ? 4 : 3 }}>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          KTP/Kartu Identitas
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah foto KTP"
          icon="camera"
          value={ktpUri}
          onChange={(v) => {
            setKtpUri(v);
            setErrors((e) => ({ ...e, ktp: undefined }));
          }}
        />
        <FieldError message={errors.ktp} />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Domisili <AppText style={styles.hint}>(Kota/Kabupaten)</AppText>
        </AppText>
        <TextField
          icon="map-pin"
          placeholder="Contoh: Malang, Jawa Timur"
          value={domicile}
          onChangeText={(v) => {
            setDomicile(v);
            setErrors((e) => ({ ...e, domicile: undefined }));
          }}
          error={errors.domicile}
        />
      </View>

      <PrimaryButton
        title="Next"
        style={styles.button}
        onPress={next}
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
