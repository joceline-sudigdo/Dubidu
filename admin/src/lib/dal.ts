import "server-only";

import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAdminById } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { AdminUser } from "@/types/admin";

// Admin pemilik sesi saat ini, atau null. "use cache: private" = dibaca saat request
// (boleh pakai cookies & jam sekarang), hasilnya hanya disimpan sebentar di browser.
export async function getSessionAdmin(): Promise<AdminUser | null> {
  "use cache: private";
  cacheLife({ stale: 60 });
  const session = await readSession();
  return session ? getAdminById(session.adminId) : null;
}

// Data Access Layer: semua halaman & Server Action memanggil ini sebelum membaca/mengubah data.
// cache() → sesi dibaca sekali per request walau dipanggil di banyak komponen.
export const getCurrentAdmin = cache(async () => {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/login");
  return admin;
});
