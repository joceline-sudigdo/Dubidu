import { createHash, randomInt } from "node:crypto";

import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma } from "../db.js";
import { writeAudit } from "../lib/audit.js";
import { forgetUserStatus, me, requireAuth, signToken } from "../lib/auth.js";
import { HttpError, parse } from "../lib/http.js";
import { resetPasswordEmail, sendMail } from "../lib/mail.js";
import { warmMatchesForChild } from "../lib/aiMatching.js";
import { presentChild, publicUser } from "../lib/present.js";
import { childInput, createChild } from "./children.js";
import { teacherStats } from "./matching.js";

export const authRouter = Router();

// akun demo dipakai bersama oleh banyak penguji, jadi tidak boleh dihapus / diganti password-nya
const DEMO_LOCKED = "Akun demo dipakai bersama, jadi tidak bisa dihapus atau diganti kata sandinya. Daftar akun sendiri untuk mencoba fitur ini.";

const contactSchema = z
  .string()
  .trim()
  .min(5, "Isi email atau nomor HP")
  .transform((v) => v.toLowerCase());

const password = z.string().min(6, "Password minimal 6 karakter");

/** Pisahkan "contact" jadi email atau phone (frontend memakai satu kolom untuk keduanya). */
function splitContact(contact: string) {
  if (contact.includes("@")) return { email: contact, phone: null };
  const phone = contact.replace(/[^\d+]/g, "").replace(/^\+62/, "0");
  if (phone.length < 9) throw new HttpError(400, "Nomor HP tidak valid");
  return { email: null, phone };
}

const registerSchema = z.object({
  role: z.enum(["PARENT", "TEACHER"]), // psikolog dibuat oleh admin
  fullName: z.string().trim().min(2),
  nickname: z.string().trim().optional(),
  contact: contactSchema,
  password,
  domicile: z.string().trim().optional(),
  ktpUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // registrasi orang tua sekaligus membuat profil anak pertama (layar child-data & child-needs)
  child: childInput.optional(),
});

/**
 * POST /api/auth/check-contact { contact } → { available, message? }
 * Dipakai layar daftar langkah pertama supaya email/HP yang sudah terdaftar
 * langsung diberi tahu saat menekan Next, bukan di langkah terakhir.
 */
authRouter.post("/check-contact", async (req, res) => {
  const { contact } = parse(z.object({ contact: contactSchema }), req.body);
  const { email, phone } = splitContact(contact);
  const exists = await prisma.user.findFirst({ where: email ? { email } : { phone }, select: { id: true } });
  res.json(exists ? { available: false, message: "Email / nomor HP sudah terdaftar, silakan login" } : { available: true });
});

/**
 * POST /api/auth/register
 * Orang tua: kirim data akun + identity + child (+ conditions) dalam satu request.
 * File (KTP, rekam medis) diupload SETELAH dapat token lewat POST /api/uploads,
 * lalu simpan URL-nya lewat PATCH /api/auth/me dan PATCH /api/children/:id.
 */
authRouter.post("/register", async (req, res) => {
  const body = parse(registerSchema, req.body);
  const { email, phone } = splitContact(body.contact);

  const exists = await prisma.user.findFirst({ where: email ? { email } : { phone } });
  if (exists) throw new HttpError(409, "Email / nomor HP sudah terdaftar, silakan login");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        role: body.role,
        fullName: body.fullName,
        nickname: body.nickname ?? body.fullName.split(" ")[0],
        email,
        phone,
        passwordHash: await bcrypt.hash(body.password, 10),
        domicile: body.domicile,
        ktpUrl: body.ktpUrl,
        latitude: body.latitude,
        longitude: body.longitude,
        teacherProfile: body.role === "TEACHER" ? { create: {} } : undefined,
      },
    });
    if (body.role === "PARENT" && body.child) {
      await createChild(tx, created.id, body.child);
    }
    return created;
  });

  const children = await prisma.child.findMany({
    where: { parentId: user.id },
    include: { needs: { include: { needOption: true } } },
  });
  for (const c of children) warmMatchesForChild(c.id);

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user),
    children: children.map(presentChild),
  });
});

/**
 * POST /api/auth/login  { contact, password, portal? }
 * portal "admin" (dipakai web admin): hanya akun ADMIN yang boleh masuk, dan setiap percobaan dicatat di audit log.
 */
authRouter.post("/login", async (req, res) => {
  const body = parse(
    z.object({ contact: contactSchema, password: z.string().min(1), portal: z.enum(["app", "admin"]).default("app") }),
    req.body,
  );
  const { email, phone } = body.contact.includes("@")
    ? { email: body.contact, phone: undefined }
    : { email: undefined, phone: body.contact.replace(/[^\d+]/g, "").replace(/^\+62/, "0") };

  const user = await prisma.user.findFirst({ where: email ? { email } : { phone } });
  const valid = Boolean(user && (await bcrypt.compare(body.password, user.passwordHash)));
  if (body.portal === "admin" && (!valid || user?.role !== "ADMIN" || !user.isActive)) {
    await writeAudit(req, null, {
      action: "AUTH_LOGIN_FAILED",
      targetType: "ADMIN",
      targetLabel: body.contact,
      reason: !valid ? "Email atau kata sandi salah" : user?.role !== "ADMIN" ? "Bukan akun admin" : "Akun admin nonaktif",
    });
    throw new HttpError(401, "Email atau kata sandi salah");
  }
  if (!user || !valid) throw new HttpError(401, "Email/nomor HP atau password salah");
  if (!user.isActive) throw new HttpError(403, "Akun dinonaktifkan, hubungi admin");
  if (body.portal === "admin") {
    await writeAudit(req, user, { action: "AUTH_LOGIN", targetType: "ADMIN", targetId: user.id, targetLabel: user.email ?? user.fullName });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

/** GET /api/auth/me — profil lengkap user yang sedang login */
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: me(req).id },
    include: {
      teacherProfile: { include: { specializations: { include: { needOption: true } }, documents: true, skills: true } },
      psychologistProfile: true,
      children: { include: { needs: { include: { needOption: true } } }, orderBy: { createdAt: "asc" } },
      subscriptions: { where: { active: true, endsAt: { gt: new Date() } }, orderBy: { endsAt: "desc" }, take: 1 },
    },
  });
  if (!user) throw new HttpError(401, "Akun tidak ditemukan");

  const { children, subscriptions, ...rest } = user;
  const sessionsDone = await prisma.session.count({
    where: {
      status: "DONE",
      engagement: user.role === "TEACHER" ? { teacherUserId: user.id } : { parentId: user.id },
    },
  });

  // tingkat respons chat teacher (null = belum pernah menerima chat)
  const responseRate = user.role === "TEACHER" ? ((await teacherStats([user.id])).get(user.id)?.responseRate ?? null) : null;

  res.json({
    user: publicUser(rest as typeof user),
    teacherProfile: rest.teacherProfile,
    psychologistProfile: rest.psychologistProfile,
    children: children.map(presentChild),
    plan: subscriptions[0] ?? null,
    stats: { sessionsDone, points: user.points, joined: user.createdAt, responseRate },
  });
});

const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  nickname: z.string().trim().optional(),
  domicile: z.string().trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  ktpUrl: z.string().url().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

/** PATCH /api/auth/me */
authRouter.patch("/me", requireAuth, async (req, res) => {
  const data = parse(updateMeSchema, req.body);
  const user = await prisma.user.update({ where: { id: me(req).id }, data });
  res.json({ user: publicUser(user) });
});

/**
 * DELETE /api/auth/me { confirm: "HAPUS" } — hapus akun atas permintaan pengguna.
 * Data pribadi dikosongkan & akun dinonaktifkan; riwayat transaksi tetap tersimpan untuk pembukuan.
 */
authRouter.delete("/me", requireAuth, async (req, res) => {
  parse(z.object({ confirm: z.literal("HAPUS") }), req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  if (user.role === "ADMIN") throw new HttpError(400, "Akun admin tidak bisa dihapus dari aplikasi");
  if (user.isDemo) throw new HttpError(403, DEMO_LOCKED);
  await prisma.$transaction([
    prisma.deviceToken.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        suspendedReason: "Dihapus atas permintaan pengguna",
        fullName: "Pengguna Dubidu",
        nickname: null,
        email: null,
        phone: null,
        avatarUrl: null,
        ktpUrl: null,
        domicile: null,
        latitude: null,
        longitude: null,
        payoutBankName: null,
        payoutAccountNumber: null,
        payoutAccountName: null,
      },
    }),
  ]);
  forgetUserStatus(user.id);
  res.status(204).end();
});

/** POST /api/auth/change-password { oldPassword, newPassword } */
authRouter.post("/change-password", requireAuth, async (req, res) => {
  const body = parse(z.object({ oldPassword: z.string(), newPassword: password }), req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me(req).id } });
  if (user.isDemo) throw new HttpError(403, DEMO_LOCKED);
  if (!(await bcrypt.compare(body.oldPassword, user.passwordHash))) {
    throw new HttpError(400, "Password lama salah");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(body.newPassword, 10) },
  });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
//  Lupa password (kode OTP 6 digit lewat email)
// ---------------------------------------------------------------------------

const RESET_TTL_MIN = 15;
const hashCode = (code: string) => createHash("sha256").update(`${code}:${config.jwtSecret}`).digest("hex");

/**
 * POST /api/auth/forgot-password { email }
 * Selalu membalas 200 (tidak memberi tahu apakah email terdaftar, demi keamanan).
 */
authRouter.post("/forgot-password", async (req, res) => {
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email("Email tidak valid") }), req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  const reply = { ok: true, message: "Jika email terdaftar, kode reset sudah dikirim. Cek inbox/spam ya." };
  // akun demo dipakai bersama: password-nya tidak bisa direset
  if (!user || !user.isActive || user.isDemo) return res.json(reply);

  // maksimal 3 permintaan per 15 menit
  const recent = await prisma.passwordReset.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESET_TTL_MIN * 60000) } },
  });
  if (recent >= 3) throw new HttpError(429, "Terlalu banyak permintaan. Coba lagi 15 menit lagi.");

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.passwordReset.create({
    data: { userId: user.id, codeHash: hashCode(code), expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60000) },
  });
  const mail = resetPasswordEmail(user.nickname ?? user.fullName, code);
  try {
    await sendMail(email, mail.subject, mail.html, mail.text);
  } catch (err) {
    // mis. App Password Gmail salah → jangan tampilkan "kesalahan server" ke user, cukup catat di log
    console.error("Gagal mengirim email reset password:", err);
    throw new HttpError(503, "Email belum bisa dikirim saat ini. Coba lagi beberapa saat lagi.");
  }

  // Khusus pengujian otomatis: kode ikut dikirim di respons. JANGAN aktifkan di server online.
  res.json(process.env.MAIL_TEST_RETURN_CODE === "true" ? { ...reply, testCode: code } : reply);
});

/** POST /api/auth/reset-password { email, code, newPassword } */
authRouter.post("/reset-password", async (req, res) => {
  const body = parse(
    z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/, "Kode harus 6 angka"), newPassword: password }),
    req.body,
  );
  const invalid = new HttpError(400, "Kode salah atau sudah kedaluwarsa");
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) throw invalid;

  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!reset || reset.attempts >= 5) throw invalid;
  if (reset.codeHash !== hashCode(body.code)) {
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
    throw invalid;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.newPassword, 10) } }),
    prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  res.json({ ok: true, token: signToken(user), user: publicUser(user) });
});

// ---------------------------------------------------------------------------
//  Perangkat (Expo push token)
// ---------------------------------------------------------------------------

/** POST /api/auth/devices { token, platform } — panggil setelah login & izin notifikasi diberikan */
authRouter.post("/devices", requireAuth, async (req, res) => {
  const body = parse(
    z.object({
      token: z.string().regex(/^Expo(nent)?PushToken\[.+\]$/, "Bukan Expo push token"),
      platform: z.enum(["ios", "android", "web"]).optional(),
    }),
    req.body,
  );
  const device = await prisma.deviceToken.upsert({
    where: { token: body.token },
    create: { token: body.token, platform: body.platform, userId: me(req).id },
    update: { userId: me(req).id, platform: body.platform, lastUsedAt: new Date() },
  });
  res.status(201).json(device);
});

/** DELETE /api/auth/devices { token } — panggil saat logout supaya HP tidak menerima notifikasi akun ini lagi */
authRouter.delete("/devices", requireAuth, async (req, res) => {
  const { token } = parse(z.object({ token: z.string() }), req.body);
  await prisma.deviceToken.deleteMany({ where: { token, userId: me(req).id } });
  res.status(204).end();
});
