import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/parent/avatar';
import { ClayCard } from '@/components/parent/clay-card';
import { Screen } from '@/components/parent/screen';
import { SectionHeader } from '@/components/parent/screen-header';
import { ConsultationCard } from '@/components/psikolog/consultation-card';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ChatIcon } from '@/components/ui/chat-icon';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { consultations, psychologistProfile as me } from '@/data/psychologist';
import { pendingApplicants, statusOf, usePsikolog } from '@/lib/psikolog-store';

export default function PsikologBerandaScreen() {
  const store = usePsikolog();
  const today = consultations.filter((c) => c.today);
  // tombol "Mulai Sesi" hanya di sesi hari ini yang belum selesai paling awal
  const next = today.find((c) => statusOf(store, c) !== 'done');
  const pending = pendingApplicants(store);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.helloRow}>
            <AppText style={styles.hello}>
              Halo, <AppText style={[styles.hello, { color: Colors.primary }]}>{me.shortName}</AppText>
            </AppText>
            <View style={[styles.verified, Shadow.soft]}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.primary} />
              <AppText style={styles.verifiedText}>Verified</AppText>
            </View>
          </View>
          <AppText variant="caption">Siap membantu anak-anak hari ini?</AppText>
        </View>
        <Pressable
          accessibilityLabel="Notifikasi"
          onPress={() => router.push('/psikolog/notifikasi')}
          style={[styles.bell, Shadow.soft]}>
          <Feather name="bell" size={20} color={Colors.primary} />
          <View style={styles.bellDot} />
        </Pressable>
        <Pressable accessibilityLabel="Profil" onPress={() => router.push('/psikolog/profil')}>
          <Avatar name={me.name} size={40} ring="#FFFFFF" />
        </Pressable>
      </View>

      <SectionHeader
        title="Konsultasi Hari Ini"
        right={
          <Pressable onPress={() => router.push('/psikolog/jadwal')} hitSlop={8}>
            <AppText variant="link">Lihat Jadwal</AppText>
          </Pressable>
        }
      />
      {today.map((c) => (
        <ConsultationCard key={c.id} item={c} showAction={c.id === next?.id} />
      ))}

      <ClayCard tone="blue" style={styles.verify}>
        <View style={styles.verifyTop}>
          <View style={[styles.shield, Shadow.soft]}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.verifyTitle}>
              {pending.length > 0
                ? `${pending.length} shadow teacher menunggu verifikasi`
                : 'Semua pengajuan sudah ditinjau'}
            </AppText>
            <AppText variant="caption" color={Colors.text}>
              Tinjau dokumen & interview, lalu beri status Verified atau catatan perbaikan.
            </AppText>
          </View>
        </View>
        <View style={styles.verifyBottom}>
          <View style={styles.stack}>
            {pending.slice(0, 2).map((a, i) => (
              <View key={a.id} style={i > 0 && styles.stacked}>
                <Avatar name={a.name} size={38} ring="#FFFFFF" />
              </View>
            ))}
            {pending.length > 2 && (
              <View style={[styles.more, styles.stacked]}>
                <AppText style={styles.moreText}>+{pending.length - 2}</AppText>
              </View>
            )}
          </View>
          <PrimaryButton
            title={pending.length > 0 ? 'Tinjau Sekarang' : 'Lihat Riwayat'}
            onPress={() => router.push('/psikolog/verifikasi')}
            style={styles.verifyButton}
          />
        </View>
      </ClayCard>

      <ClayCard tone="green" onPress={() => router.push('/psikolog/komunitas')} style={styles.tips}>
        <AppText style={styles.tipsTitle}>Bagikan tips ke orang tua</AppText>
        <AppText variant="body" color={Colors.text}>
          Satu tips singkat darimu di Komunitas bisa menenangkan banyak orang tua minggu ini.
        </AppText>
        <View style={styles.inline}>
          <AppText variant="link" color={Colors.green}>
            Buka Komunitas
          </AppText>
          <Feather name="arrow-right" size={16} color={Colors.green} />
        </View>
      </ClayCard>

      <View style={styles.stats}>
        <ClayCard onPress={() => router.push('/psikolog/jadwal')} style={styles.stat}>
          <View style={styles.inline}>
            <ChatIcon size={15} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary}>
              Konsultasi
            </AppText>
          </View>
          <AppText style={styles.statValue}>{me.consultationsThisMonth}</AppText>
          <AppText variant="caption">bulan ini</AppText>
        </ClayCard>
        <ClayCard onPress={() => router.push('/pencairan')} style={styles.stat}>
          <View style={styles.inline}>
            <Feather name="credit-card" size={15} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary}>
              Pendapatan
            </AppText>
          </View>
          <AppText style={styles.statValue}>{me.earningsThisMonth}</AppText>
          <AppText variant="caption" color={Colors.green}>
            {me.verificationsDone} verifikasi selesai
          </AppText>
        </ClayCard>
      </View>
    </Screen>
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
  // badge Verified turun ke baris bawah kalau nama terlalu panjang
  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  hello: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.text,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
  verify: {
    gap: 14,
  },
  verifyTop: {
    flexDirection: 'row',
    gap: 12,
  },
  shield: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 23,
    marginBottom: 2,
  },
  verifyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stacked: {
    marginLeft: -12,
  },
  more: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  verifyButton: {
    height: 46,
    paddingHorizontal: 20,
  },
  tips: {
    gap: 8,
  },
  tipsTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    lineHeight: 26,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    gap: 6,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 32,
  },
});
