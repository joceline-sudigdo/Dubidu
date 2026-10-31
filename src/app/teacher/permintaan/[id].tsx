import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { bearSource } from '@/components/parent/bear-avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { Screen } from '@/components/parent/screen';
import { ScreenHeader } from '@/components/parent/screen-header';
import type { Tone } from '@/components/parent/tones';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { childMatchScore, needLabels, seekingChildren } from '@/data/teacher';
import { connectChild, declineRequest } from '@/lib/child-matching-store';

const TAG_TONES: Tone[] = ['red', 'blue', 'green'];

// detail profil anak dari permintaan match / tombol "Lihat profil lengkap"
export default function PermintaanMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = seekingChildren.find((c) => c.id === id) ?? seekingChildren[0];
  const match = childMatchScore(child);

  return (
    <Screen
      header={<ScreenHeader title="Permintaan Match" />}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                declineRequest(child.id);
                router.back();
              }}
              style={[styles.skip, Shadow.soft]}>
              <AppText style={styles.skipText}>Lewati</AppText>
            </Pressable>
            <PrimaryButton title="Terima Tawaran" onPress={() => connectChild(child, true)} style={styles.flex2} />
          </View>
          <SecureNote text="Tawaran berlaku 24 jam sebelum dialihkan ke pengajar lain" />
        </View>
      }>
      <ClayCard style={styles.profile}>
        <View style={[styles.photo, { backgroundColor: child.gender === 'female' ? '#F28B82' : '#B8CBE8' }]}>
          <Image source={bearSource(child.gender)} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[styles.match, Shadow.button]}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#FFFFFF" />
            <AppText style={styles.matchText}>{match}% Cocok</AppText>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <AppText style={styles.name}>
              {child.initials} · {child.age} tahun
            </AppText>
            <Pill label="Siswa Baru" tone="blue" solid />
          </View>
          <View style={styles.inline}>
            <Feather name="map-pin" size={16} color={Colors.primary} />
            <AppText variant="body" color={Colors.text}>
              {child.area}
            </AppText>
          </View>
          <View style={styles.tags}>
            {needLabels(child.needs).map((l, i) => (
              <Pill key={l} label={l} tone={TAG_TONES[i % TAG_TONES.length]} size="md" />
            ))}
          </View>
          <IconRow icon="target" title="Tujuan Utama" text={child.goal} />
        </View>
      </ClayCard>

      <ClayCard style={styles.gap14}>
        <IconRow icon="calendar" title="Jadwal Dibutuhkan" text={`${child.frequency} · ${child.timeOfDay}`} accent />
        <InfoBox icon="clock" title={child.days} text={child.hours} />
        <InfoBox icon="map-pin" title="Sistem Pendampingan" text={child.system} />
      </ClayCard>

      <ClayCard tone="gray">
        <IconRow icon="align-left" title="Catatan Khusus Keluarga" text={`“${child.note}”`} />
      </ClayCard>
    </Screen>
  );
}

function IconRow({
  icon,
  title,
  text,
  accent,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.iconRow}>
      <View style={[styles.iconCircle, Shadow.soft]}>
        <Feather name={icon} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        <AppText variant="body" color={accent ? Colors.primary : Colors.textSecondary} style={accent && styles.accent}>
          {text}
        </AppText>
      </View>
    </View>
  );
}

function InfoBox({ icon, title, text }: { icon: ComponentProps<typeof Feather>['name']; title: string; text: string }) {
  return (
    <View style={styles.infoBox}>
      <Feather name={icon} size={20} color={Colors.textSecondary} />
      <View style={styles.flex}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        <AppText variant="body" color={Colors.text}>
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gap14: {
    gap: 14,
  },
  profile: {
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    height: 200,
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
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 19,
    lineHeight: 26,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.text,
  },
  accent: {
    fontFamily: Fonts.bodyBold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  skip: {
    flex: 1,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.red,
  },
});
