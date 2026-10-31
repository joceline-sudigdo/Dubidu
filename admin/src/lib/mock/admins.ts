import "server-only";

import type { AdminUser } from "@/types/admin";

// Akun admin dummy, setara hasil `npm run admin:create` di backend.
// Kata sandi demo ada di admin/README.md. Hash = scrypt "salt:hash".
export const mockAdmins: (AdminUser & { passwordHash: string })[] = [
  {
    id: "adm_01",
    role: "ADMIN",
    fullName: "Admin Dubidu",
    email: "admin@dubidu.id",
    avatarUrl: null,
    isActive: true,
    createdAt: "2026-10-30T15:30:50.000Z",
    passwordHash:
      "6a71a359a9b091c572bf8e74cf284982:4bd20e84fb61eb1472e97c78c8d121132bb2ec2cf4597fab6d9dc03c427cb7d83d59923a0cbb15a4819bf799fe036200ee4f545ea250f9da8aaf952c533fa029",
  },
];
