import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

import { config } from "./config.js";
import { prisma } from "./db.js";
import { errorHandler, HttpError } from "./lib/http.js";
import { LOCAL_UPLOAD_DIR } from "./lib/upload.js";
import { adminRouter } from "./routes/admin.js";
import { applicationsRouter } from "./routes/applications.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter, quickQuestionsRouter } from "./routes/chat.js";
import { checkinsRouter } from "./routes/checkins.js";
import { childrenRouter } from "./routes/children.js";
import { communityRouter } from "./routes/community.js";
import { contentRouter } from "./routes/content.js";
import { doobieRouter } from "./routes/doobie.js";
import { engagementsRouter, scheduleRouter, sessionsRouter } from "./routes/engagements.js";
import { homeRouter } from "./routes/home.js";
import { matchingRouter } from "./routes/matching.js";
import { metaRouter } from "./routes/meta.js";
import { contentReportsRouter } from "./routes/moderation.js";
import { notificationsRouter } from "./routes/notifications.js";
import { expireStalePayments, paymentsRouter, paymentWebhookRouter, subscriptionRouter } from "./routes/payments.js";
import { payoutsRouter } from "./routes/payouts.js";
import { consultationsRouter, psychologistsRouter } from "./routes/psychologists.js";
import { reportsRouter } from "./routes/reports.js";
import { favoritesRouter } from "./routes/favorites.js";
import { reviewsRouter, teachersRouter } from "./routes/teachers.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true }));
  app.use(express.json({ limit: "2mb" }));

  // Di Vercel (serverless) tidak ada timer yang jalan terus, jadi pesanan yang lewat batas
  // waktu bayar dibatalkan sambil melayani request (paling sering sekali per menit).
  if (process.env.VERCEL) {
    let lastRun = 0;
    app.use(async (_req, _res, next) => {
      if (Date.now() - lastRun > 60_000) {
        lastRun = Date.now();
        await expireStalePayments().catch((err) => console.error("Gagal memproses pembayaran kedaluwarsa:", err));
      }
      next();
    });
  }
  app.use("/uploads", express.static(LOCAL_UPLOAD_DIR));

  app.get("/", (_req, res) => res.json({ name: "DUBIDU API", docs: "/api/health" }));

  /** GET /api/health — cek server hidup & database tersambung (dipakai GitHub Actions untuk ping server) */
  app.get("/api/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, time: new Date().toISOString() });
  });

  const limited = (message: string) => ({ error: message });
  // anti tebak kata sandi — hanya percobaan yang GAGAL yang dihitung, jadi login normal tidak pernah terblokir
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limited("Terlalu banyak percobaan. Coba lagi 15 menit lagi."),
  });
  // anti pendaftaran massal & spam kode reset
  const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limited("Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti."),
  });
  // cek email/HP saat daftar: cukup longgar untuk pengguna, tapi membatasi pengecekan massal
  const checkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limited("Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti."),
  });
  // batas umum per alamat IP (chat mengecek pesan baru tiap 4 detik = ±75 request / 5 menit per layar)
  const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 1500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: limited("Terlalu banyak permintaan. Coba lagi sebentar lagi."),
  });

  const api = express.Router();
  api.use(apiLimiter);
  api.use(["/auth/login", "/auth/reset-password"], authLimiter);
  api.use(["/auth/register", "/auth/forgot-password"], signupLimiter);
  api.use("/auth/check-contact", checkLimiter);
  api.use("/auth", authRouter);
  // webhook Midtrans & halaman finish TANPA login → harus dipasang sebelum router yang memakai requireAuth global
  api.use("/payments", paymentWebhookRouter);
  api.use("/", metaRouter); // /meta/needs, /meta/app, /uploads
  api.use("/", contentRouter); // /content/:key (tanpa login), /rewards
  api.use("/children", childrenRouter);
  api.use("/home", homeRouter);
  api.use("/matching", matchingRouter);
  api.use("/applications", applicationsRouter);
  api.use("/engagements", engagementsRouter);
  api.use("/sessions", sessionsRouter);
  api.use("/schedule", scheduleRouter);
  api.use("/", reportsRouter); // /children/:id/reports, /reports/:id, /sessions/:id/report
  api.use("/conversations", chatRouter);
  api.use("/quick-questions", quickQuestionsRouter);
  api.use("/psychologists", psychologistsRouter);
  api.use("/consultations", consultationsRouter);
  api.use("/payments", paymentsRouter);
  api.use("/subscription", subscriptionRouter);
  api.use("/posts", communityRouter);
  api.use("/notifications", notificationsRouter);
  api.use("/checkins", checkinsRouter);
  api.use("/doobie", doobieRouter);
  api.use("/favorites", favoritesRouter);
  api.use("/teachers", teachersRouter);
  api.use("/reviews", reviewsRouter);
  api.use("/payouts", payoutsRouter);
  api.use("/content-reports", contentReportsRouter);
  api.use("/admin", adminRouter);
  app.use("/api", api);

  app.use((req, _res, next) => next(new HttpError(404, `Endpoint ${req.method} ${req.path} tidak ada`)));
  app.use(errorHandler);
  return app;
}
