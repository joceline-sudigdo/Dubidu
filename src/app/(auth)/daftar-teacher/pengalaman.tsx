import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { FormScreen } from '@/components/ui/form-screen';
import { NeedCategory } from '@/components/ui/need-category';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { NEED_CATEGORIES } from '@/data/needs';

const EXPERIENCE = ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'];
const BIO_MAX = 300;

// langkah 3: pengalaman & spesialisasi kondisi yang biasa ditangani
export default function PengalamanScreen() {
  const [experience, setExperience] = useState<string | null>(null);
  const [specs, setSpecs] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(NEED_CATEGORIES[0].title);
  const [cv, setCv] = useState<string | null>(null);
  const [bio, setBio] = useState('');

  const toggle = (option: string) =>
    setSpecs((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));

  const canSubmit = !!experience && specs.length > 0 && bio.trim().length >= 20;

  return (
    <FormScreen
      title="Pengalaman & Spesialisasi"
      subtitle="Ceritakan pengalamanmu supaya kami mudah mencarikan anak yang cocok untukmu."
      step={{ current: 3, total: 4 }}>
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Lama Pengalaman Menangani ABK
        </AppText>
        <View style={styles.grid}>
          {EXPERIENCE.map((e) => (
            <ChoiceChip key={e} label={e} selected={experience === e} onPress={() => setExperience(e)} style={styles.half} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Spesialisasi Kondisi <AppText style={styles.hint}>(bisa pilih lebih dari satu)</AppText>
        </AppText>
        {NEED_CATEGORIES.map((c) => (
          <NeedCategory
            key={c.title}
            {...c}
            selected={specs}
            expanded={expanded === c.title}
            onToggleExpanded={() => setExpanded((cur) => (cur === c.title ? null : c.title))}
            onToggleOption={toggle}
          />
        ))}
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          CV / Portofolio <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox title="Ketuk untuk unggah CV / portofolio" icon="file-text" value={cv} onChange={setCv} />
      </View>

      <View style={styles.group}>
        <TextField
          label="Bio Singkat"
          placeholder="Ceritakan sedikit tentang dirimu dan gaya kamu mendampingi anak..."
          multiline
          maxLength={BIO_MAX}
          value={bio}
          onChangeText={setBio}
        />
        <AppText variant="caption" style={styles.counter}>
          {bio.length}/{BIO_MAX} · minimal 20 karakter
        </AppText>
      </View>

      <PrimaryButton
        title="Next"
        disabled={!canSubmit}
        style={styles.button}
        onPress={() => router.push('/daftar-teacher/persetujuan')}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  half: {
    width: '48%',
  },
  counter: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  button: {
    marginTop: 8,
  },
});
