import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { Segmented } from '@/components/parent/segmented';
import { TabHeader } from '@/components/parent/screen-header';
import type { Tone } from '@/components/parent/tones';
import { TagRow } from '@/components/parent/tag-row';
import { AppText } from '@/components/ui/app-text';
import { ChatIcon } from '@/components/ui/chat-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { activeMatches, applications, type ActiveMatch, type Application } from '@/data/parent';
import { teacherIdByName } from '@/data/teachers';

const STATUS: Record<Application['status'], { label: string; tone: Tone; solid: boolean }> = {
  accepted: { label: 'Diterima', tone: 'green', solid: true },
  pending: { label: 'Menunggu', tone: 'gray', solid: false },
  rejected: { label: 'Ditolak', tone: 'red', solid: true },
};

export default function RiwayatScreen() {
  const [tab, setTab] = useState<0 | 1>(0);
  const empty = tab === 0 ? activeMatches.length === 0 : applications.length === 0;

  return (
    <Screen fill={empty}>
      <TabHeader title="Riwayat" />
      <Segmented
        labels={[`Didampingi (${activeMatches.length})`, `Pengajuan (${applications.length})`]}
        value={tab}
        onChange={setTab}
      />

      {empty ? (
        <EmptyFill>
          <ClayCard>
            <EmptyState
              title={tab === 0 ? 'Belum ada pendampingan aktif' : 'Belum ada pengajuan'}
              subtitle={
                tab === 0
                  ? 'Shadow teacher yang mendampingi si kecil akan muncul di sini.'
                  : 'Pengajuan dari shadow teacher dan penawaranmu tampil di sini.'
              }
            />
          </ClayCard>
          <PrimaryButton title="Cari Shadow Teacher" leadingIcon="search" onPress={() => router.push('/cari-teacher')} />
        </EmptyFill>
      ) : tab === 0 ? (
        activeMatches.map((m) => <MatchCard key={m.id} match={m} />)
      ) : (
        <ClayCard style={styles.list}>
          {applications.map((a, i) => (
            <ApplicationRow
              key={a.id}
              item={a}
              last={i === applications.length - 1}
              onShowActive={() => setTab(0)}
            />
          ))}
        </ClayCard>
      )}
    </Screen>
  );
}

function MatchCard({ match }: { match: ActiveMatch }) {
  const progress = match.total > 0 ? Math.min(1, match.done / match.total) : 0;
  const percent = Math.round(progress * 1000) / 10;

  return (
    <ClayCard style={styles.match}>
      <View style={styles.matchTop}>
        <View>
          <Avatar name={match.teacher} size={68} ring="#FFFFFF" />
          {match.online && <View style={styles.online} />}
        </View>
        <View style={styles.flex}>
          <View style={styles.inline}>
            <AppText style={styles.teacher} numberOfLines={1}>
              {match.teacher}
            </AppText>
            <MaterialCommunityIcons name="check-decagram" size={17} color={Colors.primary} />
          </View>
          <View style={styles.tags}>
            <TagRow tags={match.tags} solid stacked />
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <InfoRow icon="user" label="Anak: " value={match.child} />
        <InfoRow icon="calendar" label="Sesi berikutnya: " value={match.nextSession} />
        <InfoRow
          icon="check-circle"
          label=""
          value={`${match.done} dari ${match.total} sesi`}
          suffix={` selesai (${match.phase})`}
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

      <View style={styles.matchActions}>
        <Pressable
          accessibilityLabel={`Chat dengan ${match.teacher}`}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: match.chatId } })}
          style={[styles.chatBtn, Shadow.soft]}>
          <ChatIcon size={24} color={Colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/kontrak/[id]', params: { id: match.id } })}
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

function ApplicationRow({
  item,
  last,
  onShowActive,
}: {
  item: Application;
  last: boolean;
  onShowActive: () => void;
}) {
  const status = STATUS[item.status];
  const action =
    item.status === 'accepted'
      ? { label: 'Lihat di Sedang Didampingi', onPress: onShowActive }
      : item.status === 'pending'
        ? {
            label: 'Lihat Profil Teacher',
            onPress: () => {
              const id = teacherIdByName(item.teacher);
              if (id) router.push({ pathname: '/profil-teacher/[id]', params: { id } });
            },
          }
        : { label: 'Cari Teacher Lain', onPress: () => router.push('/cari-teacher') };

  return (
    <View style={[styles.appRow, !last && styles.appBorder]}>
      <Avatar name={item.teacher} size={56} />
      <View style={styles.flex}>
        <View style={styles.appTop}>
          <AppText style={styles.appName} numberOfLines={1}>
            {item.teacher.split(',')[0]}
          </AppText>
          <Pill inRow label={status.label} tone={status.tone} solid={status.solid} size="md" />
        </View>
        <AppText variant="caption" color={Colors.primary}>
          {item.specialty} · untuk {item.child}
        </AppText>
        <AppText variant="caption">Diajukan {item.date}</AppText>
        <Pressable onPress={action.onPress} style={[styles.link, styles.appLink]}>
          <AppText variant="link" style={styles.appLinkText}>
            {action.label}
          </AppText>
          <Feather name="arrow-right" size={15} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  match: {
    gap: 14,
  },
  matchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  online: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  teacher: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    flexShrink: 1,
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
    alignItems: 'center',
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
  matchActions: {
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
