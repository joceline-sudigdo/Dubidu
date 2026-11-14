import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { teacherProfile } from '@/data/teacher';
import { SKILL_LABELS, type Skill } from '@/data/teachers';
import { api, errorMessage } from '@/lib/api';
import { showAlert } from '@/lib/dialog';

// Penilaian diri level keahlian (0–100) per bidang. Dipakai untuk matching dan dicek admin saat verifikasi.

const STEP = 5;
const SKILLS = Object.keys(SKILL_LABELS) as Skill[];

export function SkillEditor() {
  const [levels, setLevels] = useState<Record<Skill, number>>({ ...teacherProfile.skills });
  const [saving, setSaving] = useState(false);
  const changed = SKILLS.some((s) => levels[s] !== teacherProfile.skills[s]);
  const empty = SKILLS.every((s) => !teacherProfile.skills[s]);

  const bump = (skill: Skill, delta: number) =>
    setLevels((l) => ({ ...l, [skill]: Math.max(0, Math.min(100, l[skill] + delta)) }));

  const save = async () => {
    setSaving(true);
    try {
      await api('/teachers/me', { method: 'PATCH', body: { skills: levels } });
      Object.assign(teacherProfile.skills, levels);
      showAlert('Level keahlian tersimpan', 'Admin akan mengecek level ini saat verifikasi profilmu.');
    } catch (e) {
      showAlert('Level keahlian belum tersimpan', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClayCard style={styles.card}>
      <AppText variant="caption">
        {empty
          ? 'Wajib diisi sebelum profilmu bisa diverifikasi. Nilai 0 = belum berpengalaman, 100 = sangat ahli.'
          : 'Nilai 0 = belum berpengalaman, 100 = sangat ahli. Dipakai untuk mencocokkanmu dengan anak.'}
      </AppText>
      {SKILLS.map((skill) => (
        <View key={skill} style={styles.row}>
          <View style={styles.flex}>
            <AppText style={styles.label}>{SKILL_LABELS[skill]}</AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${levels[skill]}%` }]} />
            </View>
          </View>
          <Pressable accessibilityLabel={`Kurangi ${SKILL_LABELS[skill]}`} hitSlop={6} onPress={() => bump(skill, -STEP)} style={styles.step}>
            <Feather name="minus" size={16} color={Colors.primary} />
          </Pressable>
          <AppText style={styles.value}>{levels[skill]}</AppText>
          <Pressable accessibilityLabel={`Tambah ${SKILL_LABELS[skill]}`} hitSlop={6} onPress={() => bump(skill, STEP)} style={styles.step}>
            <Feather name="plus" size={16} color={Colors.primary} />
          </Pressable>
        </View>
      ))}
      <PrimaryButton title={saving ? 'Menyimpan…' : 'Simpan Level Keahlian'} icon="check" disabled={!changed || saving} onPress={save} />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  track: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  value: {
    width: 32,
    textAlign: 'center',
    fontFamily: Fonts.heading,
    color: Colors.text,
  },
});
