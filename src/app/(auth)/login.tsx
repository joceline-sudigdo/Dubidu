import AntDesign from '@expo/vector-icons/AntDesign';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { demoAccounts, login, type Account } from '@/lib/auth';
import { setSession } from '@/lib/session';
import { showActionSheet } from '@/lib/dialog';

// semua role login di sini, psikolog nggak bisa daftar sendiri
export default function LoginScreen() {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const canSubmit = contact.trim().length > 0 && password.length > 0;

  const submit = () => {
    const account = login(contact, password);
    if (!account) {
      setError('Email/nomor HP atau kata sandi salah');
      return;
    }
    setError('');
    enter(account);
  };

  const enter = (account: Account) => {
    setSession({ role: account.role, name: account.name });
    if (account.role === 'parent') router.replace('/beranda');
    else if (account.role === 'teacher') router.replace('/teacher/beranda');
    else router.replace('/psikolog/beranda');
  };

  return (
    <FormScreen
      title="Selamat datang!"
      subtitle="Masuk untuk melanjutkan pendampingan si kecil dengan penuh kehangatan."
      showBack={false}>
      <View style={styles.fields}>
        <TextField
          label="Email atau nomor HP"
          icon="mail"
          placeholder="johndoe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={contact}
          onChangeText={setContact}
        />
        <TextField
          label="Kata Sandi"
          icon="lock"
          placeholder="Masukkan kata sandi"
          password
          autoComplete="password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          error={error || undefined}
        />
        <Pressable
          style={styles.forgot}
          hitSlop={8}
          onPress={() => router.push('/lupa-sandi')}>
          <AppText variant="link" color={Colors.red} style={styles.forgotText}>
            Lupa kata sandi?
          </AppText>
        </Pressable>
      </View>

      <PrimaryButton
        title="Login"
        disabled={!canSubmit}
        onPress={submit}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <AppText variant="caption" style={styles.dividerText}>
          atau
        </AppText>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          showActionSheet({
            title: 'Pilih akun Google',
            options: demoAccounts().map((a) => ({
              label: `${a.name.split(',')[0]} · ${a.email}`,
              icon: 'user' as const,
              onPress: () => enter(a),
            })),
          })
        }
        style={({ pressed }) => [styles.google, Shadow.soft, pressed && { opacity: 0.85 }]}>
        <AntDesign name="google" size={22} color="#4285F4" />
        <AppText style={styles.googleText}>Masuk dengan Google</AppText>
      </Pressable>

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          Belum punya akun?{' '}
        </AppText>
        <Link href="/register" asChild>
          <Pressable hitSlop={8}>
            <AppText variant="link">Daftar di sini</AppText>
          </Pressable>
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 16,
    marginTop: 12,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontFamily: Fonts.body,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 15,
  },
  google: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});
