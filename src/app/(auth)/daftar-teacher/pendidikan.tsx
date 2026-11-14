import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { FieldError } from '@/components/ui/field-error';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { noErrors, requiredError } from '@/lib/validation';

const EDUCATION = ['SMA/SMK', 'D3', 'S1', 'S2'];

// langkah 2 pendaftaran shadow teacher (dikirim ke server di langkah terakhir)
export default function PendidikanScreen() {
  const { data, update } = useParentRegistration();
  const [education, setEducation] = useState<string | null>(data.teacher.education);
  const [institution, setInstitution] = useState(data.teacher.institution);
  const [major, setMajor] = useState(data.teacher.major);
  const [ijazah, setIjazah] = useState<string | null>(data.teacher.ijazahUri);
  const [certificate, setCertificate] = useState<string | null>(data.teacher.certificateUri);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: undefined }));

  const next = () => {
    const found = {
      education: education ? undefined : 'Pilih pendidikan terakhir.',
      institution: requiredError(institution, 'Institusi / universitas', 3),
      major: requiredError(major, 'Jurusan', 3),
      ijazah: ijazah ? undefined : 'Unggah ijazah terakhir dalam format PDF.',
    };
    setErrors(found);
    if (!noErrors(found)) return;
    update('teacher', { education, institution: institution.trim(), major: major.trim(), ijazahUri: ijazah, certificateUri: certificate });
    router.push('/daftar-teacher/pengalaman');
  };

  return (
    <FormScreen
      title="Pendidikan & Sertifikasi"
      subtitle="Bantu kami memverifikasi kualifikasi kamu sebagai shadow teacher terpercaya."
      step={{ current: 2, total: 4 }}>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Pendidikan Terakhir
        </AppText>
        <View style={styles.row}>
          {EDUCATION.map((e) => (
            <ChoiceChip
              key={e}
              label={e}
              selected={education === e}
              onPress={() => {
                setEducation(e);
                clear('education');
              }}
              style={styles.flex}
            />
          ))}
        </View>
        <FieldError message={errors.education} />
      </View>

      <TextField
        label="Institusi / Universitas"
        icon="book"
        placeholder="Contoh: Universitas Negeri Malang"
        value={institution}
        onChangeText={(v) => {
          setInstitution(v);
          clear('institution');
        }}
        error={errors.institution}
      />
      <TextField
        label="Jurusan"
        icon="bookmark"
        placeholder="Contoh: Pendidikan Luar Biasa"
        value={major}
        onChangeText={(v) => {
          setMajor(v);
          clear('major');
        }}
        error={errors.major}
      />

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Ijazah Terakhir
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah ijazah"
          icon="upload-cloud"
          accept="document"
          value={ijazah}
          onChange={(v) => {
            setIjazah(v);
            clear('ijazah');
          }}
        />
        <FieldError message={errors.ijazah} />
      </View>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Sertifikat Relevan <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah sertifikat pelatihan"
          accept="document"
          icon="award"
          value={certificate}
          onChange={setCertificate}
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
  flex: {
    flex: 1,
  },
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    marginTop: 8,
  },
});
