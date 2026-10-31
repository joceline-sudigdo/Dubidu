import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';

const EDUCATION = ['SMA/SMK', 'D3', 'S1', 'S2'];

// langkah 2 pendaftaran shadow teacher (UI saja, data dikirim ke backend nanti)
export default function PendidikanScreen() {
  const [education, setEducation] = useState<string | null>(null);
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [ijazah, setIjazah] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<string | null>(null);

  const canSubmit = !!education && institution.trim().length > 0 && major.trim().length > 0 && !!ijazah;

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
            <ChoiceChip key={e} label={e} selected={education === e} onPress={() => setEducation(e)} style={styles.flex} />
          ))}
        </View>
      </View>

      <TextField
        label="Institusi / Universitas"
        icon="book"
        placeholder="Contoh: Universitas Negeri Malang"
        value={institution}
        onChangeText={setInstitution}
      />
      <TextField
        label="Jurusan"
        icon="bookmark"
        placeholder="Contoh: Pendidikan Luar Biasa"
        value={major}
        onChangeText={setMajor}
      />

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Ijazah Terakhir
        </AppText>
        <UploadBox title="Ketuk untuk unggah ijazah" icon="upload-cloud" value={ijazah} onChange={setIjazah} />
      </View>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Sertifikat Relevan <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah sertifikat pelatihan"
          icon="award"
          value={certificate}
          onChange={setCertificate}
        />
      </View>

      <PrimaryButton
        title="Next"
        disabled={!canSubmit}
        style={styles.button}
        onPress={() => router.push('/daftar-teacher/pengalaman')}
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
