import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { Tones, type Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { AREA_STATUS, type ObservationReport, type RecKind } from '@/data/observations';
import { addMessage, useChatThreads } from '@/lib/chat-store';
import { showActionSheet, showAlert } from '@/lib/dialog';
import { markObservationRead, useObservations } from '@/lib/observation-store';
import { downloadPdf } from '@/lib/pdf';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// tiap jenis rekomendasi: ikon, warna, dan tombol lanjutan (kalau ada)
const REC: Record<RecKind, { icon: IconName; tone: Tone; label: string; action?: { title: string; go: () => void } }> = {
  rumah: { icon: 'home-heart', tone: 'green', label: 'Di rumah' },
  sekolah: { icon: 'school-outline', tone: 'blue', label: 'Di sekolah' },
  teacher: {
    icon: 'account-heart-outline',
    tone: 'blue',
    label: 'Shadow teacher',
    action: { title: 'Cari shadow teacher', go: () => router.push('/cari-teacher') },
  },
  terapi: {
    icon: 'hand-heart-outline',
    tone: 'red',
    label: 'Terapi',
    action: { title: 'Jadwalkan konsultasi', go: () => router.push('/konsultasi') },
  },
  asesmen: {
    icon: 'clipboard-search-outline',
    tone: 'yellow',
    label: 'Asesmen',
    action: { title: 'Jadwalkan asesmen', go: () => router.push('/konsultasi') },
  },
};

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function ObservasiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports } = useObservations();
  const threads = useChatThreads();
  const r = reports.find((x) => x.id === id);

  useEffect(() => {
    if (id) markObservationRead(id);
  }, [id]);

  if (!r) {
    return (
      <Screen header={<ScreenHeader title="Laporan Observasi" />}>
        <EmptyState title="Laporan tidak ditemukan" />
      </Screen>
    );
  }

  const exportPdf = () =>
    downloadPdf(`Laporan Observasi ${r.child}`, `${r.psychologist} · ${r.date} · ${r.mode}`, [
      { title: 'Keluhan awal', paragraphs: [r.complaint] },
      { title: 'Ringkasan psikolog', paragraphs: [r.summary] },
      ...(r.areas.length
        ? [{ title: 'Temuan per aspek', rows: r.areas.map((a) => [a.label, `${AREA_STATUS[a.status].label} · ${a.note}`] as [string, string]) }]
        : []),
      ...(r.strengths.length ? [{ title: 'Kekuatan anak', bullets: r.strengths }] : []),
      ...(r.concerns.length ? [{ title: 'Perlu perhatian', bullets: r.concerns }] : []),
      { title: 'Rekomendasi', bullets: r.recommendations.map((x) => (x.detail ? `${x.title}: ${x.detail}` : x.title)) },
      ...(r.nextStep ? [{ title: 'Langkah selanjutnya', paragraphs: [r.nextStep] }] : []),
    ]);

  // bagikan ringkasan ke shadow teacher lewat chat, supaya strategi di sekolah & rumah sama
  const teachers = threads.filter((t) => t.owner === 'parent' && t.role.toLowerCase().includes('teacher'));
  const share = () =>
    showActionSheet({
      title: 'Bagikan ke shadow teacher',
      options: teachers.map((t) => ({
        label: t.name.split(',')[0],
        icon: 'send',
        onPress: () => {
          addMessage(t.id, {
            id: `share-${Date.now()}`,
            from: 'me',
            type: 'text',
            text: `Kak, ini ringkasan hasil observasi psikolog untuk ${r.child} (${r.date}):\n${r.summary}\n\nRekomendasi: ${r.recommendations
              .map((x) => x.title)
              .join(', ')}.`,
            time: nowTime(),
            read: false,
          });
          showAlert('Laporan terkirim', `Ringkasan laporan sudah dikirim ke ${t.name.split(',')[0]}.`, [
            { text: 'Tutup', style: 'cancel' },
            { text: 'Buka chat', onPress: () => router.push({ pathname: '/chat/[id]', params: { id: t.id } }) },
          ]);
        },
      })),
    });

  return (
    <Screen
      header={<ScreenHeader title="Laporan Observasi" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Pressable onPress={exportPdf} style={[styles.secondary, Shadow.soft]}>
            <Feather name="download" size={18} color={Colors.primary} />
            <AppText style={styles.secondaryText}>Unduh PDF</AppText>
          </Pressable>
          <PrimaryButton title="Bagikan ke Teacher" leadingIcon="send" onPress={share} disabled={teachers.length === 0} style={styles.flex} />
        </View>
      }>
      <ClayCard tone="blue" style={styles.hero}>
        <View style={styles.heroTop}>
          <Avatar name={r.psychologist} size={56} ring="#FFFFFF" viewable />
          <View style={styles.flex}>
            <AppText style={styles.psyName}>{r.psychologist.split(',')[0]}</AppText>
            <AppText variant="caption" color={Colors.text}>
              {r.psychologistTitle}
            </AppText>
          </View>
          {r.chatId && (
            <Pressable
              accessibilityLabel="Chat psikolog"
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: r.chatId! } })}
              style={[styles.chatBtn, Shadow.soft]}>
              <ChatIcon size={20} color={Colors.primary} />
            </Pressable>
          )}
        </View>
        <View style={styles.metaWrap}>
          <Meta icon="account-child-outline" text={r.child} />
          <Meta icon="calendar-blank-outline" text={r.date} />
          <Meta icon="clock-outline" text={`${r.time} · ${r.duration}`} />
          <Meta icon="video-outline" text={r.mode} />
        </View>
      </ClayCard>

      <ClayCard style={styles.gap8}>
        <AppText style={styles.cardTitle}>Ringkasan psikolog</AppText>
        <View style={styles.quote}>
          <AppText style={styles.quoteText}>“{r.summary}”</AppText>
        </View>
      </ClayCard>

      <ClayCard tone="gray" style={styles.gap8}>
        <View style={styles.inline}>
          <Feather name="message-square" size={15} color={Colors.textSecondary} />
          <AppText style={styles.label}>Keluhan yang kamu sampaikan</AppText>
        </View>
        <AppText variant="caption" color={Colors.text}>
          {r.complaint}
        </AppText>
      </ClayCard>

      {r.areas.length > 0 && (
        <>
          <SectionHeader title="Temuan per aspek" />
          <ClayCard style={styles.areas}>
            {r.areas.map((a, i) => {
              const s = AREA_STATUS[a.status];
              return (
                <View key={a.label} style={[styles.area, i < r.areas.length - 1 && styles.divider]}>
                  <View style={styles.areaHead}>
                    <AppText style={styles.areaLabel}>{a.label}</AppText>
                    <Pill label={s.label} tone={s.tone} />
                  </View>
                  <AppText variant="caption" color={Colors.text}>
                    {a.note}
                  </AppText>
                </View>
              );
            })}
          </ClayCard>
        </>
      )}

      {(r.strengths.length > 0 || r.concerns.length > 0) && (
        <View style={styles.twoCol}>
          {r.strengths.length > 0 && <ListCard title="Kekuatan" icon="star-outline" tone="green" items={r.strengths} />}
          {r.concerns.length > 0 && <ListCard title="Perlu perhatian" icon="alert-circle-outline" tone="yellow" items={r.concerns} />}
        </View>
      )}

      <SectionHeader title="Rekomendasi" />
      {r.recommendations.map((rec) => {
        const k = REC[rec.kind];
        const t = Tones[k.tone];
        return (
          <ClayCard key={rec.title} style={styles.rec}>
            <View style={[styles.recIcon, { backgroundColor: t.bg }]}>
              <MaterialCommunityIcons name={k.icon} size={22} color={t.fg} />
            </View>
            <View style={styles.flex}>
              <AppText style={[styles.recKind, { color: t.fg }]}>{k.label.toUpperCase()}</AppText>
              <AppText style={styles.recTitle}>{rec.title}</AppText>
              {!!rec.detail && <AppText variant="caption">{rec.detail}</AppText>}
              {k.action && (
                <Pressable onPress={k.action.go} hitSlop={6} style={styles.recAction}>
                  <AppText variant="link" style={styles.small}>
                    {k.action.title}
                  </AppText>
                  <Feather name="arrow-right" size={14} color={Colors.primary} />
                </Pressable>
              )}
            </View>
          </ClayCard>
        );
      })}

      {r.nextStep && (
        <ClayCard tone="yellow" style={styles.next}>
          <MaterialCommunityIcons name="calendar-arrow-right" size={22} color={Colors.yellowDark} />
          <View style={styles.flex}>
            <AppText style={styles.label}>Langkah selanjutnya</AppText>
            <AppText variant="caption" color={Colors.text}>
              {r.nextStep}
            </AppText>
          </View>
        </ClayCard>
      )}

      <View style={styles.privacy}>
        <Feather name="lock" size={14} color={Colors.textSecondary} />
        <AppText variant="caption" style={styles.flex}>
          Laporan ini rahasia dan hanya bisa dilihat oleh kamu. Bagikan ke shadow teacher hanya bila kamu mengizinkan.
        </AppText>
      </View>
    </Screen>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <MaterialCommunityIcons name={icon} size={15} color={Colors.primaryDark} />
      <AppText style={styles.metaText}>{text}</AppText>
    </View>
  );
}

function ListCard({ title, icon, tone, items }: { title: string; icon: IconName; tone: Tone; items: ObservationReport['strengths'] }) {
  const t = Tones[tone];
  return (
    <ClayCard style={[styles.listCard, { backgroundColor: t.bg }]}>
      <View style={styles.inline}>
        <MaterialCommunityIcons name={icon} size={18} color={t.fg} />
        <AppText style={[styles.label, { color: t.fg }]}>{title}</AppText>
      </View>
      {items.map((it) => (
        <View key={it} style={styles.bullet}>
          <View style={[styles.dot, { backgroundColor: t.fg }]} />
          <AppText variant="caption" color={Colors.text} style={styles.flex}>
            {it}
          </AppText>
        </View>
      ))}
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gap8: {
    gap: 8,
  },
  small: {
    fontSize: 14,
  },
  hero: {
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  psyName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  cardTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 22,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
  },
  quoteText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  areas: {
    paddingVertical: 6,
  },
  area: {
    gap: 4,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  areaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  areaLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  twoCol: {
    gap: 12,
  },
  listCard: {
    gap: 8,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  rec: {
    flexDirection: 'row',
    gap: 12,
  },
  recIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recKind: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  recTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  recAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  next: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  privacy: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondary: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  secondaryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.primary,
  },
});
