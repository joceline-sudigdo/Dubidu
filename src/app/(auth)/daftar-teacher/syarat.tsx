import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ClayCard } from '@/components/parent/clay-card';
import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { teacherTerms } from '@/data/legal';

// halaman wajib sebelum shadow teacher mengisi data pendaftaran:
// baca sampai akhir → centang persetujuan → lanjut ke langkah 1 (identitas)
export default function SyaratTeacherScreen() {
  const [readAll, setReadAll] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <FormScreen title={teacherTerms.title} subtitle={teacherTerms.intro} onReachEnd={() => setReadAll(true)}>
      <AppText variant="caption">{teacherTerms.updated}</AppText>

      <ClayCard style={styles.card}>
        {teacherTerms.sections.map((s, i) => {
          // poin larangan & hak pemberhentian disorot supaya tidak terlewat
          const important = i === 1 || i === 2;
          return (
            <View key={s.h} style={[styles.section, i < teacherTerms.sections.length - 1 && styles.divider]}>
              <View style={styles.headRow}>
                {important && <Feather name="alert-triangle" size={16} color={Colors.red} />}
                <AppText style={[styles.h, important && { color: Colors.red }]}>{s.h}</AppText>
              </View>
              <AppText style={styles.p}>{s.p}</AppText>
            </View>
          );
        })}
      </ClayCard>

      <AppText variant="caption" style={styles.center}>
        Ketentuan umum berlaku juga:{' '}
        <AppText style={styles.link} onPress={() => router.push({ pathname: '/legal/[type]', params: { type: 'terms' } })}>
          Syarat & Ketentuan
        </AppText>{' '}
        dan{' '}
        <AppText style={styles.link} onPress={() => router.push({ pathname: '/legal/[type]', params: { type: 'privacy' } })}>
          Kebijakan Privasi
        </AppText>{' '}
        Dubidu.
      </AppText>

      {readAll ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed((a) => !a)}
            style={[styles.agree, agreed && styles.agreeOn]}>
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed && <Feather name="check" size={16} color="#FFFFFF" />}
            </View>
            <AppText style={styles.agreeText}>
              Saya sudah membaca dan menyetujui Syarat & Ketentuan Shadow Teacher, termasuk hak Dubidu dan lembaga untuk
              memberi peringatan dan mencabut penugasan bila saya terbukti melanggar.
            </AppText>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.hint}>
          <Feather name="chevrons-down" size={16} color={Colors.primary} />
          <AppText variant="caption" color={Colors.primary}>
            Gulir sampai akhir untuk melanjutkan
          </AppText>
        </View>
      )}

      <PrimaryButton
        title="Setuju & Lanjut Daftar"
        icon="arrow-right"
        disabled={!readAll || !agreed}
        onPress={() => router.push({ pathname: '/parent/identity', params: { role: 'teacher' } })}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  card: {
    paddingVertical: 4,
  },
  section: {
    paddingVertical: 14,
    gap: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  h: {
    flexShrink: 1,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  p: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  agree: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  agreeOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  agreeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
  },
});
