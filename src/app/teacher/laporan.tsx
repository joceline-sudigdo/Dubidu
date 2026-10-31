import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ChildSwitcher } from '@/components/parent/child-switcher';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Segmented } from '@/components/parent/segmented';
import { StarInput, Stars } from '@/components/parent/stars';
import { Tones, type Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UploadBox } from '@/components/ui/upload-box';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { finalReportDraft, students, weeklyReportDraft } from '@/data/teacher';
import { showAlert } from '@/lib/dialog';

type FeatherName = ComponentProps<typeof Feather>['name'];

const done = (title: string, message: string) =>
  showAlert(title, message, [{ text: 'OK', onPress: () => router.back() }]);

export default function LaporanScreen() {
  const params = useLocalSearchParams<{ student?: string }>();
  const [student, setStudent] = useState(students.find((s) => s.id === params.student) ?? students[0]);
  const [mode, setMode] = useState<0 | 1>(0);

  return (
    <Screen header={<ScreenHeader title="Report Card" />} edges={['top', 'bottom']}>
      <ChildSwitcher items={students} value={student} onChange={setStudent} />
      <Segmented labels={['Laporan Mingguan', 'Pendampingan Selesai']} value={mode} onChange={setMode} />
      {mode === 0 ? <WeeklyForm key={student.id} name={student.name} /> : <FinalForm key={student.id} name={student.name} />}
    </Screen>
  );
}

function WeeklyForm({ name }: { name: string }) {
  const d = weeklyReportDraft;
  const [observation, setObservation] = useState(d.observation);
  const [improved, setImproved] = useState(d.improved);
  const [summary, setSummary] = useState(d.improvedSummary);
  const [attention, setAttention] = useState(d.attention);
  const [tip, setTip] = useState(d.homeTip);
  const [scores, setScores] = useState(d.aspects.map((a) => a.value));
  const [photos, setPhotos] = useState<(string | null)[]>([null, null]);

  return (
    <>
      <SectionHeader title="Catatan Observasi" />
      <TextInput value={observation} onChangeText={setObservation} multiline style={styles.textarea} />

      <ChipEditor
        tone="green"
        icon="trending-up"
        title="Yang Meningkat"
        items={improved}
        onChange={setImproved}
        placeholder="Tambah keterampilan baru..."
        fieldLabel="Ringkasan singkat kemajuan:"
        fieldValue={summary}
        onFieldChange={setSummary}
      />
      <ChipEditor
        tone="red"
        icon="alert-triangle"
        title="Perlu Perhatian"
        items={attention}
        onChange={setAttention}
        placeholder="Tambah catatan tantangan..."
        fieldLabel="Tips untuk di rumah:"
        fieldValue={tip}
        onFieldChange={setTip}
      />

      <View>
        <AppText style={styles.sectionTitle}>Penilaian Aspek Perkembangan</AppText>
        <AppText variant="caption">Evaluasi holistik sesi minggu ini (Skala 1-5)</AppText>
      </View>
      {d.aspects.map((a, i) => (
        <ClayCard key={a.label} style={styles.aspect}>
          <View style={styles.aspectIcon}>
            <Feather name={a.icon as FeatherName} size={18} color={Colors.primary} />
          </View>
          <AppText style={styles.aspectLabel} numberOfLines={1}>
            {a.label}
          </AppText>
          <StarInput
            value={scores[i]}
            size={22}
            onChange={(v) => setScores((s) => s.map((x, j) => (j === i ? v : x)))}
          />
        </ClayCard>
      ))}

      <AppText variant="label">
        Dokumentasi Sesi <AppText style={styles.hint}>(opsional)</AppText>
      </AppText>
      <View style={styles.row}>
        {photos.map((p, i) => (
          <View key={i} style={styles.flex}>
            <UploadBox
              title="Ketuk untuk unggah foto"
              icon={i === 0 ? 'camera' : 'image'}
              value={p}
              onChange={(uri) => setPhotos((list) => list.map((x, j) => (j === i ? uri : x)))}
            />
          </View>
        ))}
      </View>

      <PrimaryButton
        title="Kirim Laporan"
        onPress={() => done('Laporan terkirim', `Laporan mingguan ${name} sudah dikirim ke orang tua.`)}
      />
    </>
  );
}

function FinalForm({ name }: { name: string }) {
  const d = finalReportDraft;
  const [summary, setSummary] = useState(d.summary);
  const [closing, setClosing] = useState(d.closing);
  const [recs, setRecs] = useState<string[]>(['Lanjutkan Sesi Rutin', 'Rujuk ke Psikolog']);
  const [recNote, setRecNote] = useState(d.recommendationNote);

  const toggleRec = (r: string) => setRecs((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]));

  return (
    <>
      <ClayCard tone="blue" style={styles.gap12}>
        <View style={styles.inline}>
          <View style={styles.medal}>
            <Feather name="award" size={22} color={Colors.primary} />
          </View>
          <AppText style={styles.highlight}>{d.highlight}</AppText>
        </View>
        <TextInput value={summary} onChangeText={setSummary} multiline style={[styles.textarea, styles.white]} />
      </ClayCard>

      <ClayCard style={styles.gap12}>
        <View style={styles.spaceBetween}>
          <AppText style={styles.cardTitle}>Perbandingan Sesi Awal vs Akhir</AppText>
          <Pill label={`${d.comparisons.length} Aspek`} tone="gray" />
        </View>
        {d.comparisons.map((c) => (
          <View key={c.label} style={styles.compare}>
            <View style={styles.spaceBetween}>
              <View style={styles.inline}>
                <View style={styles.compareIcon}>
                  <Feather name={c.icon as FeatherName} size={15} color="#FFFFFF" />
                </View>
                <AppText style={styles.compareLabel}>{c.label}</AppText>
              </View>
              <Pill label={`Meningkat (${c.change})`} tone="green" solid />
            </View>
            <View style={styles.spaceBetween}>
              <View style={styles.inline}>
                <AppText variant="caption">Sesi 1:</AppText>
                <Stars value={c.first} size={14} />
              </View>
              <Feather name="arrow-right" size={16} color={Colors.textSecondary} />
              <View style={styles.inline}>
                <AppText variant="caption">Sesi 12:</AppText>
                <Stars value={c.last} size={14} />
              </View>
            </View>
          </View>
        ))}
      </ClayCard>

      <ClayCard style={styles.gap10}>
        <AppText style={styles.cardTitle}>Catatan Penutup</AppText>
        <TextInput value={closing} onChangeText={setClosing} multiline style={styles.textarea} />
        <AppText variant="caption" style={styles.right}>
          Sentuh teks untuk mengedit sebelum finalisasi
        </AppText>
      </ClayCard>

      <ClayCard style={styles.gap12}>
        <View style={styles.spaceBetween}>
          <AppText style={styles.cardTitle}>Rekomendasi Lanjutan</AppText>
          <AppText variant="caption" color={Colors.primary}>
            Pilih satu atau lebih
          </AppText>
        </View>
        <View style={styles.wrap}>
          {d.recommendations.map((r) => {
            const active = recs.includes(r);
            const tone: Tone = r === 'Rujuk ke Psikolog' ? 'red' : 'blue';
            return (
              <Pill
                key={r}
                label={r}
                size="md"
                tone={tone}
                solid={active}
                icon={active ? 'check-circle' : 'circle'}
                onPress={() => toggleRec(r)}
                style={!active && styles.white}
              />
            );
          })}
        </View>
        <TextInput value={recNote} onChangeText={setRecNote} multiline style={styles.textarea} />
      </ClayCard>

      <PrimaryButton
        title="Buat Laporan Akhir"
        onPress={() => done('Laporan akhir dibuat', `Laporan akhir pendampingan ${name} sudah dikirim ke orang tua.`)}
      />
      <Pressable
        onPress={() => showAlert('Unduh PDF', 'Fitur ini akan segera tersedia.')}
        style={[styles.pdf, Shadow.soft]}>
        <Feather name="file-text" size={18} color={Colors.primary} />
        <AppText style={styles.pdfText}>Unduh PDF</AppText>
      </Pressable>
    </>
  );
}

function ChipEditor({
  tone,
  icon,
  title,
  items,
  onChange,
  placeholder,
  fieldLabel,
  fieldValue,
  onFieldChange,
}: {
  tone: 'green' | 'red';
  icon: FeatherName;
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  fieldLabel: string;
  fieldValue: string;
  onFieldChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const t = Tones[tone];
  const add = () => {
    const value = draft.trim();
    if (value && !items.includes(value)) onChange([...items, value]);
    setDraft('');
  };

  return (
    <ClayCard tone={tone} style={styles.gap10}>
      <View style={styles.inline}>
        <View style={[styles.compareIcon, { backgroundColor: t.solid }]}>
          <Feather name={icon} size={15} color="#FFFFFF" />
        </View>
        <AppText style={styles.cardTitle}>{title}</AppText>
      </View>
      <View style={styles.wrap}>
        {items.map((item) => (
          <Pill
            key={item}
            label={item}
            tone={tone}
            solid
            size="md"
            icon="x"
            iconRight
            onPress={() => onChange(items.filter((x) => x !== item))}
          />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          style={styles.addInput}
        />
        <Pill label="+ Tambah" tone={tone} solid size="md" onPress={add} />
      </View>
      <AppText variant="caption" color={Colors.text} style={styles.bold}>
        {fieldLabel}
      </AppText>
      <TextInput value={fieldValue} onChangeText={onFieldChange} style={styles.fieldInput} />
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gap10: {
    gap: 10,
  },
  gap12: {
    gap: 12,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  right: {
    textAlign: 'right',
  },
  hint: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  textarea: {
    minHeight: 100,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  fieldInput: {
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  aspect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  aspectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },
  medal: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    flex: 1,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  compare: {
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
  },
  compareIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    flexShrink: 1,
  },
  pdf: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  pdfText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
});
