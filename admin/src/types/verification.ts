import type { VerificationStatus } from "./user";

// Pengajuan verifikasi shadow teacher. Dasar: `TeacherProfile`, `TeacherDocument`,
// `TeacherSpecialization` di schema. Rekomendasi psikolog & catatan revisi = kolom/tabel baru.

export type DocumentType = "KTP" | "IJAZAH" | "SERTIFIKAT" | "CV" | "LAINNYA";

export type TeacherDocument = {
  id: string;
  type: DocumentType;
  label: string; // "Ijazah S1", "Sertifikat ABA"
  url: string | null; // null = belum diunggah
  status: VerificationStatus;
  note: string | null;
};

// hasil tinjauan psikolog di aplikasi (tab Verifikasi psikolog)
export type PsychologistReview = {
  psychologistName: string;
  recommendation: "verified" | "revision" | "rejected";
  issues: string[];
  note: string;
  interview: string | null; // "Kamis, 8 Okt · 13:00 (online)"
  reviewedAt: string;
};

// status keputusan admin. REVISION = kolom baru (minta perbaikan, belum ditolak)
export type DecisionStatus = "PENDING" | "REVISION" | "VERIFIED" | "REJECTED";

export type TeacherApplication = {
  id: string; // id TeacherProfile
  userId: string;
  fullName: string;
  title: string | null;
  domicile: string;
  education: string; // "S1 Pendidikan Luar Biasa – Universitas Negeri Malang"
  experienceYears: number;
  pricePerSession: number;
  specializations: string[]; // label NeedOption
  // level keahlian 0–100: self = penilaian teacher, level = nilai yang dipakai matching
  skillLevels: Record<string, { self: number; level: number; adminAdjusted: boolean }>;
  bio: string;
  documents: TeacherDocument[];
  psychologistReview: PsychologistReview | null;
  status: DecisionStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  submittedAt: string;
};
