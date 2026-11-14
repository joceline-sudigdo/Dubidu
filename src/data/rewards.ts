// data Doobie Rewards: level, misi harian, dan hadiah (per role)
import type Feather from '@expo/vector-icons/Feather';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

import type { Tone } from '@/components/parent/tones';

import type { PlusRole } from './plus';

type FeatherName = ComponentProps<typeof Feather>['name'];

// tema tumbuh kembang: dari tunas sampai legenda. perk = hadiah eksklusif level itu (ikon + label singkat)
export const LEVELS: { level: number; name: string; min: number; perk?: { icon: FeatherName; label: string } }[] = [
  { level: 1, name: 'Tunas', min: 0 },
  { level: 2, name: 'Mekar', min: 300 },
  { level: 3, name: 'Bersinar', min: 800 },
  { level: 4, name: 'Bintang', min: 2000, perk: { icon: 'percent', label: '15%' } },
  { level: 5, name: 'Legenda', min: 4000, perk: { icon: 'heart', label: 'Gratis' } },
];

export const LEVEL_TITLE: Record<PlusRole, string> = { parent: 'Keluarga', teacher: 'Pendamping' };

export function levelOf(points: number) {
  const current = [...LEVELS].reverse().find((l) => points >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > points);
  return { current, next };
}

export type Mission = {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  icon: FeatherName;
  tone: Tone;
  // done = sudah dikerjakan, tinggal klaim
  done?: boolean;
  action: { label: string; href?: Href; share?: string };
};

export const missions: Record<PlusRole, Mission[]> = {
  parent: [
    { id: 'm-report', title: 'Isi laporan perkembangan', subtitle: 'Evaluasi mingguan si kecil', reward: 30, icon: 'check-circle', tone: 'green', done: true, action: { label: 'Klaim' } },
    { id: 'm-review', title: 'Beri ulasan teacher', subtitle: 'Review sesi Kak Nielsen', reward: 50, icon: 'edit-3', tone: 'blue', action: { label: 'Kerjakan', href: '/beri-ulasan' } },
    { id: 'm-webinar', title: 'Ikut kelas komunitas', subtitle: 'Webinar Sensory Play', reward: 40, icon: 'users', tone: 'yellow', action: { label: 'Daftar', href: '/komunitas' } },
    { id: 'm-invite', title: 'Ajak teman bergabung', subtitle: 'Kode: DEVI24', reward: 200, icon: 'user-plus', tone: 'yellow', action: { label: 'Bagikan', share: 'Yuk gabung Dubidu! Pakai kode DEVI24 untuk bonus ikan 🐟' } },
  ],
  teacher: [
    { id: 't-report', title: 'Kirim laporan harian', subtitle: 'Sesi Elisya hari ini', reward: 40, icon: 'check-circle', tone: 'green', done: true, action: { label: 'Klaim' } },
    { id: 't-review', title: 'Balas ulasan orang tua', subtitle: 'Ulasan dari Saras Elizabeth', reward: 30, icon: 'message-square', tone: 'blue', action: { label: 'Kerjakan', href: '/teacher/ulasan' } },
    { id: 't-match', title: 'Ajukan diri ke 1 anak', subtitle: 'Bantu anak yang menunggu', reward: 50, icon: 'heart', tone: 'red', action: { label: 'Cari', href: '/teacher/cari-anak' } },
    { id: 't-invite', title: 'Ajak rekan pendamping', subtitle: 'Kode: PRAS24', reward: 200, icon: 'user-plus', tone: 'yellow', action: { label: 'Bagikan', share: 'Gabung jadi shadow teacher di Dubidu! Pakai kode PRAS24 🐟' } },
  ],
};

export type RewardCategory = 'Voucher' | 'Cashback' | 'Kesehatan';

export type Reward = {
  id: string;
  title: string;
  subtitle: string;
  cost: number;
  category: RewardCategory;
  icon: FeatherName;
  tone: Tone;
  minLevel?: number;
};

export const rewards: Record<PlusRole, Reward[]> = {
  parent: [
    { id: 'r-kopi', title: 'Voucher Kopi Rp25rb', subtitle: 'Fore & Kopi Kenangan', cost: 300, category: 'Voucher', icon: 'coffee', tone: 'yellow' },
    { id: 'r-belanja', title: 'Voucher Belanja Rp50rb', subtitle: 'Superindo / Alfagift', cost: 600, category: 'Voucher', icon: 'shopping-bag', tone: 'green' },
    { id: 'r-cashback', title: 'Cashback Sesi 10%', subtitle: 'Sesi shadow teacher', cost: 400, category: 'Cashback', icon: 'percent', tone: 'blue' },
    { id: 'r-terapi', title: 'Diskon Terapi 20%', subtitle: 'Wicara & Okupasi', cost: 500, category: 'Kesehatan', icon: 'activity', tone: 'red' },
    { id: 'r-mainan', title: 'Paket Mainan Edukatif', subtitle: 'Kit motorik anak', cost: 900, category: 'Voucher', icon: 'gift', tone: 'yellow' },
    { id: 'r-psikolog', title: 'Psikolog GRATIS', subtitle: '1x Sesi 45 Menit', cost: 2500, category: 'Kesehatan', icon: 'heart', tone: 'red', minLevel: 5 },
  ],
  teacher: [
    { id: 'tr-kopi', title: 'Voucher Kopi Rp25rb', subtitle: 'Fore & Kopi Kenangan', cost: 300, category: 'Voucher', icon: 'coffee', tone: 'yellow' },
    { id: 'tr-fee', title: 'Potongan Biaya Platform', subtitle: '0% untuk 1 termin', cost: 700, category: 'Cashback', icon: 'percent', tone: 'blue' },
    { id: 'tr-boost', title: 'Boost Profil 7 Hari', subtitle: 'Tampil paling atas', cost: 500, category: 'Cashback', icon: 'trending-up', tone: 'green' },
    { id: 'tr-kelas', title: 'Kelas Sertifikasi 30%', subtitle: 'Pelatihan ABA & PECS', cost: 900, category: 'Kesehatan', icon: 'award', tone: 'red' },
    { id: 'tr-alat', title: 'Paket Alat Peraga', subtitle: 'Kartu & media visual', cost: 1200, category: 'Voucher', icon: 'gift', tone: 'yellow' },
    { id: 'tr-konsul', title: 'Supervisi Psikolog', subtitle: '1x Sesi 45 Menit', cost: 2500, category: 'Kesehatan', icon: 'heart', tone: 'red', minLevel: 5 },
  ],
};

export const NEXT_GOAL: Record<PlusRole, { label: string; cost: number }> = {
  parent: { label: 'Konsultasi Psikolog GRATIS', cost: 2000 },
  teacher: { label: 'Kelas Sertifikasi GRATIS', cost: 2000 },
};
