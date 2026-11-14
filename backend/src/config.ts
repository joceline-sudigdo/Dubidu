import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi (lihat .env.example)`);
  return value;
}

const env = (name: string) => process.env[name] || undefined;

// Nilai opsional dibaca lewat getter supaya bisa diubah tanpa restart saat pengujian.
export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  // daftar origin yang boleh akses API (web admin), pisahkan dengan koma. Kosong = semua.
  corsOrigins: (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  get publicUrl() {
    return env("PUBLIC_URL") ?? `http://localhost:${process.env.PORT ?? 4000}`;
  },
  get cloudinaryUrl() {
    return env("CLOUDINARY_URL");
  },

  // --- AI (Doobie + AI matching) ---
  get anthropicApiKey() {
    return env("ANTHROPIC_API_KEY");
  },
  get doobieModel() {
    return env("DOOBIE_MODEL") ?? "claude-opus-5-5";
  },
  get matchingModel() {
    return env("MATCHING_MODEL") ?? "claude-opus-5-5";
  },

  // --- Pembayaran ---
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 10),
  get midtransServerKey() {
    return env("MIDTRANS_SERVER_KEY");
  },
  get midtransIsProduction() {
    return process.env.MIDTRANS_IS_PRODUCTION === "true";
  },
  /**
   * - "manual"   : transfer ke QRIS GoPay / rekening bank + upload bukti, dikonfirmasi admin
   * - "midtrans" : payment gateway Midtrans (otomatis)
   * - "mock"     : demo, tombol bayar langsung lunas
   * Kosong → "midtrans" kalau MIDTRANS_SERVER_KEY diisi, selain itu "mock".
   */
  get paymentMode(): "manual" | "midtrans" | "mock" {
    const mode = env("PAYMENT_MODE");
    if (mode === "mock" || mode === "midtrans" || mode === "manual") return mode;
    return env("MIDTRANS_SERVER_KEY") ? "midtrans" : "mock";
  },
  /** Batas waktu transfer manual sebelum pesanan batal otomatis (menit) */
  get manualPaymentExpiryMinutes() {
    return Number(env("MANUAL_PAYMENT_EXPIRY_MINUTES") ?? 120);
  },
  get appScheme() {
    return env("APP_SCHEME") ?? "dubidu"; // = "scheme" di app.json frontend
  },

  // --- Email (lupa password) ---
  get smtp() {
    return {
      host: env("SMTP_HOST"),
      port: Number(env("SMTP_PORT") ?? 465),
      user: env("SMTP_USER"),
      pass: env("SMTP_PASS"),
      from: env("MAIL_FROM") ?? `DUBIDU <${env("SMTP_USER") ?? "no-reply@dubidu.id"}>`,
    };
  },

  // --- Video call ---
  get dailyApiKey() {
    return env("DAILY_API_KEY");
  },

  // --- Push notification ---
  get expoAccessToken() {
    return env("EXPO_ACCESS_TOKEN"); // opsional, hanya jika "enhanced push security" aktif
  },
};
