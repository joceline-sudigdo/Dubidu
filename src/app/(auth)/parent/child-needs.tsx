import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { NeedCategory } from '@/components/ui/need-category';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { NEED_CATEGORIES as CATEGORIES } from '@/data/needs';
import { addChild } from '@/lib/children-store';
import { showAlert } from '@/lib/dialog';

export default function ChildNeedsScreen() {
  const { data, update, reset } = useParentRegistration();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const adding = mode === 'add';
  const [conditions, setConditions] = useState<string[]>(data.needs.conditions);
  const [medicalRecordUri, setMedicalRecordUri] = useState(data.needs.medicalRecordUri);
  const [expanded, setExpanded] = useState<string | null>(CATEGORIES[0].title);

  const toggleOption = (option: string) =>
    setConditions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );

  const finish = () => {
    if (adding) {
      // langsung masuk ke daftar anak, lalu balik ke halaman sebelumnya
      const child = addChild({ ...data.child, schoolLevel: data.child.schoolLevel ?? 'SD', conditions });
      reset();
      router.dismiss(2);
      showAlert('Profil anak dibuat', `${child.name} sudah ditambahkan. Yuk, cari shadow teacher yang cocok untuknya!`);
      return;
    }
    update('needs', { conditions, medicalRecordUri });
    // TODO(backend): kirim data registrasi ke API di sini
    reset();
    router.dismissAll();
    router.replace('/beranda');
  };

  return (
    <FormScreen
      title="Kebutuhan Anak"
      subtitle="Bantu kami memahami kondisi anak agar matching lebih akurat dan terarah."
      step={adding ? { current: 2, total: 2 } : { current: 3, total: 3 }}>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Kondisi Anak <AppText style={styles.hint}>(bisa pilih lebih dari satu)</AppText>
        </AppText>
        {CATEGORIES.map((category) => (
          <NeedCategory
            key={category.title}
            {...category}
            selected={conditions}
            expanded={expanded === category.title}
            onToggleExpanded={() =>
              setExpanded((current) => (current === category.title ? null : category.title))
            }
            onToggleOption={toggleOption}
          />
        ))}
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Belum tahu kondisi pasti anak kamu? <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <PrimaryButton
          title="Konsultasi ke Psikolog"
          leadingIcon="heart"
          color={Colors.red}
          onPress={() =>
            adding
              ? router.push('/konsultasi')
              : showAlert(
                  'Konsultasi ke Psikolog',
                  'Selesaikan pendaftaran dulu ya. Setelah akun aktif, kamu bisa langsung pilih psikolog dari menu Konsultasi di Beranda.'
                )
          }
        />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Rekam Medis <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah rekam medis"
          icon="upload-cloud"
          value={medicalRecordUri}
          onChange={setMedicalRecordUri}
        />
      </View>

      <PrimaryButton
        title="Selesai"
        icon="check-circle"
        disabled={conditions.length === 0}
        style={styles.button}
        onPress={finish}
      />
      <SecureNote />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 12,
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
