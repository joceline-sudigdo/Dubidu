// Mengubah baris database jadi bentuk JSON yang dipakai frontend.
// Bentuknya sengaja dibuat mirip data dummy di frontend (src/data/parent.ts)
// supaya Joce tinggal mengganti import dummy dengan hasil fetch.

import type { NeedCategory, Skill, User } from "../db.js";
import { ageFrom } from "./dates.js";
import { childSkills, cityLabel, SKILL_KEY } from "./matching.js";

export type Tone = "blue" | "green" | "red" | "yellow" | "gray";

export const CATEGORY_TONE: Record<NeedCategory, Tone> = {
  KOMUNIKASI: "green",
  SOSIAL: "red",
  AKADEMIK: "yellow",
  SENSORIK: "blue",
  PERILAKU: "gray",
};

export const CATEGORY_LABEL: Record<NeedCategory, string> = {
  KOMUNIKASI: "Komunikasi",
  SOSIAL: "Sosial",
  AKADEMIK: "Akademik",
  SENSORIK: "Sensorik",
  PERILAKU: "Perilaku",
};

/** User tanpa passwordHash */
export function publicUser(user: User) {
  const { passwordHash: _hidden, ...rest } = user;
  return rest;
}

/** "Nielsen Dave, S.Pd" */
export function displayName(user: { fullName: string }, title?: string | null) {
  return title ? `${user.fullName}, ${title}` : user.fullName;
}

/** "Elisya Effriani" → "EE" */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

type ChildWithNeeds = {
  id: string;
  name: string;
  fullName: string;
  grade: string | null;
  schoolLevel: string | null;
  diagnosis: string | null;
  birthDate: Date | null;
  gender: string | null;
  avatarUrl: string | null;
  domicile: string | null;
  needs?: { needOption: { id: string; label: string; category: NeedCategory; skill?: Skill | null } }[];
};

export function presentChild(child: ChildWithNeeds) {
  const needs = (child.needs ?? []).map((n) => ({
    id: n.needOption.id,
    label: n.needOption.label,
    category: n.needOption.category,
    tone: CATEGORY_TONE[n.needOption.category],
  }));
  return {
    id: child.id,
    name: child.name,
    fullName: child.fullName,
    grade: child.grade ?? child.schoolLevel ?? "",
    schoolLevel: child.schoolLevel,
    age: ageFrom(child.birthDate),
    birthDate: child.birthDate ? child.birthDate.toISOString().slice(0, 10) : null,
    gender: child.gender,
    domicile: child.domicile,
    avatarUrl: child.avatarUrl,
    // teks singkat untuk kartu, contoh "ADHD & Regulasi Sensori"
    condition: child.diagnosis ?? needs.slice(0, 2).map((n) => n.label).join(" & "),
    city: cityLabel(child.domicile),
    needs,
    // bidang keahlian yang dibutuhkan (= Child.needs di frontend: ["adhd", "sensory"])
    skills: childSkills({ diagnosis: child.diagnosis, needs: (child.needs ?? []).map((n) => ({ needOption: { skill: n.needOption.skill ?? null } })) }).map((s) => SKILL_KEY[s]),
  };
}

/** Status & warna nilai report card (1–5) */
export function scoreStatus(value: number): { status: string; tone: Tone } {
  if (value >= 4.5) return { status: "Optimal", tone: "green" };
  if (value >= 4) return { status: "Tinggi", tone: "blue" };
  if (value >= 3) return { status: "Cukup", tone: "yellow" };
  return { status: "Perlu Perhatian", tone: "red" };
}
