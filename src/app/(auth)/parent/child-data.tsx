import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { DateField } from '@/components/ui/date-field';
import { FieldError } from '@/components/ui/field-error';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { TextField } from '@/components/ui/text-field';
import {
  useParentRegistration,
  type Gender,
  type SchoolLevel,
} from '@/context/parent-registration';
import { noErrors, requiredError } from '@/lib/validation';

const SCHOOL_LEVELS: SchoolLevel[] = ['TK', 'SD', 'SMP'];

function birthDateError(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return 'Pilih tanggal lahir anak.';
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return 'Tanggal lahir tidak valid.';
  if (date > new Date()) return 'Tanggal lahir tidak boleh di masa depan.';
  return undefined;
}

export default function ChildDataScreen() {
  const { data, update } = useParentRegistration();
  // mode 'add' = tambah anak dari dalam aplikasi (khusus Plus), langkahnya cuma 2
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const adding = mode === 'add';
  const [name, setName] = useState(data.child.name);
  const [birthDate, setBirthDate] = useState(data.child.birthDate);
  const [gender, setGender] = useState<Gender | null>(data.child.gender);
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | null>(data.child.schoolLevel);
  const [domicile, setDomicile] = useState(data.child.domicile);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: undefined }));

  const next = () => {
    const found = {
      name: requiredError(name, 'Nama anak', 2),
      birthDate: birthDateError(birthDate),
      gender: gender ? undefined : 'Pilih jenis kelamin anak.',
      schoolLevel: schoolLevel ? undefined : 'Pilih jenjang sekolah anak.',
      domicile: requiredError(domicile, 'Domisili anak', 3),
    };
    setErrors(found);
    if (!noErrors(found)) return;
    update('child', { name: name.trim(), birthDate, gender, schoolLevel, domicile: domicile.trim() });
    router.push({ pathname: '/parent/child-needs', params: adding ? { mode: 'add' } : {} });
  };

  return (
    <FormScreen
      title={adding ? 'Tambah Anak' : 'Data Anak'}
      subtitle={
        adding
          ? 'Lengkapi profil si kecil supaya kami bisa carikan pendamping yang cocok.'
          : 'Informasi dasar untuk mulai mencari pendamping yang tepat.'
      }
      step={adding ? { current: 1, total: 2 } : { current: 2, total: 3 }}>
      <TextField
        label="Nama Anak"
        icon="user"
        placeholder="Contoh: John Doe"
        value={name}
        onChangeText={(v) => {
          setName(v);
          clear('name');
        }}
        error={errors.name}
      />
      <DateField
        label="Tanggal Lahir"
        placeholder="Pilih tanggal lahir"
        value={birthDate}
        onChange={(v) => {
          setBirthDate(v);
          clear('birthDate');
        }}
      />
      <FieldError message={errors.birthDate} />

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Jenis Kelamin
        </AppText>
        <View style={styles.row} accessibilityRole="radiogroup">
          <ChoiceChip
            label="Laki-laki"
            icon="gender-male"
            selected={gender === 'male'}
            onPress={() => {
              setGender('male');
              clear('gender');
            }}
            style={styles.flex}
          />
          <ChoiceChip
            label="Perempuan"
            icon="gender-female"
            selected={gender === 'female'}
            onPress={() => {
              setGender('female');
              clear('gender');
            }}
            style={styles.flex}
          />
        </View>
        <FieldError message={errors.gender} />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Jenjang Sekolah
        </AppText>
        <View style={styles.row} accessibilityRole="radiogroup">
          {SCHOOL_LEVELS.map((level) => (
            <ChoiceChip
              key={level}
              label={level}
              selected={schoolLevel === level}
              onPress={() => {
                setSchoolLevel(level);
                clear('schoolLevel');
              }}
              style={styles.flex}
            />
          ))}
        </View>
        <FieldError message={errors.schoolLevel} />
      </View>

      <TextField
        label="Domisili Anak"
        icon="map-pin"
        placeholder="Contoh: Malang, Jawa Timur"
        value={domicile}
        onChangeText={(v) => {
          setDomicile(v);
          clear('domicile');
        }}
        error={errors.domicile}
      />

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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  button: {
    marginTop: 8,
  },
});
