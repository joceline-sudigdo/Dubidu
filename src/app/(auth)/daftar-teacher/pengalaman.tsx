import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { FieldError } from '@/components/ui/field-error';
import { FormScreen } from '@/components/ui/form-screen';
import { NeedCategory } from '@/components/ui/need-category';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { noErrors } from '@/lib/validation';
import { NEED_CATEGORIES } from '@/data/needs';

const EXPERIENCE = ['< 1 tahun', '1-3 tahun', '3-5 tahun', '> 5 tahun'];
const BIO_MAX = 300;

// langkah 3: pengalaman & spesialisasi kondisi yang biasa ditangani
export default function PengalamanScreen() {
  const { data, update } = useParentRegistration();
  const [experience, setExperience] = useState<string | null>(data.teacher.experience);
  const [specs, setSpecs] = useState<string[]>(data.teacher.specializations);
  const [expanded, setExpanded] = useState<string | null>(NEED_CATEGORIES[0].title);
  const [cv, setCv] = useState<string | null>(data.teacher.cvUri);
  const [bio, setBio] = useState(data.teacher.bio);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: undefined }));

  const toggle = (option: string) => {
    setSpecs((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
    clear('specs');
  };

  const next = () => {
    const length = bio.trim().length;
    const found = {
      experience: experience ? undefined : 'Pilih lama pengalaman menangani ABK.',
      specs: specs.length ? undefined : 'Pilih minimal satu spesialisasi kondisi.',
      bio: !length ? 'Bio singkat wajib diisi.' : length < 20 ? `Bio minimal 20 karakter (sekarang ${length}).` : undefined,
    };
    setErrors(found);
    if (!noErrors(found)) return;
    update('teacher', { experience, specializations: specs, cvUri: cv, bio: bio.trim() });
    router.push('/daftar-teacher/persetujuan');
  };

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
            <ChoiceChip
              key={e}
              label={e}
              selected={experience === e}
              onPress={() => {
                setExperience(e);
                clear('experience');
              }}
              style={styles.half}
            />
          ))}
        </View>
        <FieldError message={errors.experience} />
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
        <FieldError message={errors.specs} />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          CV / Portofolio <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah CV / portofolio"
          icon="file-text"
          accept="document"
          value={cv}
          onChange={setCv}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label="Bio Singkat"
          placeholder="Ceritakan sedikit tentang dirimu dan gaya kamu mendampingi anak..."
          multiline
          maxLength={BIO_MAX}
          value={bio}
          onChangeText={(v) => {
            setBio(v);
            clear('bio');
          }}
          error={errors.bio}
        />
        <AppText variant="caption" style={styles.counter}>
          {bio.length}/{BIO_MAX} · minimal 20 karakter
        </AppText>
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
