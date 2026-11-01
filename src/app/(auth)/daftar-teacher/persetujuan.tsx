import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecureNote } from '@/components/ui/secure-note';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { useParentRegistration } from '@/context/parent-registration';
import { errorMessage } from '@/lib/api';
import { registerTeacher } from '@/lib/auth';
import { showAlert } from '@/lib/dialog';

const AGREEMENTS = [
  {
    title: 'Kode etik pendamping',
    text: 'Saya akan mendampingi anak dengan sabar, tanpa kekerasan fisik maupun verbal, dan menghormati keluarga.',
  },
  {
    title: 'Kerahasiaan data anak',
    text: 'Saya menjaga kerahasiaan kondisi, foto, dan laporan anak, serta tidak membagikannya di luar Dubidu.',
  },
  {
    title: 'Verifikasi latar belakang',
    text: 'Saya bersedia diverifikasi (dokumen, referensi, dan wawancara singkat) oleh tim Dubidu.',
  },
  {
    title: 'Laporan sesi rutin',
    text: 'Saya akan mengisi laporan harian setiap selesai sesi agar orang tua bisa memantau perkembangan.',
  },
];

// langkah terakhir: persetujuan kode etik, lalu pendaftaran dikirim untuk diverifikasi
export default function PersetujuanScreen() {
  const { data, reset } = useParentRegistration();
  const [checked, setChecked] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await registerTeacher(data);
      setSent(true);
    } catch (e) {
      showAlert('Pendaftaran belum terkirim', errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  const all = checked.length === AGREEMENTS.length;

  const toggle = (i: number) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  if (sent) {
    return (
      <FormScreen title="Pendaftaran terkirim!" showBack={false}>
        <View style={styles.done}>
          <Image source={require('@/assets/images/mascot/wait.png')} style={styles.mascot} contentFit="contain" />
          <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
            Terima kasih sudah mendaftar jadi shadow teacher. Tim Dubidu akan memverifikasi data kamu dalam 1-3 hari
            kerja. Sambil menunggu, kamu sudah bisa masuk dan melengkapi profil.
          </AppText>
          <View style={[styles.steps, Shadow.soft]}>
            {['Data terkirim', 'Verifikasi dokumen', 'Wawancara singkat', 'Akun aktif'].map((s, i) => (
              <View key={s} style={styles.stepRow}>
                <View style={[styles.stepDot, i === 0 && styles.stepDotOn]}>
                  {i === 0 ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <AppText style={styles.stepNum}>{i + 1}</AppText>
                  )}
                </View>
                <AppText style={[styles.stepText, i === 0 && { color: Colors.green }]}>{s}</AppText>
              </View>
            ))}
          </View>
        </View>
        <PrimaryButton
          title="Kembali ke Login"
          onPress={() => {
            reset();
            router.dismissAll();
            router.replace('/login');
          }}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Persetujuan Pendamping"
      subtitle="Langkah terakhir! Baca dan setujui komitmen sebagai shadow teacher Dubidu."
      step={{ current: 4, total: 4 }}>
      {AGREEMENTS.map((a, i) => {
        const on = checked.includes(i);
        return (
          <Pressable
            key={a.title}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => toggle(i)}
            style={[styles.card, Shadow.soft, on && styles.cardOn]}>
            <View style={[styles.checkbox, on && styles.checkboxOn]}>
              {on && <Feather name="check" size={16} color="#FFFFFF" />}
            </View>
            <View style={styles.flex}>
              <AppText style={styles.title}>{a.title}</AppText>
              <AppText variant="caption">{a.text}</AppText>
            </View>
          </Pressable>
        );
      })}

      <Pressable onPress={() => setChecked(all ? [] : AGREEMENTS.map((_, i) => i))} hitSlop={8}>
        <AppText variant="link" style={styles.center}>
          {all ? 'Batalkan semua' : 'Setujui semua'}
        </AppText>
      </Pressable>

      <PrimaryButton
        title={sending ? 'Mengirim pendaftaran…' : 'Kirim Pendaftaran'}
        icon="send"
        disabled={!all || sending}
        onPress={submit}
      />
      <SecureNote />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  done: {
    alignItems: 'center',
    gap: 16,
  },
  mascot: {
    width: 180,
    height: 160,
  },
  steps: {
    alignSelf: 'stretch',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: {
    backgroundColor: Colors.green,
  },
  stepNum: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stepText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
