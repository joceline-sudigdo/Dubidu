import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FieldError } from '@/components/ui/field-error';
import { FormScreen } from '@/components/ui/form-screen';
import { NeedCategory } from '@/components/ui/need-category';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { NEED_CATEGORIES as CATEGORIES } from '@/data/needs';
import { errorMessage } from '@/lib/api';
import { registerParent } from '@/lib/auth';
import { addChild } from '@/lib/children-store';
import { showAlert } from '@/lib/dialog';

export default function ChildNeedsScreen() {
  const { data, update, reset } = useParentRegistration();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const adding = mode === 'add';
  const [conditions, setConditions] = useState<string[]>(data.needs.conditions);
  const [medicalRecordUri, setMedicalRecordUri] = useState(data.needs.medicalRecordUri);
  const [expanded, setExpanded] = useState<string | null>(CATEGORIES[0].title);
  // orang tua yang belum tahu kondisi anak: setelah akun dibuat langsung diarahkan ke pilihan psikolog
  const [wantConsult, setWantConsult] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const toggleOption = (option: string) => {
    setConditions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
    setError(undefined);
  };

  const [saving, setSaving] = useState(false);

  const finish = async () => {
    // kondisi boleh kosong kalau orang tua memilih konsultasi psikolog dulu
    if (conditions.length === 0 && !wantConsult) {
      setError('Pilih minimal satu kondisi anak, atau pilih "Konsultasi ke Psikolog" bila belum tahu.');
      return;
    }
    setSaving(true);
    try {
      if (adding) {
        // simpan anak baru, lalu balik ke halaman sebelumnya
        const child = await addChild({ ...data.child, schoolLevel: data.child.schoolLevel ?? 'SD', conditions });
        reset();
        router.dismiss(2);
        showAlert('Profil anak dibuat', `${child.name} sudah ditambahkan. Yuk, cari shadow teacher yang cocok untuknya!`);
        return;
      }
      update('needs', { conditions, medicalRecordUri });
      await registerParent({ ...data, needs: { conditions, medicalRecordUri } });
      reset();
      router.dismissAll();
      router.replace('/beranda');
      if (wantConsult) router.push('/konsultasi');
    } catch (e) {
      showAlert(adding ? 'Profil anak belum tersimpan' : 'Pendaftaran belum berhasil', errorMessage(e));
    } finally {
      setSaving(false);
    }
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
        <FieldError message={error} />
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Belum tahu kondisi pasti anak kamu? <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        {adding ? (
          <PrimaryButton
            title="Konsultasi ke Psikolog"
            leadingIcon="heart"
            color={Colors.red}
            onPress={() => router.push('/konsultasi')}
          />
        ) : (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: wantConsult }}
            onPress={() => {
              setWantConsult((w) => !w);
              setError(undefined);
            }}
            style={[styles.consult, wantConsult && styles.consultOn]}>
            <View style={[styles.consultIcon, wantConsult && styles.consultIconOn]}>
              <Feather name={wantConsult ? 'check' : 'heart'} size={18} color={wantConsult ? '#FFFFFF' : Colors.red} />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.consultTitle}>Konsultasi ke Psikolog</AppText>
              <AppText variant="caption">
                {wantConsult
                  ? 'Setelah akun dibuat, kamu langsung diarahkan untuk memilih psikolog.'
                  : 'Ketuk bila ingin konsultasi dulu. Kondisi anak boleh dikosongkan.'}
              </AppText>
            </View>
          </Pressable>
        )}
      </View>

      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          Rekam Medis <AppText style={styles.hint}>(opsional)</AppText>
        </AppText>
        <UploadBox
          title="Ketuk untuk unggah rekam medis"
          icon="upload-cloud"
          accept="document"
          value={medicalRecordUri}
          onChange={setMedicalRecordUri}
        />
      </View>

      <PrimaryButton
        title={saving ? 'Menyimpan…' : wantConsult ? 'Selesai & Pilih Psikolog' : 'Selesai'}
        icon="check-circle"
        disabled={saving}
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
  flex: {
    flex: 1,
  },
  consult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.redSoft,
  },
  consultOn: {
    borderColor: Colors.red,
    backgroundColor: Colors.redSoft,
  },
  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultIconOn: {
    backgroundColor: Colors.red,
  },
  consultTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
