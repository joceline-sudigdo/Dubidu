import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { StarInput } from '@/components/parent/stars';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { dailyActivities, markSessionReported, students, teacherSessions } from '@/data/teacher';
import { api, errorMessage, uploadFile } from '@/lib/api';
import { showAlert } from '@/lib/dialog';

export default function LaporanHarianScreen() {
  const params = useLocalSearchParams<{ student?: string; session?: string; sessionId?: string }>();
  const student = students.find((s) => s.id === params.student) ?? students[0];
  // sesi yang dilaporkan: dari jadwal, atau sesi terdekat murid ini yang laporannya belum dibuat
  const target =
    teacherSessions.find((s) => s.id && s.id === params.sessionId) ??
    teacherSessions
      .filter((s) => s.student === student?.id && !s.reportDone && s.date <= new Date().toISOString().slice(0, 10))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  const session = String(target?.number ?? params.session ?? '-');
  const [sending, setSending] = useState(false);

  const [activities, setActivities] = useState<string[]>(['Motorik Halus']);
  const [scores, setScores] = useState({ Fokus: 4, Komunikasi: 3, 'Regulasi Diri': 5 });
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const toggle = (a: string) => setActivities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  const submit = async () => {
    if (!target?.id) {
      showAlert('Belum ada sesi untuk dilaporkan', 'Laporan bisa dikirim untuk sesi yang sudah berlangsung di tab Jadwal.');
      return;
    }
    if (note.trim().length < 10) {
      showAlert('Catatan terlalu singkat', 'Ceritakan momen penting hari ini minimal 10 karakter.');
      return;
    }
    setSending(true);
    try {
      const photos = photo ? [{ url: await uploadFile(photo, 'laporan'), caption: activities.join(', ') }] : [];
      const lowest = Object.entries(scores).filter(([, v]) => v <= 2).map(([k]) => k);
      const saved = await api<{ id: string }>(`/sessions/${target.id}/report`, {
        body: {
          dailyNote: note.trim(),
          achievement: activities.length ? `Aktivitas: ${activities.join(', ')}` : undefined,
          improved: Object.entries(scores).filter(([, v]) => v >= 4).map(([k]) => k),
          attention: lowest,
          needsAttention: lowest.length > 0,
          scores: Object.entries(scores).map(([aspect, value]) => ({ aspect, value })),
          photos,
        },
      });
      markSessionReported(target.id, saved.id);
      showAlert('Laporan terkirim', `Laporan sesi ke-${session} ${student.name} sudah dikirim ke ${student.parent}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      showAlert('Laporan belum terkirim', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (!student) {
    return (
      <Screen header={<ScreenHeader title="Laporan Harian" />} edges={['top', 'bottom']}>
        <AppText variant="body">Belum ada anak dampingan untuk dilaporkan.</AppText>
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title="Laporan Harian" />} edges={['top', 'bottom']}>
      <View style={[styles.banner, Shadow.clay]}>
        <View style={styles.flex}>
          <AppText style={styles.bannerTitle}>
            {student.name} · Sesi ke-{session}
          </AppText>
          <AppText style={styles.bannerSub}>Tenggat: hari ini, 23:59</AppText>
        </View>
        <View style={styles.bannerBadge}>
          <AppText style={styles.bannerBadgeText}>{session}</AppText>
        </View>
      </View>

      <SectionHeader title="Aktivitas Hari Ini" />
      <View style={styles.wrap}>
        {dailyActivities.map((a) => (
          <Pill
            key={a}
            label={a}
            size="md"
            tone="blue"
            solid={activities.includes(a)}
            onPress={() => toggle(a)}
            style={!activities.includes(a) && styles.white}
          />
        ))}
      </View>

      <SectionHeader title="Penilaian" />
      <ClayCard style={styles.scores}>
        {(Object.keys(scores) as (keyof typeof scores)[]).map((k) => (
          <View key={k} style={styles.scoreRow}>
            <AppText style={styles.scoreLabel}>{k}</AppText>
            <StarInput value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
          </View>
        ))}
      </ClayCard>

      <SectionHeader title="Catatan Tambahan" />
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Ceritakan momen penting hari ini..."
        placeholderTextColor={Colors.placeholder}
        style={styles.input}
      />

      <AppText variant="label">
        Dokumentasi <AppText style={styles.hint}>(opsional)</AppText>
      </AppText>
      <UploadBox title="Ketuk untuk unggah foto kegiatan" icon="camera" value={photo} onChange={setPhoto} />

      <PrimaryButton
        title={sending ? 'Mengirim…' : 'Kirim Laporan'}
        disabled={activities.length === 0 || sending}
        onPress={submit}
      />
      <SecureNote />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.red,
    borderRadius: Radius.lg,
    padding: 22,
  },
  bannerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  bannerSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.red,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  scores: {
    gap: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  input: {
    minHeight: 130,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
  },
});
