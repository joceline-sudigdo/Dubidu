// data dummy shadow teacher + logika matching sederhana, nanti diganti hasil dari backend
import type { Child } from './parent';

export type Skill = 'speech' | 'communication' | 'adhd' | 'sensory' | 'social' | 'autism' | 'academic';

export const SKILL_LABELS: Record<Skill, string> = {
  speech: 'Speech Delay',
  communication: 'Komunikasi',
  adhd: 'ADHD & Fokus',
  sensory: 'Sensori',
  social: 'Interaksi Sosial',
  autism: 'Autisme',
  academic: 'Akademik',
};

export type Teacher = {
  id: string;
  name: string;
  city: string;
  price: number;
  rating: number;
  reviews: number;
  experience: number;
  responseRate: number;
  sessions: number;
  about: string;
  skills: Record<Skill, number>;
  // alasan kecocokan untuk anak yang sedang dicari (dari server)
  reasons?: string[];
  caution?: string | null;
};

const s = (
  speech: number,
  communication: number,
  adhd: number,
  sensory: number,
  social: number,
  autism: number,
  academic: number
): Record<Skill, number> => ({ speech, communication, adhd, sensory, social, autism, academic });

export const teacherPool: Teacher[] = [
  { id: 't-sarah', name: 'Sarah Aulia, S.Psi', city: 'Malang', price: 150000, rating: 4.9, reviews: 28, experience: 4, responseRate: 96, sessions: 210, about: 'Sabar dan telaten, terbiasa memakai metode PECS untuk anak speech delay.', skills: s(95, 90, 72, 60, 70, 55, 65) },
  { id: 't-rina', name: 'Rina Kartika, S.Pd', city: 'Malang', price: 130000, rating: 4.8, reviews: 41, experience: 5, responseRate: 92, sessions: 320, about: 'Spesialis ADHD dengan pendekatan rutinitas visual dan token economy.', skills: s(60, 70, 94, 82, 72, 60, 80) },
  { id: 't-dimas', name: 'Dimas Prasetyo, S.Pd', city: 'Malang', price: 120000, rating: 4.7, reviews: 19, experience: 3, responseRate: 98, sessions: 140, about: 'Energik, fokus pada regulasi sensori dan aktivitas motorik di kelas.', skills: s(55, 62, 80, 93, 66, 70, 58) },
  { id: 't-nadia', name: 'Nadia Putri, S.Psi', city: 'Batu', price: 160000, rating: 4.9, reviews: 52, experience: 6, responseRate: 90, sessions: 410, about: 'Berpengalaman di sekolah inklusi, kuat di interaksi sosial dan autisme.', skills: s(68, 80, 70, 75, 94, 92, 70) },
  { id: 't-bayu', name: 'Bayu Saputra, S.Pd', city: 'Malang', price: 110000, rating: 4.6, reviews: 15, experience: 2, responseRate: 95, sessions: 90, about: 'Guru SD dengan sertifikasi pendamping ABK, kuat di bidang akademik.', skills: s(58, 64, 76, 60, 65, 52, 92) },
  { id: 't-citra', name: 'Citra Maharani, S.Psi', city: 'Malang', price: 145000, rating: 4.8, reviews: 33, experience: 4, responseRate: 93, sessions: 250, about: 'Terapis wicara bersertifikat, telaten membangun kosakata anak.', skills: s(93, 94, 58, 62, 74, 66, 60) },
  { id: 't-kevin', name: 'Kevin Aditya, S.Psi', city: 'Surabaya', price: 155000, rating: 4.7, reviews: 24, experience: 4, responseRate: 89, sessions: 180, about: 'Fokus pada ADHD dan manajemen emosi dengan pendekatan CBT anak.', skills: s(52, 66, 92, 78, 70, 58, 74) },
  { id: 't-maya', name: 'Maya Lestari, S.Pd', city: 'Surabaya', price: 140000, rating: 4.9, reviews: 47, experience: 7, responseRate: 91, sessions: 520, about: 'Pendamping senior untuk anak autisme, berpengalaman metode ABA.', skills: s(70, 78, 66, 84, 90, 96, 72) },
  { id: 't-fajar', name: 'Fajar Nugroho, S.Pd', city: 'Malang', price: 100000, rating: 4.5, reviews: 11, experience: 2, responseRate: 97, sessions: 70, about: 'Ramah dan sabar, cocok untuk anak yang butuh latihan fokus belajar.', skills: s(62, 60, 82, 70, 64, 50, 84) },
  { id: 't-intan', name: 'Intan Permata, S.Psi', city: 'Batu', price: 135000, rating: 4.8, reviews: 30, experience: 5, responseRate: 94, sessions: 300, about: 'Menguasai sensory integration dan aktivitas regulasi diri.', skills: s(60, 68, 84, 95, 72, 78, 62) },
  { id: 't-galih', name: 'Galih Ramadhan, S.Pd', city: 'Malang', price: 125000, rating: 4.6, reviews: 18, experience: 3, responseRate: 90, sessions: 120, about: 'Kuat di komunikasi dan interaksi sosial lewat permainan kelompok.', skills: s(80, 88, 62, 58, 86, 70, 60) },
  { id: 't-wulan', name: 'Wulan Sari, S.Psi', city: 'Surabaya', price: 150000, rating: 4.8, reviews: 36, experience: 5, responseRate: 92, sessions: 280, about: 'Fokus pada anak spektrum autisme dengan pendekatan visual schedule.', skills: s(72, 76, 64, 80, 88, 93, 66) },
];

// teacher contoh untuk akun demo orang tua (disalin sebelum teacherPool dikosongkan saat logout).
// Ayas Sudigdo selalu tampil di Teacher Matching akun demo.
export const AYAS: Teacher = {
  id: 't-ayas', name: 'Ayas Sudigdo, S.Pd', city: 'Malang', price: 145000, rating: 4.9, reviews: 24, experience: 4, responseRate: 99, sessions: 230,
  about: 'Mendampingi anak speech delay dan autisme di sekolah inklusi dengan pendekatan bermain dan visual support.',
  skills: s(88, 92, 76, 74, 90, 86, 72),
};
export const demoTeachers: Teacher[] = [AYAS, ...teacherPool];

export const MATCH_COUNT = 5;
export const MAX_SKIPS = 5;

// skor kecocokan dari server per anak: serverMatch[childId][teacherId] = 0–99
export const serverMatch: Record<string, Record<string, number>> = {};

export function matchScore(teacher: Teacher, child: Child) {
  const fromServer = serverMatch[child.id]?.[teacher.id];
  if (fromServer !== undefined) return fromServer;
  const need = child.needs.reduce((sum, k) => sum + teacher.skills[k], 0) / child.needs.length;
  const rating = (teacher.rating / 5) * 100;
  const location = teacher.city === child.city ? 100 : 60;
  return Math.min(99, Math.round(need * 0.75 + rating * 0.15 + location * 0.1));
}

export function topSkills(teacher: Teacher, count = 3) {
  return (Object.keys(teacher.skills) as Skill[])
    .sort((a, b) => teacher.skills[b] - teacher.skills[a])
    .slice(0, count);
}

export function initialMatches(child: Child) {
  return [...teacherPool].sort((a, b) => matchScore(b, child) - matchScore(a, child)).slice(0, MATCH_COUNT);
}

// pengganti teacher yang di-skip: cari yang kompetensinya paling mirip dan tetap cocok dengan anak
export function findReplacement(skipped: Teacher, child: Child, excludeIds: string[]) {
  const skills = Object.keys(skipped.skills) as Skill[];
  const similarity = (t: Teacher) =>
    100 - skills.reduce((sum, k) => sum + Math.abs(t.skills[k] - skipped.skills[k]), 0) / skills.length;

  const candidates = teacherPool.filter((t) => !excludeIds.includes(t.id));
  if (candidates.length === 0) return null;
  return candidates.sort(
    (a, b) => matchScore(b, child) + similarity(b) - (matchScore(a, child) + similarity(a))
  )[0];
}

export function formatPrice(value: number) {
  return `Rp${value.toLocaleString('id-ID').replace(/,/g, '.')}/jam`;
}

// teacher yang sudah terhubung dengan orang tua (tidak ikut di daftar matching)
export const connectedTeachers: Teacher[] = [
  { id: 'nielsen', name: 'Nielsen Dave, S.Pd', city: 'Malang', price: 150000, rating: 4.9, reviews: 34, experience: 5, responseRate: 97, sessions: 260, about: 'Berpengalaman dengan metode PECS dan stimulasi wicara aktif di kelas inklusi.', skills: s(92, 90, 80, 72, 76, 64, 70) },
  { id: 'larasati', name: 'Larasati Sudigdo, S.Psi', city: 'Malang', price: 140000, rating: 4.8, reviews: 22, experience: 4, responseRate: 94, sessions: 190, about: 'Pendamping ADHD dan sensorik, telaten membangun rutinitas harian anak.', skills: s(64, 70, 91, 88, 72, 60, 74) },
  { id: 't-sarahp', name: 'Sarah Putri, S.Pd', city: 'Surabaya', price: 145000, rating: 4.7, reviews: 16, experience: 3, responseRate: 90, sessions: 110, about: 'Fokus pada anak spektrum autisme dengan pendekatan visual.', skills: s(66, 72, 62, 80, 86, 91, 64) },
  { id: 't-citras', name: 'Citra Sari, S.Pd', city: 'Batu', price: 125000, rating: 4.6, reviews: 12, experience: 2, responseRate: 92, sessions: 80, about: 'Menguasai sensori integrasi untuk anak usia TK dan SD awal.', skills: s(60, 64, 70, 90, 70, 72, 60) },
];

// dibaca setiap kali dipanggil: kedua daftar diisi dari server setelah login
const allTeachers = () => [...teacherPool, ...connectedTeachers];

const baseName = (name: string) => name.split(',')[0].trim().toLowerCase();

export function findTeacher(id: string) {
  return allTeachers().find((t) => t.id === id);
}

// cari id teacher dari nama (nama depan saja juga bisa)
export function teacherIdByName(name: string) {
  const target = baseName(name);
  return (
    allTeachers().find((t) => baseName(t.name) === target) ??
    allTeachers().find((t) => baseName(t.name).split(' ')[0] === target.split(' ')[0])
  )?.id;
}
