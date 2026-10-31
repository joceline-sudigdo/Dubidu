import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import type { Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { consultations, MODE_LABEL, RECOMMENDATIONS } from '@/data/psychologist';
import { showAlert } from '@/lib/dialog';
import { finishSession, reportOf, sendReport, statusOf, usePsikolog } from '@/lib/psikolog-store';

const NEED_TONES: Tone[] = ['blue', 'red', 'green'];

export default function KonsultasiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = consultations.find((x) => x.id === id) ?? consultations[0];
  const store = usePsikolog();
  const status = statusOf(store, c);
  const report = reportOf(store, c);
  const [note, setNote] = useState('');
  const [recs, setRecs] = useState<string[]>([]);

  const toggleRec = (r: string) => setRecs((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]));

  const openChat = () => c.chatId && router.push({ pathname: '/chat/[id]', params: { id: c.chatId } });

  const start = () => {
    if (c.mode === 'onsite') {
      showAlert('Tandai sesi selesai?', `Sesi tatap muka dengan ${c.child} akan ditandai selesai.`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Selesai', onPress: () => finishSession(c.id) },
      ]);
      return;
    }
    router.push({ pathname: '/psikolog/panggilan/[id]', params: { id: c.id } });
  };

  const submit = () => {
    sendReport(c, { note: note.trim(), recommendations: recs });
    showAlert('Laporan terkirim', `Hasil observasi ${c.child} sudah dikirim ke ${c.parent}.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen header={<ScreenHeader title="Detail Konsultasi" />} edges={['top', 'bottom']}>
      <ClayCard tone="blue" style={styles.profile}>
        <BearAvatar gender={c.gender} size={84} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <AppText style={styles.name}>{c.child}</AppText>
            <Pill label={c.parent} tone="gray" style={styles.white} />
            <Pill label={`${c.age} th`} tone="gray" style={styles.white} />
          </View>
          <View style={styles.wrap}>
            {c.needs.map((n, i) => (
              <Pill key={n} label={n} tone={NEED_TONES[i % NEED_TONES.length]} solid={i > 0} size="md" />
            ))}
          </View>
        </View>
      </ClayCard>

      <SectionHeader title="Keluhan Orang Tua" />
      <ClayCard>
        <AppText style={styles.quote}>“{c.complaint}”</AppText>
      </ClayCard>

      <SectionHeader title="Jadwal" />
      <ClayCard style={styles.list}>
        <InfoRow icon="calendar" label="Tanggal" value={c.day} />
        <InfoRow icon="clock" label="Jam" value={c.time} />
        <InfoRow
          icon={c.mode === 'onsite' ? 'map-pin' : c.mode === 'video' ? 'video' : 'phone'}
          label={c.mode === 'onsite' ? 'Tatap muka' : `${MODE_LABEL[c.mode]} di aplikasi`}
          value={c.place ?? 'Online'}
          last
        />
      </ClayCard>

      {c.companion && (
        <>
          <SectionHeader title="Riwayat Pendampingan" />
          <ClayCard style={styles.companion}>
            <Pill label={`Didampingi ${c.companion.teacher} · ${c.companion.sessions} sesi`} tone="blue" size="md" />
            <AppText variant="body" color={Colors.textSecondary}>
              Laporan terakhir: {c.companion.lastReport}
            </AppText>
            <Pressable
              onPress={() => router.push({ pathname: '/report-card/[id]', params: { id: 's1' } })}
              hitSlop={8}>
              <AppText variant="link">Lihat laporan sesi terakhir</AppText>
            </Pressable>
          </ClayCard>
        </>
      )}

      {status === 'report' && (
        <>
          <SectionHeader title="Hasil Observasi" />
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Tulis temuan utama dan saran untuk orang tua dengan bahasa yang mudah dipahami."
            placeholderTextColor={Colors.placeholder}
            style={styles.input}
          />
          <SectionHeader title="Rekomendasi" />
          <View style={styles.wrap}>
            {RECOMMENDATIONS.map((r) => (
              <ChoiceChip key={r} label={r} size="tag" selected={recs.includes(r)} onPress={() => toggleRec(r)} />
            ))}
          </View>
          <PrimaryButton
            title="Kirim ke Orang Tua"
            leadingIcon="send"
            disabled={note.trim().length === 0}
            onPress={submit}
          />
        </>
      )}

      {status === 'done' && report && (
        <>
          <SectionHeader title="Hasil Observasi" right={<Pill label="Terkirim" tone="green" icon="check" />} />
          <ClayCard style={styles.companion}>
            <AppText variant="body">{report.note}</AppText>
            {report.recommendations.length > 0 && (
              <View style={styles.wrap}>
                {report.recommendations.map((r) => (
                  <Pill key={r} label={r} tone="blue" />
                ))}
              </View>
            )}
          </ClayCard>
        </>
      )}

      {status === 'scheduled' && (
        <PrimaryButton
          title={c.mode === 'onsite' ? 'Tandai Sesi Selesai' : `Mulai ${MODE_LABEL[c.mode]}`}
          leadingIcon={c.mode === 'onsite' ? 'check-circle' : c.mode === 'video' ? 'video' : 'phone'}
          onPress={start}
        />
      )}
      {status !== 'report' && c.chatId && (
        <Pressable onPress={openChat} style={[styles.outline, Shadow.soft]}>
          <Feather name="message-circle" size={20} color={Colors.primary} />
          <AppText style={styles.outlineText}>Chat Orang Tua</AppText>
        </Pressable>
      )}
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={18} color={Colors.primary} />
      </View>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText variant="body" color={Colors.textSecondary} style={styles.rowValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 10,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
  },
  quote: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 25,
    color: Colors.text,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  rowValue: {
    maxWidth: '50%',
    textAlign: 'right',
  },
  companion: {
    gap: 10,
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
  outline: {
    height: 56,
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.blueMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
});
