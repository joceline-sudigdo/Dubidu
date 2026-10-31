import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import { Stars } from '@/components/parent/stars';
import { Tones } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { reportPhotos } from '@/data/images';
import { children, formatLongDate, reportDetail as d, sessionReports } from '@/data/parent';
import { showAlert } from '@/lib/dialog';
import { downloadPdf } from '@/lib/pdf';

// teks dengan **tebal** jadi warna biru tebal
function RichParagraph({ text }: { text: string }) {
  return (
    <AppText style={styles.paragraph}>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith('**') ? (
          <AppText key={i} style={styles.emphasis}>
            {part.slice(2, -2)}
          </AppText>
        ) : (
          part
        )
      )}
    </AppText>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const report = sessionReports.find((r) => r.id === id) ?? sessionReports[0];
  const child = children[0];
  const soon = (title: string) => showAlert(title, 'Fitur ini akan segera tersedia.');

  const exportPdf = () =>
    downloadPdf(`Report Card ${child.fullName}`, `Sesi ke-${report.number} · ${formatLongDate(report.date)} · ${report.teacher}`, [
      {
        title: 'Ringkasan Sesi',
        rows: [
          ['Anak', `${child.fullName} (${child.grade})`],
          ['Shadow Teacher', report.teacher],
          ['Waktu', report.time],
          ['Progres minggu ini', d.weeklyProgress],
        ],
      },
      { title: `Catatan dari ${report.teacher.split(' ')[0]}`, paragraphs: d.teacherNote.map((t) => t.replace(/\*\*/g, '')) },
      { title: 'Yang Meningkat', bullets: d.improved, paragraphs: [d.improvedNote] },
      { title: 'Perlu Perhatian', bullets: d.attention, paragraphs: [`Tips di rumah: ${d.homeTip}`] },
      {
        title: 'Penilaian Aspek Perkembangan',
        rows: d.aspects.map((a) => [a.label, `${a.value.toFixed(1)} / 5 · ${a.trend}`] as [string, string]),
      },
    ]);

  return (
    <Screen
      header={<ScreenHeader title="Report Card" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Pressable onPress={exportPdf} style={[styles.secondary, Shadow.soft]}>
            <Feather name="download" size={18} color={Colors.primary} />
            <AppText style={styles.secondaryText}>Unduh PDF</AppText>
          </Pressable>
          <PrimaryButton title="Beri Ulasan" leadingIcon="edit-3" onPress={() => soon('Beri ulasan')} style={styles.flex} />
        </View>
      }>
      <View style={styles.metaRow}>
        <Pill label="Laporan Resmi Terverifikasi" tone="green" icon="check-circle" />
        <View style={styles.metaTime}>
          <Feather name="clock" size={12} color={Colors.textSecondary} />
          <AppText variant="caption">{d.verifiedAt}</AppText>
        </View>
      </View>

      <ClayCard style={styles.gap12}>
        <View style={styles.childRow}>
          <Avatar name={child.fullName} size={60} ring="#FFFFFF" />
          <View style={styles.flex}>
            <View style={styles.inline}>
              <AppText style={styles.childName}>{child.fullName}</AppText>
              <Pill label={child.grade} tone="blue" />
            </View>
            <View style={styles.inline}>
              <Feather name="calendar" size={13} color={Colors.textSecondary} />
              <AppText variant="caption">
                Sesi ke-{report.number} · {formatLongDate(report.date).split(', ')[1]}
              </AppText>
            </View>
          </View>
        </View>
        <Pill label="Laporan Mingguan" tone="blue" solid />
        <View style={styles.teacherBox}>
          <Avatar name={report.teacher} size={38} />
          <View style={styles.flex}>
            <AppText variant="caption">Shadow Teacher</AppText>
            <View style={styles.inline}>
              <AppText style={styles.bold}>{report.teacher}</AppText>
              <MaterialCommunityIcons name="check-decagram" size={15} color={Colors.primary} />
            </View>
          </View>
        </View>
        <View style={styles.progressBox}>
          <MaterialCommunityIcons name="party-popper" size={26} color={Colors.green} />
          <View style={styles.flex}>
            <AppText style={styles.bold}>
              Progres {child.name} minggu ini: {d.weeklyProgress}
            </AppText>
            <AppText variant="caption">{d.weeklyNote}</AppText>
          </View>
        </View>
      </ClayCard>

      <ClayCard style={styles.gap12}>
        <View style={styles.inline}>
          <Avatar name={report.teacher} size={40} />
          <View style={styles.flex}>
            <AppText style={styles.cardTitle}>Catatan dari {report.teacher.split(' ')[0]}</AppText>
            <AppText variant="caption">Observasi Mendalam & Refleksi Perkembangan Sesi</AppText>
          </View>
        </View>
        {d.teacherNote.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </ClayCard>

      <ClayCard tone="green" style={styles.gap10}>
        <IconTitle icon="trending-up" tone="green" title="Yang Meningkat" />
        <View style={styles.wrap}>
          {d.improved.map((x) => (
            <Pill key={x} label={`✓ ${x}`} tone="green" style={styles.whitePill} />
          ))}
        </View>
        <AppText variant="caption" color={Colors.text}>
          {d.improvedNote}
        </AppText>
      </ClayCard>

      <ClayCard tone="red" style={styles.gap10}>
        <IconTitle icon="alert-circle" tone="red" title="Perlu Perhatian" />
        <View style={styles.wrap}>
          {d.attention.map((x) => (
            <Pill key={x} label={`• ${x}`} tone="red" style={styles.whitePill} />
          ))}
        </View>
        <View style={styles.tip}>
          <Feather name="zap" size={14} color={Colors.yellowDark} />
          <AppText variant="caption" color={Colors.text} style={styles.flex}>
            <AppText style={[styles.bold, { color: Colors.red, fontSize: 13 }]}>Tips di rumah: </AppText>
            {d.homeTip}
          </AppText>
        </View>
      </ClayCard>

      <View>
        <AppText style={styles.sectionTitle}>Penilaian Aspek Perkembangan</AppText>
        <AppText variant="caption">Evaluasi holistik sesi belajar ke-{report.number} (Skala 1 - 5)</AppText>
      </View>
      {d.aspects.map((a) => {
        const t = Tones[a.tone];
        return (
          <ClayCard key={a.label} style={styles.aspect}>
            <View style={[styles.aspectIcon, { backgroundColor: t.bg }]}>
              <MaterialCommunityIcons
                name={a.icon as ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={22}
                color={t.fg}
              />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.bold}>{a.label}</AppText>
              <View style={styles.inline}>
                <Stars value={a.value} size={14} />
                <AppText variant="caption">{a.value.toFixed(1)} / 5</AppText>
              </View>
            </View>
            <View style={styles.trend}>
              <Pill
                label={a.trend}
                tone={a.tone}
                icon={a.tone === 'green' ? 'trending-up' : a.tone === 'red' ? 'alert-circle' : 'minus'}
              />
              {!!a.delta && (
                <AppText style={[styles.delta, { color: t.fg }]}>{a.delta}</AppText>
              )}
            </View>
          </ClayCard>
        );
      })}

      <ClayCard style={styles.gap10}>
        <View style={styles.inline}>
          <IconTitle icon="activity" tone="green" title="Grafik Pertumbuhan" />
          <View style={styles.flex} />
          <Pill label={`(${d.growthDelta})`} tone="green" />
        </View>
        <View style={styles.growthRow}>
          <View>
            <AppText style={styles.growthScore}>
              Skor {d.growthScore} <AppText variant="caption">/ 5.0</AppText>
            </AppText>
            <AppText variant="caption">Rata-rata perkembangan holistik</AppText>
          </View>
          <Sparkline />
        </View>
        <Pressable onPress={() => soon('Growth timeline')} style={styles.inline}>
          <AppText variant="link" style={{ fontSize: 14 }}>
            Lihat Growth Timeline Lengkap
          </AppText>
          <Feather name="arrow-right" size={14} color={Colors.primary} />
        </Pressable>
      </ClayCard>

      <ClayCard style={styles.gap12}>
        <View style={styles.inline}>
          <IconTitle icon="camera" tone="blue" title="Dokumentasi Sesi" />
          <View style={styles.flex} />
          <AppText variant="caption">{d.photos.length} Foto Terlampir</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {d.photos.map((caption, i) => (
            <LinearGradient
              key={caption}
              colors={i % 2 ? [Colors.yellowSoft, '#FCE3A6'] : [Colors.blueSoft, Colors.blueMid]}
              style={styles.photo}>
              {reportPhotos[i] && <Image source={reportPhotos[i]} style={StyleSheet.absoluteFill} contentFit="cover" />}
              {!reportPhotos[i] && (
                <MaterialCommunityIcons name="image-outline" size={36} color={Colors.textSecondary} />
              )}
              <View style={styles.photoCaption}>
                <AppText style={styles.photoText} numberOfLines={2}>
                  {caption}
                </AppText>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      </ClayCard>
    </Screen>
  );
}

function IconTitle({
  icon,
  tone,
  title,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  tone: 'green' | 'red' | 'blue';
  title: string;
}) {
  const t = Tones[tone];
  return (
    <View style={styles.inline}>
      <View style={[styles.iconCircle, { backgroundColor: t.solid }]}>
        <Feather name={icon} size={15} color="#FFFFFF" />
      </View>
      <AppText style={styles.cardTitle}>{title}</AppText>
    </View>
  );
}

// grafik garis sederhana tanpa library tambahan
function Sparkline() {
  const points = [10, 14, 12, 18, 22, 26];
  const w = 110;
  const h = 34;
  const step = w / (points.length - 1);
  return (
    <View style={{ width: w, height: h }}>
      {points.slice(1).map((p, i) => {
        const x1 = i * step;
        const y1 = h - points[i];
        const x2 = (i + 1) * step;
        const y2 = h - p;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (x1 + x2) / 2 - len / 2,
              top: (y1 + y2) / 2 - 1.5,
              width: len,
              height: 3,
              borderRadius: 2,
              backgroundColor: Colors.green,
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap10: {
    gap: 10,
  },
  gap12: {
    gap: 12,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  childName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  teacherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    borderBottomWidth: 3,
    borderColor: Colors.blueMid,
    padding: 12,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.md,
    borderBottomWidth: 3,
    borderColor: '#CFE2D5',
    padding: 12,
  },
  cardTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
  },
  paragraph: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  emphasis: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primary,
  },
  whitePill: {
    backgroundColor: '#FFFFFF',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  aspect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  aspectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    alignItems: 'center',
    gap: 2,
  },
  delta: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  growthScore: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.green,
  },
  photos: {
    gap: 10,
  },
  photo: {
    width: 220,
    height: 150,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: 'rgba(34, 50, 74, 0.55)',
  },
  photoText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
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
    fontSize: 16,
    color: Colors.primary,
  },
});
