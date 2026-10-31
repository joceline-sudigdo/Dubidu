// data growth timeline anak (rangkuman dari laporan sesi mingguan)
import type { Tone } from '@/components/parent/tones';

export const weeklyScores = [
  { label: '22 Agu', value: 2.8 },
  { label: '29 Agu', value: 3.0 },
  { label: '5 Sep', value: 3.1 },
  { label: '12 Sep', value: 3.4 },
  { label: '19 Sep', value: 3.5 },
  { label: '26 Sep', value: 3.7 },
];

// skor awal (sesi pertama) vs sekarang per aspek
export const aspectGrowth = [
  { label: 'Fokus & Konsentrasi', start: 2.5, now: 4.0, tone: 'green' as Tone },
  { label: 'Komunikasi', start: 3.0, now: 4.0, tone: 'green' as Tone },
  { label: 'Interaksi Sosial', start: 2.8, now: 3.2, tone: 'blue' as Tone },
  { label: 'Kemandirian', start: 2.6, now: 4.0, tone: 'green' as Tone },
  { label: 'Regulasi Emosi', start: 3.2, now: 3.0, tone: 'red' as Tone },
  { label: 'Akademik', start: 3.3, now: 3.8, tone: 'blue' as Tone },
];

export const milestones = [
  { date: '26 Sep 2026', title: 'Fokus 25 menit tanpa distraksi', text: 'Menyelesaikan puzzle kata tematik secara mandiri.', tone: 'green' as Tone },
  { date: '19 Sep 2026', title: 'Kontak mata spontan 3-4 detik', text: 'Saat berbagi krayon dengan teman sebangku.', tone: 'blue' as Tone },
  { date: '5 Sep 2026', title: 'Transisi bel istirahat tanpa tantrum', text: 'Berhasil dengan teknik deep pressure & afirmasi napas.', tone: 'yellow' as Tone },
  { date: '22 Agu 2026', title: 'Sesi pertama bersama Kak Nielsen', text: 'Asesmen awal dan perkenalan rutinitas kelas.', tone: 'red' as Tone },
];
