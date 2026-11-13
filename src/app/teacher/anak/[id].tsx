import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { bearSource } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { EmptyFill, EmptyState } from '@/components/parent/empty-state';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader, SectionHeader } from '@/components/parent/screen-header';
import { TagRow } from '@/components/parent/tag-row';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { findContract } from '@/data/contracts';
import { formatRupiah } from '@/data/parent';
import { childMatchScore, needLabels, seekingChildren, students } from '@/data/teacher';
import { connectChild, useChildMatching } from '@/lib/child-matching-store';
import { showAlert } from '@/lib/dialog';

type FeatherName = ComponentProps<typeof Feather>['name'];
// profil anak yang dilihat teacher: murid sendiri atau anak yang sedang mencari pendamping
export default function ProfilAnakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matching = useChildMatching();
  const student = students.find((s) => s.id === id);
  const seeking = seekingChildren.find((c) => c.id === id);

  if (!student && !seeking) {
    return (
      <Screen header={<ScreenHeader title="Profil Anak" />} fill>
        <EmptyFill>
          <EmptyState title="Profil tidak ditemukan" />
        </EmptyFill>
      </Screen>
    );
  }

  const gender = (student ?? seeking)!.gender;
  // umur / kelas yang belum diisi (0 atau "-") tidak ditampilkan
  const age = (student ?? seeking)!.age;
  const title = `${student ? student.name : seeking!.initials}${age > 0 ? ` · ${age} tahun` : ''}`;

  return (
    <Screen
      header={<ScreenHeader title="Profil Anak" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          {student ? (
            <View style={styles.row}>
              <PrimaryButton
                title="Chat Orang Tua"
                leadingIcon="chat"
                style={styles.flex}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: student.chatId } })}
              />
              {findContract(student.id) && (
                <PrimaryButton
                  title="Kontrak"
                  leadingIcon="file-text"
                  color={Colors.primaryDark}
                  onPress={() => router.push({ pathname: '/kontrak/[id]', params: { id: student.id } })}
                />
              )}
            </View>
          ) : (
            <PrimaryButton
              title={matching.connected.includes(seeking!.id) ? 'Buka Chat' : 'Ajukan Diri'}
              leadingIcon="send"
              onPress={() =>
                matching.connected.includes(seeking!.id)
                  ? connectChild(seeking!)
                  : showAlert('Ajukan diri?', `Pesan perkenalan akan dikirim ke ${seeking!.parent}.`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Kirim', onPress: () => connectChild(seeking!) },
                    ])
              }
            />
          )}
        </View>
      }>
      <ClayCard style={styles.profile}>
        <View style={[styles.photo, { backgroundColor: gender === 'female' ? '#F28B82' : '#B8CBE8' }]}>
          <Image source={bearSource(gender)} style={StyleSheet.absoluteFill} contentFit="cover" />
          {seeking && (
            <View style={[styles.match, Shadow.button]}>
              <MaterialCommunityIcons name="star-four-points" size={16} color="#FFFFFF" />
              <AppText style={styles.matchText}>{childMatchScore(seeking)}% Cocok</AppText>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <AppText style={styles.name}>{title}</AppText>
            <Pill label={student ? 'Murid Aktif' : 'Mencari Pendamping'} tone={student ? 'green' : 'blue'} solid />
          </View>
          <View style={styles.inline}>
            <Feather name="user" size={16} color={Colors.primary} />
            <AppText variant="body" color={Colors.text}>
              {gender === 'female' ? 'Perempuan' : 'Laki-laki'}
              {student ? (student.grade && student.grade !== '-' ? ` · Kelas ${student.grade}` : '') : ` · ${seeking!.area}`}
            </AppText>
          </View>
          <TagRow tags={student ? student.tags : needLabels(seeking!.needs)} max={3} />
        </View>
      </ClayCard>

      {student ? (
        <>
          <SectionHeader title="Pendampingan" />
          <ClayCard style={styles.list}>
            <Info icon="users" label="Orang tua" value={student.parent} />
            <Info icon="activity" label="Kondisi" value={student.condition} />
            <Info icon="calendar" label="Sesi berikutnya" value={student.nextSession} />
            <Info icon="check-circle" label="Progres" value={`${student.done}/${student.total} sesi · ${student.phase}`} last />
          </ClayCard>
        </>
      ) : (
        <>
          <SectionHeader title="Kebutuhan & Jadwal" />
          <ClayCard style={styles.list}>
            <Info icon="target" label="Tujuan utama" value={seeking!.goal} />
            <Info icon="calendar" label="Jadwal" value={`${seeking!.days}, ${seeking!.timeOfDay}`} />
            <Info icon="clock" label="Durasi" value={seeking!.hours} />
            <Info icon="home" label="Sistem" value={seeking!.system} />
            <Info icon="credit-card" label="Budget per sesi" value={formatRupiah(seeking!.budget)} last />
          </ClayCard>
          <SectionHeader title="Catatan Keluarga" />
          <ClayCard tone="blue">
            <AppText variant="body">“{seeking!.note}”</AppText>
            <AppText variant="caption" style={styles.parent}>
              — {seeking!.parent} · ⭐ {seeking!.parentRating} ({seeking!.parentReviews} ulasan dari teacher)
            </AppText>
          </ClayCard>
        </>
      )}
    </Screen>
  );
}

function Info({ icon, label, value, last }: { icon: FeatherName; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.info, !last && styles.border]}>
      <Feather name={icon} size={18} color={Colors.primary} />
      <View style={styles.flex}>
        <AppText variant="caption">{label}</AppText>
        <AppText style={styles.infoValue}>{value}</AppText>
      </View>
    </View>
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
    gap: 6,
  },
  profile: {
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    height: 210,
    overflow: 'hidden',
  },
  match: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  matchText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  body: {
    padding: 18,
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: Fonts.heading,
    fontSize: 19,
    lineHeight: 26,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    paddingVertical: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  parent: {
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
