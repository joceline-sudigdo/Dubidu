import "server-only";

// Env khusus server. Jangan pernah diimpor dari komponen "use client".
const DEV_SECRET = "dev-only-secret-ganti-di-production-minimal-32-karakter";

export const env = {
  backendApiUrl: process.env.BACKEND_API_URL ?? "https://dubidu-api.vercel.app",
  get sessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (secret && secret.length >= 32) return secret;
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET wajib diisi (minimal 32 karakter) di production");
    }
    return DEV_SECRET;
  },
};
