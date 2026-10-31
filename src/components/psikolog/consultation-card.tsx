import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Pill } from '@/components/parent/pill';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { MODE_LABEL, type ConsultMode, type Consultation } from '@/data/psychologist';
import { statusOf, usePsikolog } from '@/lib/psikolog-store';

const MODE_ICON: Record<ConsultMode, ComponentProps<typeof Feather>['name']> = {
  video: 'video',
  voice: 'phone',
  onsite: 'map-pin',
};

// kartu konsultasi di beranda & jadwal psikolog; tombol aksi hanya untuk sesi berikutnya
export function ConsultationCard({ item, showAction }: { item: Consultation; showAction?: boolean }) {
  const status = statusOf(usePsikolog(), item);
  const open = () => router.push({ pathname: '/psikolog/konsultasi/[id]', params: { id: item.id } });

  return (
    <ClayCard onPress={open} style={styles.card}>
      <View style={styles.top}>
        <Avatar name={item.parent} size={52} />
        <View style={styles.flex}>
          <AppText style={styles.name}>{item.parent}</AppText>
          <AppText variant="caption" numberOfLines={1}>
            {item.child} · {item.age} th · {item.needs.join(', ')}
          </AppText>
        </View>
        {status === 'done' ? (
          <Pill label="Selesai" tone="green" />
        ) : status === 'report' ? (
          <Pill label="Isi laporan" tone="red" />
        ) : (
          <Pill label={item.day} tone="yellow" />
        )}
      </View>

      <View style={styles.chips}>
        <Chip icon="calendar" label={item.day} />
        <Chip icon="clock" label={item.time} />
        <Chip icon={MODE_ICON[item.mode]} label={MODE_LABEL[item.mode]} />
      </View>

      {showAction && status === 'scheduled' && <PrimaryButton title="Mulai Sesi" onPress={open} style={styles.action} />}
      {showAction && status === 'report' && (
        <PrimaryButton title="Tulis Hasil Observasi" leadingIcon="edit-3" onPress={open} style={styles.action} />
      )}
    </ClayCard>
  );
}

function Chip({ icon, label }: { icon: ComponentProps<typeof Feather>['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <Feather name={icon} size={14} color={Colors.primary} />
      <AppText style={styles.chipText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    gap: 14,
    padding: 16,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  action: {
    height: 50,
  },
});
