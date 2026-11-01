import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { homeRoute, requestPasswordReset, resetPassword } from '@/lib/auth';
import { showAlert } from '@/lib/dialog';

const MIN_PASSWORD = 8;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type Step = 'contact' | 'otp' | 'password';

// lupa kata sandi: email -> kode 6 digit dikirim ke email -> kata sandi baru (langsung masuk)
export default function LupaSandiScreen() {
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const email = contact.trim().toLowerCase();

  const sendCode = async () => {
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setTimer(RESEND_SECONDS);
      setStep('otp');
      return true;
    } catch (e) {
      showAlert('Kode belum terkirim', errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const session = await resetPassword(email, otp, password);
      showAlert('Kata sandi berhasil diubah', 'Kamu sudah masuk dengan kata sandi baru.');
      router.dismissAll();
      router.replace(homeRoute(session.role));
    } catch (e) {
      showAlert('Kata sandi belum diubah', errorMessage(e));
      setOtp('');
      setStep('otp');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== 'otp' || timer === 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [step, timer]);

  if (step === 'contact') {
    return (
      <FormScreen title="Lupa kata sandi?" subtitle="Tenang, masukkan email akunmu. Kami kirimkan kode verifikasi (cek juga folder spam).">
        <TextField
          label="Email"
          icon="mail"
          placeholder="johndoe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={contact}
          onChangeText={setContact}
        />
        <PrimaryButton
          title={busy ? 'Mengirim…' : 'Kirim Kode'}
          disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || busy}
          onPress={sendCode}
        />
      </FormScreen>
    );
  }

  if (step === 'otp') {
    return (
      <FormScreen title="Masukkan kode" subtitle={`Kode ${OTP_LENGTH} digit sudah dikirim ke ${contact.trim()}.`}>
        <View style={styles.otpWrap}>
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
              <AppText style={styles.otpDigit}>{otp[i] ?? ''}</AppText>
            </View>
          ))}
          {/* input asli disembunyikan di atas kotak-kotak OTP */}
          <TextInput
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            autoFocus
            maxLength={OTP_LENGTH}
            style={styles.otpInput}
            caretHidden
          />
        </View>
        <Pressable
          disabled={timer > 0}
          onPress={async () => {
            if (await sendCode()) showAlert('Kode dikirim ulang', `Cek kembali ${email} ya.`);
          }}
          hitSlop={8}>
          <AppText variant="link" color={timer > 0 ? Colors.textMuted : Colors.primary} style={styles.center}>
            {timer > 0 ? `Kirim ulang dalam ${timer} detik` : 'Kirim ulang kode'}
          </AppText>
        </Pressable>
        <PrimaryButton title="Verifikasi" disabled={otp.length < OTP_LENGTH} onPress={() => setStep('password')} />
      </FormScreen>
    );
  }

  const longEnough = password.length >= MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  return (
    <FormScreen title="Buat kata sandi baru" subtitle="Gunakan kata sandi yang kuat dan belum pernah dipakai.">
      <TextField
        label="Kata Sandi Baru"
        icon="lock"
        placeholder="Minimal 8 karakter"
        password
        value={password}
        onChangeText={setPassword}
      />
      <TextField
        label="Konfirmasi Kata Sandi"
        icon="lock"
        placeholder="Ulangi kata sandi"
        password
        value={confirm}
        onChangeText={setConfirm}
        error={mismatch ? 'Kata sandi tidak sama' : undefined}
      />
      <PrimaryButton
        title={busy ? 'Menyimpan…' : 'Simpan Kata Sandi'}
        disabled={!longEnough || confirm !== password || busy}
        onPress={save}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  otpWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpBox: {
    width: 46,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpDigit: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.primaryDark,
  },
  otpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
  },
});
