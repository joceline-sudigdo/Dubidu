import * as ImagePicker from 'expo-image-picker';
import { useSyncExternalStore } from 'react';

import { parentProfile } from '@/data/parent';
import { psychologistProfile } from '@/data/psychologist';
import { teacherProfile } from '@/data/teacher';

import { api, errorMessage, uploadFile } from './api';
import { updateSession } from './session';
import { showAlert } from './dialog';

// data profil yang bisa diedit user. Diisi ulang dari server setelah login (refreshProfile),
// perubahan profil teacher disimpan ke server.
type State = {
  photos: Record<string, string>;
  parent: { email: string; phone: string; domicile: string };
  teacher: {
    title: string;
    about: string;
    price: string;
    availability: string;
    specializations: string[];
  };
  psychologist: { about: string; specializations: string[] };
  settings: Record<string, boolean>;
};

let state: State = {
  photos: {},
  parent: { email: parentProfile.email, phone: parentProfile.phone, domicile: parentProfile.domicile },
  teacher: {
    title: teacherProfile.title,
    about: teacherProfile.about,
    price: teacherProfile.price,
    availability: teacherProfile.availability,
    specializations: teacherProfile.specializations.map((s) => s.label),
  },
  psychologist: { about: psychologistProfile.about, specializations: psychologistProfile.specializations },
  settings: { notifPush: true, notifChat: true, notifReport: true, notifPromo: false, showProfile: true },
};
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function useProfile() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

export function updateParent(values: Partial<State['parent']>) {
  set({ ...state, parent: { ...state.parent, ...values } });
}

/** Ambil ulang nilai awal dari data akun (dipanggil setelah data server dimuat) */
export function refreshProfile() {
  set({
    ...state,
    parent: { email: parentProfile.email, phone: parentProfile.phone, domicile: parentProfile.domicile },
    teacher: {
      title: teacherProfile.title,
      about: teacherProfile.about,
      price: teacherProfile.price,
      availability: teacherProfile.availability,
      specializations: teacherProfile.specializations.map((s) => s.label),
    },
    psychologist: { about: psychologistProfile.about, specializations: psychologistProfile.specializations },
  });
}

export function updateTeacher(values: Partial<State['teacher']>) {
  const before = state.teacher;
  set({ ...state, teacher: { ...state.teacher, ...values } });
  // spesialisasi berupa teks bebas di layar ini, hanya disimpan di HP (daftar resmi dipilih saat daftar)
  const body = {
    ...(values.title !== undefined ? { headline: values.title } : {}),
    ...(values.about !== undefined ? { about: values.about } : {}),
    ...(values.availability !== undefined ? { availability: values.availability } : {}),
    ...(values.price !== undefined ? { pricePerSession: Number(values.price.replace(/\D/g, '')) } : {}),
  };
  if (!Object.keys(body).length) return;
  api('/teachers/me', { method: 'PATCH', body }).catch((e) => {
    set({ ...state, teacher: before });
    showAlert('Perubahan belum tersimpan', errorMessage(e));
  });
}

export function updatePsychologist(values: Partial<State['psychologist']>) {
  set({ ...state, psychologist: { ...state.psychologist, ...values } });
}

export function toggleSetting(key: string) {
  set({ ...state, settings: { ...state.settings, [key]: !state.settings[key] } });
}

// ganti foto profil dari galeri, langsung dipakai di semua avatar dengan nama yang sama
export async function changePhoto(name: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showAlert('Izin dibutuhkan', 'Izinkan akses galeri untuk mengganti foto profil.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return;
  const uri = result.assets[0].uri;
  const before = state.photos;
  // tampil langsung di HP, lalu disimpan ke server supaya terlihat pengguna lain & tetap ada setelah aplikasi ditutup
  set({ ...state, photos: { ...state.photos, [name]: uri } });
  try {
    const avatarUrl = await uploadFile(uri, 'avatar');
    await api('/auth/me', { method: 'PATCH', body: { avatarUrl } });
    updateSession({ avatarUrl });
    showAlert('Foto berhasil diganti', 'Foto profil barumu kini terlihat juga di Komunitas dan chat.');
  } catch (e) {
    set({ ...state, photos: before });
    showAlert('Foto belum tersimpan', errorMessage(e));
  }
}
