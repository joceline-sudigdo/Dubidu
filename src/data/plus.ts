// data Dubidu Plus & pembayaran (mengikuti versi dubidu-app lama)
import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

export type PlusRole = 'parent' | 'teacher';
export type PlusPlan = 'bulanan' | 'tahunan';

export const plusPlans: Record<PlusRole, { key: PlusPlan; title: string; price: number; note: string; badge?: string }[]> = {
  teacher: [
    { key: 'bulanan', title: 'Bulanan', price: 49000, note: 'per bulan' },
    { key: 'tahunan', title: 'Tahunan', price: 490000, note: 'per tahun · setara Rp40.800/bln', badge: 'Hemat 17%' },
  ],
  parent: [
    { key: 'bulanan', title: 'Bulanan', price: 59000, note: 'per bulan' },
    { key: 'tahunan', title: 'Tahunan', price: 590000, note: 'per tahun · setara Rp49.100/bln', badge: 'Hemat 17%' },
  ],
};

type FeatherName = ComponentProps<typeof Feather>['name'];

export const plusBenefits: Record<PlusRole, { icon: FeatherName; title: string; text: string }[]> = {
  teacher: [
    { icon: 'repeat', title: 'Swipe tanpa batas', text: 'Lihat semua profil anak tanpa kuota harian' },
    { icon: 'trending-up', title: 'Profil lebih terlihat', text: 'Muncul lebih atas di pencarian orang tua' },
    { icon: 'percent', title: 'Komisi lebih rendah', text: 'Biaya platform turun dari 10% jadi 5%' },
    { icon: 'award', title: 'Badge Plus', text: 'Tanda pendamping aktif & profesional' },
  ],
  parent: [
    { icon: 'repeat', title: 'Swipe tanpa batas', text: 'Lihat semua shadow teacher tanpa kuota harian' },
    { icon: 'message-circle', title: 'Chat banyak pendamping', text: 'Diskusi dengan beberapa shadow teacher sekaligus' },
    { icon: 'users', title: 'Tambah lebih dari 1 anak', text: 'Kelola profil & report card untuk semua anak' },
    { icon: 'heart', title: 'Diskon konsultasi 20%', text: 'Hemat saat konsultasi dengan psikolog mitra' },
  ],
};

export const plusCompare: Record<PlusRole, { label: string; free: string | boolean; plus: string | boolean }[]> = {
  teacher: [
    { label: 'Swipe per hari', free: '5 anak', plus: 'Tanpa batas' },
    { label: 'Biaya platform', free: '10%', plus: '5%' },
    { label: 'Boost profil', free: false, plus: true },
    { label: 'Badge Plus', free: false, plus: true },
  ],
  parent: [
    { label: 'Swipe per hari', free: '5 teacher', plus: 'Tanpa batas' },
    { label: 'Chat pendamping', free: '1 aktif', plus: 'Tanpa batas' },
    { label: 'Profil anak', free: '1 anak', plus: 'Tanpa batas' },
    { label: 'Diskon psikolog', free: false, plus: '20%' },
  ],
};

export type Bank = { key: string; name: string; short: string; color: string; prefix: string };

export const vaBanks: Bank[] = [
  { key: 'bca', name: 'BCA', short: 'BCA', color: '#0060AF', prefix: '39358' },
  { key: 'mandiri', name: 'Bank Mandiri', short: 'MDR', color: '#003D79', prefix: '89608' },
  { key: 'bni', name: 'BNI', short: 'BNI', color: '#F15A23', prefix: '98808' },
  { key: 'bri', name: 'BRI', short: 'BRI', color: '#00529C', prefix: '26215' },
  { key: 'bsi', name: 'Bank Syariah Indonesia', short: 'BSI', color: '#00A39D', prefix: '90021' },
  { key: 'permata', name: 'PermataBank', short: 'PMT', color: '#D71920', prefix: '85281' },
  { key: 'cimb', name: 'CIMB Niaga', short: 'CIMB', color: '#7B1E1E', prefix: '59190' },
  { key: 'btn', name: 'BTN', short: 'BTN', color: '#0F4C99', prefix: '90010' },
  { key: 'lainnya', name: 'Bank Lainnya (ATM Bersama / Prima)', short: 'ATM', color: '#8C847A', prefix: '89300' },
];

export const qrisSteps = [
  'Buka aplikasi m-banking atau e-wallet kamu.',
  'Pilih menu Scan / Bayar QRIS, lalu arahkan kamera ke kode QR.',
  'Pastikan nama merchant DUBIDU dan nominal sudah sesuai.',
  'Konfirmasi dengan PIN, lalu kembali ke Dubidu dan tekan Cek Status Pembayaran.',
];

export const vaSteps = (bank: Bank) => [
  `Buka m-banking / ATM ${bank.name}.`,
  'Pilih menu Transfer > Virtual Account.',
  'Masukkan nomor Virtual Account di atas, pastikan nama tujuan DUBIDU.',
  'Konfirmasi pembayaran, lalu kembali ke Dubidu dan tekan Cek Status Pembayaran.',
];
