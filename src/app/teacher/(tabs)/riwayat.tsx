import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BearAvatar } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { Segmented } from '@/components/parent/segmented';
import type { Tone } from '@/components/parent/tones';
import { TagRow } from '@/components/parent/tag-row';
import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import {
  seekingChildren,
  students,
  teacherApplications,
  type ApplicationStatus,
  type Student,
} from '@/data/teacher';

const STATUS: Record<ApplicationStatus, { label: string; tone: Tone; solid: boolean }> = {
  accepted: { label: 'Diterima', tone: 'green', solid: true },
  pending: { label: 'Menunggu', tone: 'gray', solid: false },
  rejected: { label: 'Ditolak', tone: 'red', solid: true },
};

export default function TeacherRiwayatScreen() {
  const [tab, setTab] = useState<0 | 1>(0);
  const empty = tab === 0 ? students.length === 0 : teacherApplications.length === 0;

  return (
    <Screen fill={empty}>
      <TabHeader title="Riwayat" />
      <Segmented
        labels={[`Diasuh (${students.length})`, `Pengajuan (${teacherApplications.length})`]}
        value={tab}
        onChange={setTab}
      />

      {empty ? (
        <EmptyFill>
          <ClayCard>
            <EmptyState
              title={tab === 0 ? 'Belum ada anak yang diasuh' : 'Belum ada pengajuan'}
              subtitle={
                tab === 0
                  ? 'Anak dampinganmu muncul di sini setelah kontrak disetujui orang tua.'
                  : 'Ajukan diri ke anak yang membutuhkan pendamping, riwayatnya tampil di sini.'
              }
            />
          </ClayCard>
          <PrimaryButton title="Cari Anak" leadingIcon="search" onPress={() => router.push('/teacher/cari-anak')} />
        </EmptyFill>
      ) : tab === 0 ? (
        students.map((s) => <StudentCard key={s.id} student={s} />)
      ) : (
        <ClayCard style={styles.list}>
          {teacherApplications.map((a, i) => {
            const status = STATUS[a.status];
            const action =
              a.status === 'accepted'
                ? { label: 'Lihat di Sedang Diasuh', onPress: () => setTab(0) }
                : a.status === 'pending'
                  ? {
                      label: 'Lihat Profil Anak',
                      onPress: () => {
                        const child = seekingChildren.find((c) => c.initials === a.initials);
                        if (child) router.push({ pathname: '/teacher/anak/[id]', params: { id: child.id } });
                        else router.push('/teacher/cari-anak');
                      },
                    }
                  : { label: 'Cari Anak Lain', onPress: () => router.push('/teacher/cari-anak') };
            return (
              <View key={a.id} style={[styles.appRow, i < teacherApplications.length - 1 && styles.appBorder]}>
                <BearAvatar gender={a.gender} size={56} />
                <View style={styles.flex}>
                  <View style={styles.appTop}>
                    <AppText style={styles.appName} numberOfLines={1}>
                      {a.initials}
                      {a.age > 0 ? ` · ${a.age} tahun` : ''}
                    </AppText>
                    <Pill inRow label={status.label} tone={status.tone} solid={status.solid} size="md" />
                  </View>
                  <AppText variant="caption">Diajukan {a.date}</AppText>
                  <Pressable onPress={action.onPress} style={[styles.link, styles.appLink]}>
                    <AppText variant="link" style={styles.appLinkText}>
                      {action.label}
                    </AppText>
                    <Feather name="arrow-right" size={15} color={Colors.primary} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ClayCard>
      )}
    </Screen>
  );
}

function StudentCard({ student }: { student: Student }) {
  const progress = student.total > 0 ? Math.min(1, student.done / student.total) : 0;
  const percent = Math.round(progress * 1000) / 10;

  return (
    <ClayCard style={styles.card}>
      <View style={styles.top}>
        <BearAvatar gender={student.gender} size={72} online />
        <View style={styles.flex}>
          <AppText style={styles.name}>
            {student.name}
            {student.age > 0 ? ` · ${student.age} tahun` : ''}
          </AppText>
          <View style={styles.tags}>
            <TagRow tags={student.tags} solid stacked />
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <InfoRow icon="users" label="Ortu: " value={student.parent} />
        <InfoRow icon="calendar" label="Sesi berikutnya: " value={student.nextSession} />
        <InfoRow
          icon="check-circle"
          label=""
          value={`${student.done} dari ${student.total} sesi`}
          suffix={` selesai (${student.phase})`}
        />
      </View>

      <View style={styles.progressHead}>
        <AppText variant="body" color={Colors.textSecondary}>
          Progres Pendampingan
        </AppText>
        <AppText style={styles.percent}>{percent}%</AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`Chat dengan ${student.parent}`}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: student.chatId } })}
          style={[styles.chatBtn, Shadow.soft]}>
          <ChatIcon size={24} color={Colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/kontrak/[id]', params: { id: student.id } })}
          style={styles.link}>
          <AppText variant="link">Lihat Detail Kontrak</AppText>
          <Feather name="arrow-right" size={18} color={Colors.primary} />
        </Pressable>
      </View>
    </ClayCard>
  );
}

function InfoRow({
  icon,
  label,
  value,
  suffix,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={15} color="#FFFFFF" />
      </View>
      <AppText style={styles.infoText}>
        {label}
        <AppText style={styles.infoBold}>{value}</AppText>
        {suffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: 14,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
  // blok biasa (bukan row + wrap) supaya baris badge selebar kolom kartu, tidak tembus keluar
  tags: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  infoBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percent: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.primary,
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chatBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  list: {
    paddingVertical: 4,
  },
  appRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  appBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appName: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 22,
  },
  appLink: {
    marginTop: 8,
  },
  appLinkText: {
    fontSize: 14,
  },
});
