// Smart-Matching berbasis profil (tanpa swipe)
//
// Skor dasar 0–99 (sama dengan rumus frontend `matchScore`):
//   75% kecocokan keahlian  → rata-rata level teacher (0–100) di bidang yang dibutuhkan anak
//   15% rating teacher       → rating/5 × 100 (teacher baru tanpa ulasan dianggap 70)
//   10% lokasi               → kota sama 100, ≤ 30 km 75, lebih jauh 45
// Lalu dinilai AI (lib/aiMatching.ts) dan digabung: 40% skor dasar + 60% skor AI.

import type { Skill } from "../db.js";

export const SKILLS: Skill[] = ["SPEECH", "COMMUNICATION", "ADHD", "SENSORY", "SOCIAL", "AUTISM", "ACADEMIC"];

/** Kunci & label bidang, sama dengan SKILL_LABELS di frontend */
export const SKILL_KEY: Record<Skill, string> = {
  SPEECH: "speech",
  COMMUNICATION: "communication",
  ADHD: "adhd",
  SENSORY: "sensory",
  SOCIAL: "social",
  AUTISM: "autism",
  ACADEMIC: "academic",
};
export const SKILL_LABEL: Record<Skill, string> = {
  SPEECH: "Speech Delay",
  COMMUNICATION: "Komunikasi",
  ADHD: "ADHD & Fokus",
  SENSORY: "Sensori",
  SOCIAL: "Interaksi Sosial",
  AUTISM: "Autisme",
  ACADEMIC: "Akademik",
};
const KEY_TO_SKILL = Object.fromEntries(Object.entries(SKILL_KEY).map(([k, v]) => [v, k as Skill]));
export const skillFromKey = (key: string) => KEY_TO_SKILL[key.toLowerCase()] as Skill | undefined;

/** Bidang yang dibutuhkan anak: dari pilihan kebutuhan + kata kunci di keterangan orang tua */
export function childSkills(child: { diagnosis?: string | null; needs: { needOption: { skill: Skill | null } }[] }) {
  const set = new Set<Skill>();
  for (const n of child.needs) if (n.needOption.skill) set.add(n.needOption.skill);
  const text = (child.diagnosis ?? "").toLowerCase();
  if (/autis|asd|spektrum/.test(text)) set.add("AUTISM");
  if (/adhd|hiperaktif|fokus/.test(text)) set.add("ADHD");
  if (/speech|wicara|bicara/.test(text)) set.add("SPEECH");
  if (/sensor/.test(text)) set.add("SENSORY");
  if (/disleksia|akademik|membaca|berhitung/.test(text)) set.add("ACADEMIC");
  return [...set];
}

/** Level teacher sebagai objek { speech: 90, ... } (bidang yang belum diisi = 0) */
export function skillMap(levels: { skill: Skill; level: number }[]) {
  const map = Object.fromEntries(SKILLS.map((s) => [SKILL_KEY[s], 0])) as Record<string, number>;
  for (const l of levels) map[SKILL_KEY[l.skill]] = l.level;
  return map;
}

const PROVINCE = /^(jawa|dki|di |daerah istimewa|banten|bali$|sumatera|sumatra|riau|jambi|bengkulu|lampung|bangka|kalimantan|sulawesi|gorontalo|maluku|papua|nusa tenggara|ntb|ntt|aceh|indonesia)/;

/** Nama kota dari domisili: "Lowokwaru, Malang" / "Malang, Jawa Timur" → "Malang" */
export function cityLabel(domicile?: string | null) {
  const parts = (domicile ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  const cities = parts.filter((p) => !PROVINCE.test(p.toLowerCase()));
  return cities.at(-1) ?? parts[0] ?? null;
}

/** Kota dalam huruf kecil untuk dibandingkan */
export function cityOf(domicile?: string | null) {
  return cityLabel(domicile)?.toLowerCase() ?? null;
}

export type ScoreInput = {
  childSkills: Skill[];
  teacherLevels: { skill: Skill; level: number }[];
  rating: number;
  reviewCount: number;
  sameCity: boolean;
  distanceKm: number | null;
};

export function matchScore(input: ScoreInput) {
  const levels = new Map(input.teacherLevels.map((l) => [l.skill, l.level]));
  const need = input.childSkills.length
    ? input.childSkills.reduce((sum, s) => sum + (levels.get(s) ?? 0), 0) / input.childSkills.length
    : 50;
  const rating = input.reviewCount > 0 ? (input.rating / 5) * 100 : 70;
  const location = input.sameCity ? 100 : input.distanceKm != null && input.distanceKm <= 30 ? 75 : 45;
  return Math.min(99, Math.round(need * 0.75 + rating * 0.15 + location * 0.1));
}

/** Bidang yang membuat teacher A lebih unggul dari B untuk anak ini (untuk kalimat rekomendasi) */
export function strongestDifference(childSkillList: Skill[], a: Record<string, number>, b: Record<string, number>) {
  const list = childSkillList.length ? childSkillList : SKILLS;
  return [...list].sort((x, y) => (a[SKILL_KEY[y]]! - b[SKILL_KEY[y]]!) - (a[SKILL_KEY[x]]! - b[SKILL_KEY[x]]!))[0]!;
}

/** Jarak dua titik (km) dengan rumus haversine. */
export function distanceKm(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
