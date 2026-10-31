// Mengikuti model `User` di backend (prisma/schema.prisma), khusus role ADMIN.
// passwordHash tidak pernah ikut dikirim ke halaman.

export type Role = "PARENT" | "TEACHER" | "PSYCHOLOGIST" | "ADMIN";

export type AdminUser = {
  id: string;
  role: "ADMIN";
  fullName: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string; // ISO
};
