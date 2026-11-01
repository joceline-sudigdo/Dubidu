import type { Role } from "./admin";

// Mengikuti `User` + `TeacherProfile` + `PsychologistProfile` di schema.prisma.
// Sengaja TIDAK ada data anak, KTP orang tua, passwordHash, atau isi chat.

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type AppUser = {
  id: string;
  role: Exclude<Role, "ADMIN">;
  fullName: string;
  email: string | null;
  phone: string | null;
  domicile: string | null;
  points: number; // saldo ikan
  isActive: boolean;
  suspendedReason: string | null; // kolom baru: alasan nonaktif
  plusActive: boolean; // ada Subscription aktif
  createdAt: string;
  lastActiveAt: string | null; // kolom baru
  isDemo: boolean; // akun contoh dari data demo, tidak dihitung di Ringkasan
  teacher?: {
    title: string | null;
    experienceYears: number;
    pricePerSession: number;
    verificationStatus: VerificationStatus;
    rating: number;
    reviewCount: number;
  };
  psychologist?: {
    title: string;
    place: string | null;
    experienceYears: number;
    basePrice: number;
    discountPercent: number;
    durationMinutes: number;
    categories: string[];
    rating: number;
    reviewCount: number;
  };
  activeEngagements: number; // jumlah kontrak aktif (tanpa detail anak)
};

export type NewPsychologistInput = {
  fullName: string;
  email: string;
  phone: string;
  title: string;
  place: string;
  experienceYears: number;
  basePrice: number;
  discountPercent: number;
  durationMinutes: number;
  categories: string[];
};
