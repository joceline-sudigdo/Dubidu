import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { TabHeader } from '@/components/parent/screen-header';
import { Segmented } from '@/components/parent/segmented';
import { VerifyBadge } from '@/components/psikolog/verify-badge';
import { AppText } from '@/components/ui/app-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { applicants, type Applicant } from '@/data/psychologist';
import { interviewOf, resultOf, usePsikolog } from '@/lib/psikolog-store';

export default function VerifikasiScreen() {
  const store = usePsikolog();
  const [tab, setTab] = useState<0 | 1>(0);
  const pending = applicants.filter((a) => !resultOf(store, a));
  const done = applicants.filter((a) => resultOf(store, a));
  const list = tab === 0 ? pending : done;

  return (
    <Screen>
      <TabHeader title="Verifikasi" />
      <Segmented labels={[`Menunggu (${pending.length})`, `Selesai (${done.length})`]} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <ClayCard>
          <EmptyState
            title={tab === 0 ? 'Semua sudah ditinjau' : 'Belum ada yang selesai'}
            subtitle={
              tab === 0
                ? 'Pengajuan shadow teacher baru akan muncul di sini.'
                : 'Shadow teacher yang sudah kamu tinjau akan muncul di sini.'
            }
          />
        </ClayCard>
      ) : (
        list.map((a) => <ApplicantCard key={a.id} item={a} />)
      )}
    </Screen>
  );
}

function ApplicantCard({ item }: { item: Applicant }) {
  const store = usePsikolog();
  const result = resultOf(store, item);
  const interview = interviewOf(store, item);
  const uploaded = item.documents.filter((d) => d.uploaded).length;
  const progress = uploaded / item.documents.length;
  const open = () => router.push({ pathname: '/psikolog/tinjau/[id]', params: { id: item.id } });

  return (
    <ClayCard onPress={open} style={styles.card}>
      <View style={styles.top}>
        <Avatar name={item.name} size={64} ring={Colors.primarySoft} />
        <View style={styles.flex}>
          <AppText style={styles.name}>{item.name}</AppText>
          <Pill label={item.education} tone="blue" solid style={styles.shrink} />
          <View style={styles.pills}>
            <Pill label={item.experience} tone="red" />
            <Pill label={item.registered} tone="yellow" />
          </View>
        </View>
      </View>

      <View style={styles.box}>
        <InfoRow icon="account-heart-outline" text={item.focus} />
        {!result && (
          <InfoRow
            icon="calendar-month-outline"
            text={
              <>
                Interview: <AppText style={styles.bold}>{interview ?? 'Belum dijadwalkan'}</AppText>
              </>
            }
          />
        )}
      </View>

      {result ? (
        <View style={styles.footer}>
          <VerifyBadge result={result} />
          <DetailLink />
        </View>
      ) : (
        <>
          <View style={styles.docRow}>
            <AppText variant="body" color={Colors.textSecondary}>
              Dokumen {uploaded}/{item.documents.length}
            </AppText>
            <AppText style={[styles.bold, { color: progress === 1 ? Colors.green : Colors.primary }]}>
              {Math.round(progress * 100)}%
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <DetailLink />
        </>
      )}
    </ClayCard>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <AppText style={styles.infoText}>{text}</AppText>
    </View>
  );
}

function DetailLink() {
  return (
    <View style={styles.link}>
      <AppText variant="link">Lihat Detail</AppText>
      <Feather name="arrow-right" size={16} color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 6,
  },
  shrink: {
    maxWidth: '100%',
  },
  bold: {
    fontFamily: Fonts.bodyBold,
  },
  card: {
    gap: 14,
  },
  top: {
    flexDirection: 'row',
    gap: 14,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 25,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
    marginTop: -6,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  // kalau badge panjang, "Lihat Detail" turun ke baris bawah (tetap di dalam kartu)
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: 10,
    columnGap: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
});
