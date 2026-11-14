import Feather from '@expo/vector-icons/Feather';
import { Link, router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { useParentRegistration, type Role } from '@/context/parent-registration';
import { contactError, contactTakenError, noErrors, requiredError } from '@/lib/validation';

const MIN_PASSWORD = 8;

export default function RegisterScreen() {
  const { data, update } = useParentRegistration();
  const [role, setRole] = useState<Role>('parent');
  const [fullName, setFullName] = useState(data.account.fullName);
  const [contact, setContact] = useState(data.account.contact);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  // pesan error per kolom, diisi saat menekan Next
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [checking, setChecking] = useState(false);

  const passwordLongEnough = password.length >= MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;

  // pesan kolom hilang begitu pengguna memperbaikinya
  const edit = (key: string, set: (v: string) => void) => (v: string) => {
    set(v);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const next = {
      fullName: requiredError(fullName, 'Nama lengkap', 2),
      contact: contactError(contact),
      password: password.length >= MIN_PASSWORD ? undefined : `Kata sandi minimal ${MIN_PASSWORD} karakter.`,
      confirm: !confirm ? 'Ulangi kata sandi.' : confirm !== password ? 'Kata sandi tidak sama.' : undefined,
      // shadow teacher menyetujui S&K di halaman tersendiri pada langkah berikutnya
      agreed: role === 'teacher' || agreed ? undefined : 'Setujui Syarat & Ketentuan dan Kebijakan Privasi untuk melanjutkan.',
    };
    setErrors(next);
    if (!noErrors(next)) return;
    // email/HP yang sudah terdaftar langsung diberi tahu di langkah ini
    setChecking(true);
    const taken = await contactTakenError(contact);
    setChecking(false);
    if (taken) {
      setErrors({ contact: taken });
      return;
    }
    update('account', { fullName: fullName.trim(), contact: contact.trim(), password });
    // shadow teacher wajib membaca S&K khusus dulu sebelum mengisi data pendaftaran
    if (role === 'teacher') router.push('/daftar-teacher/syarat');
    else router.push('/parent/identity');
  };

  return (
    <FormScreen title="Buat akun baru" subtitle="Ayo! Pilih peran kamu di Dubidu.">
      <View style={styles.roles}>
        <RoleCard
          label="Orang Tua"
          icon="users"
          selected={role === 'parent'}
          onPress={() => setRole('parent')}
        />
        <RoleCard
          label="Shadow Teacher"
          icon="book-open"
          selected={role === 'teacher'}
          onPress={() => setRole('teacher')}
        />
      </View>

      <TextField
        label="Nama Lengkap"
        icon="user"
        placeholder="Contoh: John Doe"
        autoComplete="name"
        value={fullName}
        onChangeText={edit('fullName', setFullName)}
        error={errors.fullName}
      />
      <TextField
        label="Email atau nomor HP"
        icon="mail"
        placeholder="johndoe@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={contact}
        onChangeText={edit('contact', setContact)}
        error={errors.contact}
      />
      <TextField
        label="Kata Sandi"
        icon="lock"
        placeholder="Masukkan kata sandi"
        password
        autoComplete="new-password"
        value={password}
        onChangeText={edit('password', setPassword)}
        error={errors.password}
      />
      <TextField
        label="Konfirmasi Kata Sandi"
        icon="lock"
        placeholder="Masukkan kata sandi"
        password
        autoComplete="new-password"
        value={confirm}
        onChangeText={edit('confirm', setConfirm)}
        error={errors.confirm ?? (mismatch ? 'Kata sandi tidak sama.' : undefined)}
      />

      <View style={styles.rule}>
        <Feather
          name="check"
          size={18}
          color={passwordLongEnough ? Colors.green : Colors.textMuted}
        />
        <AppText variant="caption" color={passwordLongEnough ? Colors.green : Colors.textSecondary}>
          Minimal {MIN_PASSWORD} karakter
        </AppText>
      </View>

      {role === 'teacher' ? (
        <View style={styles.teacherNote}>
          <Feather name="file-text" size={18} color={Colors.primary} />
          <AppText variant="caption" style={styles.termsText}>
            Di langkah berikutnya kamu akan membaca dan menyetujui Syarat & Ketentuan Shadow Teacher sebelum mengisi data
            pendaftaran.
          </AppText>
        </View>
      ) : (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => {
          setAgreed((a) => !a);
          setErrors((e) => ({ ...e, agreed: undefined }));
        }}
        style={styles.terms}>
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed && <Feather name="check" size={16} color="#FFFFFF" />}
        </View>
        <AppText variant="caption" style={styles.termsText}>
          Saya menyetujui{' '}
          <AppText style={styles.termsLink} onPress={() => router.push({ pathname: '/legal/[type]', params: { type: 'terms' } })}>
            Syarat & Ketentuan
          </AppText>{' '}
          dan{' '}
          <AppText style={styles.termsLink} onPress={() => router.push({ pathname: '/legal/[type]', params: { type: 'privacy' } })}>
            Kebijakan Privasi
          </AppText>{' '}
          Dubidu
        </AppText>
      </Pressable>
      )}

      {!!errors.agreed && (
        <AppText variant="caption" color={Colors.red}>
          {errors.agreed}
        </AppText>
      )}

      <PrimaryButton title={checking ? 'Memeriksa…' : 'Next'} disabled={checking} onPress={submit} />

      <View style={styles.footer}>
        <AppText variant="body" color={Colors.textSecondary}>
          Sudah punya akun?{' '}
        </AppText>
        <Link href="/login" dismissTo asChild>
          <Pressable hitSlop={8}>
            <AppText variant="link">Masuk di sini</AppText>
          </Pressable>
        </Link>
      </View>
    </FormScreen>
  );
}

function RoleCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.role, Shadow.soft, selected && styles.roleSelected]}>
      <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
        <Feather name={icon} size={24} color={selected ? Colors.primary : Colors.textSecondary} />
      </View>
      <AppText style={[styles.roleLabel, selected && { color: Colors.primaryDark }]}>{label}</AppText>
      {selected && (
        <View style={styles.roleCheck}>
          <Feather name="check" size={14} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teacherNote: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  roles: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  role: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: {
    backgroundColor: '#FFFFFF',
  },
  roleLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  roleCheck: {
    position: 'absolute',
    top: -8,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -6,
    marginLeft: 8,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  termsLink: {
    fontFamily: Fonts.bodyBold,
    color: Colors.red,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
