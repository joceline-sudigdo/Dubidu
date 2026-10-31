import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import type { Tone } from '@/components/parent/tones';
import { VerifyBadge } from '@/components/psikolog/verify-badge';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { applicants, documentIssue, GENERAL_ISSUES, type VerifyStatus } from '@/data/psychologist';
import { comingSoon, showAlert, showPrompt } from '@/lib/dialog';
import { decideApplicant, interviewOf, resultOf, scheduleInterview, usePsikolog } from '@/lib/psikolog-store';

const SKILL_TONES: Tone[] = ['red', 'blue', 'green'];

export default function TinjauScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = applicants.find((x) => x.id === id) ?? applicants[0];
  const store = usePsikolog();
  const result = resultOf(store, a);
  const interview = interviewOf(store, a);
  const missing = a.documents.filter((d) => !d.uploaded).length;
  // dokumen yang belum diunggah otomatis ditandai sebagai kekurangan
  const [issues, setIssues] = useState<string[]>(
    result?.issues ?? a.documents.filter((d) => !d.uploaded).map(documentIssue)
  );
  const [note, setNote] = useState(result?.note ?? '');
  const issueOptions = [...a.documents.map(documentIssue), ...GENERAL_ISSUES];

  const toggleIssue = (issue: string) =>
    setIssues((list) => (list.includes(issue) ? list.filter((x) => x !== issue) : [...list, issue]));

  const decide = (status: VerifyStatus, title: string, message: string, done: string) =>
    showAlert(title, message, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Kirim',
        style: status === 'rejected' ? 'destructive' : 'default',
        onPress: () => {
          decideApplicant(a.id, { status, issues, note: note.trim() });
          showAlert(done, undefined, [{ text: 'OK', onPress: () => router.back() }]);
        },
      },
    ]);

  const verify = () =>
    decide(
      'verified',
      `Verifikasi ${a.name}?`,
      issues.length
        ? `${a.name} akan tampil sebagai Verified dan menerima ${issues.length} catatan perbaikan darimu.`
        : `${a.name} akan tampil sebagai shadow teacher Verified untuk orang tua.`,
      'Verifikasi berhasil'
    );

  const requestRevision = () => {
    if (issues.length === 0) {
      showAlert('Pilih kekurangannya', 'Tandai minimal satu catatan supaya pendaftar tahu apa yang perlu diperbaiki.');
      return;
    }
    decide(
      'revision',
      'Minta perbaikan?',
      `${a.name} belum terverifikasi sampai memperbaiki ${issues.length} catatan darimu.`,
      'Peringatan terkirim'
    );
  };

  const reject = () => {
    if (!note.trim()) {
      showAlert('Catatan wajib diisi', 'Tulis alasan penolakan supaya pendaftar tahu apa yang perlu diperbaiki.');
      return;
    }
    decide('rejected', 'Tolak pengajuan?', `Catatanmu akan dikirim ke ${a.name}.`, 'Pengajuan ditolak');
  };

  const editInterview = () =>
    showPrompt({
      title: 'Jadwalkan interview',
      value: interview ?? '',
      placeholder: 'Contoh: Senin, 12 Okt · 10:00 (online)',
      onSubmit: (v) => {
        if (!v.trim()) return;
        scheduleInterview(a.id, v.trim());
        showAlert('Jadwal tersimpan');
      },
    });

  return (
    <Screen header={<ScreenHeader title="Tinjau Shadow Teacher" />} edges={['top', 'bottom']}>
      <View style={styles.heroWrap}>
        <ClayCard tone="blue" style={styles.hero}>
          <AppText style={styles.name}>{a.name}</AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            {a.education}
          </AppText>
          <View style={styles.wrap}>
            {a.skills.map((s, i) => (
              <Pill key={s} label={s} tone={SKILL_TONES[i % SKILL_TONES.length]} solid />
            ))}
            <Pill label={a.experience} tone="gray" style={styles.white} />
          </View>
          <AppText variant="body">{a.about}</AppText>
        </ClayCard>
        <View style={styles.avatar}>
          <Avatar name={a.name} size={84} ring="#FFFFFF" />
        </View>
      </View>

      <SectionHeader
        title="Dokumen"
        right={
          <AppText variant="caption" color={missing ? Colors.red : Colors.green}>
            {missing ? `${missing} belum diunggah` : 'Lengkap'}
          </AppText>
        }
      />
      <ClayCard style={styles.list}>
        {a.documents.map((d, i) => {
          const flagged = issues.includes(documentIssue(d));
          return (
            <Pressable
              key={d.label}
              onPress={() => (d.uploaded ? comingSoon('Pratinjau dokumen') : showAlert(d.label, 'Dokumen ini belum diunggah pendaftar.'))}
              style={[styles.docRow, i < a.documents.length - 1 && styles.border]}>
              <View style={[styles.docIcon, { backgroundColor: d.uploaded ? Colors.green : Colors.disabled }]}>
                <Feather name={d.uploaded ? 'check' : 'clock'} size={18} color="#FFFFFF" />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.bold}>{d.label}</AppText>
                <AppText variant="caption" color={d.uploaded ? Colors.textSecondary : Colors.red}>
                  {d.uploaded ? 'Terunggah' : 'Belum diunggah'}
                </AppText>
              </View>
              {!result && (
                <Pressable
                  accessibilityLabel={flagged ? `Batalkan catatan ${d.label}` : `Tandai ${d.label} bermasalah`}
                  hitSlop={8}
                  onPress={() => toggleIssue(documentIssue(d))}
                  style={[styles.flag, flagged && styles.flagOn]}>
                  <Feather name="flag" size={15} color={flagged ? '#FFFFFF' : Colors.textSecondary} />
                </Pressable>
              )}
              <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
            </Pressable>
          );
        })}
      </ClayCard>

      <SectionHeader title="Interview" />
      <ClayCard onPress={result ? undefined : editInterview} style={styles.interview}>
        <View style={[styles.docIcon, styles.calendar]}>
          <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.bold}>Jadwal</AppText>
          <AppText variant="body" color={interview ? Colors.textSecondary : Colors.red}>
            {interview ?? 'Belum dijadwalkan'}
          </AppText>
        </View>
        {!result && (
          <AppText variant="link" style={styles.small}>
            {interview ? 'Ubah' : 'Atur'}
          </AppText>
        )}
      </ClayCard>

      {result ? (
        <>
          <SectionHeader title="Hasil Verifikasi" />
          <ClayCard style={styles.result}>
            <VerifyBadge result={result} />
            {result.issues.map((issue) => (
              <View key={issue} style={styles.issueRow}>
                <Feather name="alert-circle" size={16} color={Colors.yellowDark} />
                <AppText variant="body" style={styles.flex}>
                  {issue}
                </AppText>
              </View>
            ))}
            {!!result.note && (
              <AppText variant="body" color={Colors.textSecondary}>
                “{result.note}”
              </AppText>
            )}
          </ClayCard>
        </>
      ) : (
        <>
          <SectionHeader
            title="Catatan Kekurangan"
            right={
              <AppText variant="caption" color={issues.length ? Colors.yellowDark : Colors.green}>
                {issues.length ? `${issues.length} ditandai` : 'Tidak ada'}
              </AppText>
            }
          />
          <AppText variant="caption">
            Tandai yang masih kurang. Pendaftar akan menerima peringatan ini supaya bisa melengkapinya.
          </AppText>
          <View style={styles.wrap}>
            {issueOptions.map((issue) => {
              const on = issues.includes(issue);
              return (
                <Pill
                  key={issue}
                  label={issue}
                  tone={on ? 'yellow' : 'gray'}
                  size="md"
                  icon={on ? 'alert-circle' : 'plus'}
                  onPress={() => toggleIssue(issue)}
                  style={!on && styles.white}
                />
              );
            })}
          </View>

          <AppText variant="label" style={styles.noteLabel}>
            Catatan untuk pendaftar <AppText style={styles.hint}>(wajib kalau menolak)</AppText>
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Contoh: komunikatif, paham strategi visual; perlu pelatihan sensori integrasi."
            placeholderTextColor={Colors.placeholder}
            style={styles.input}
          />

          <PrimaryButton
            title={issues.length ? 'Verifikasi + Kirim Catatan' : 'Verifikasi'}
            leadingIcon="check-circle"
            onPress={verify}
          />
          <Pressable onPress={requestRevision} style={[styles.outline, styles.warn, Shadow.soft]}>
            <Feather name="alert-triangle" size={18} color={Colors.yellowDark} />
            <AppText style={[styles.outlineText, { color: Colors.yellowDark }]}>Minta Perbaikan Dulu</AppText>
          </Pressable>
          <Pressable onPress={reject} hitSlop={8} style={styles.rejectLink}>
            <AppText style={styles.rejectText}>Tolak Pengajuan</AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.text,
  },
  small: {
    fontSize: 14,
  },
  heroWrap: {
    paddingTop: 42,
  },
  hero: {
    paddingTop: 50,
    gap: 8,
  },
  avatar: {
    position: 'absolute',
    top: 0,
    left: 20,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 34,
  },
  list: {
    paddingVertical: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  interview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  result: {
    gap: 12,
    alignItems: 'flex-start',
  },
  noteLabel: {
    marginTop: 8,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    minHeight: 110,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  flag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagOn: {
    backgroundColor: Colors.yellowDark,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
  },
  warn: {
    flexDirection: 'row',
    gap: 8,
    borderColor: '#F6E2AE',
    backgroundColor: Colors.yellowSoft,
  },
  rejectLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  rejectText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.red,
  },
  outline: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F3CFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.red,
  },
});
