import { randomInt } from "node:crypto";

import { Router, type Request } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma, type PaymentPurpose, type Role } from "../db.js";
import { ensureConversation, isDemoUser } from "../lib/access.js";
import { me, requireAuth, requireRole } from "../lib/auth.js";
import { countPromoUse, plusPrices } from "../lib/content.js";
import { hhmm, shortDate } from "../lib/dates.js";
import { forbidden, HttpError, notFound, param, parse } from "../lib/http.js";
import { createMeetingRoom } from "../lib/meeting.js";
import { createSnapTransaction, getTransactionStatus, mapStatus, type MidtransNotification, verifySignature } from "../lib/midtrans.js";
import { notify, notifyAdmins } from "../lib/notify.js";
import { dynamicQris, qrisFromImageUrl } from "../lib/qris.js";

// ---------------------------------------------------------------------------
//  Pembayaran
//  - Mode "midtrans" (MIDTRANS_SERVER_KEY diisi): aplikasi memanggil
//    POST /payments/:id/checkout → buka redirectUrl Midtrans → Midtrans mengirim
//    webhook ke POST /api/payments/midtrans/notification → markPaid().
//  - Mode "manual" (PAYMENT_MODE=manual): user transfer ke QRIS GoPay / rekening bank
//    sebesar amountDue (nominal + kode unik) → upload bukti (POST /payments/:id/proof)
//    → admin cek mutasi & konfirmasi di web admin (POST /admin/payments/:id/confirm) → markPaid().
//  - Mode "mock" (tanpa server key): POST /payments/:id/pay langsung lunas (demo).
// ---------------------------------------------------------------------------

const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  CONSULTATION: "Konsultasi Psikolog DUBIDU",
  ENGAGEMENT: "Fee Pendampingan Shadow Teacher",
  SUBSCRIPTION: "Dubidu Plus",
};

const activeMethods = () =>
  prisma.paymentMethod.findMany({ where: { active: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

/**
 * Tujuan transfer untuk satu tagihan. Metode QRIS mendapat `qrString`: QRIS dinamis yang nominalnya
 * sudah terisi. Teks QRIS statis dibaca sekali dari gambar yang diunggah admin, lalu disimpan.
 */
const unreadableQr = new Map<string, number>();

async function methodsForAmount(amountDue: number) {
  const methods = await activeMethods();
  return Promise.all(
    methods.map(async ({ qrisPayload, ...m }) => {
      if (m.type !== "QRIS") return { ...m, qrString: null };
      let payload = qrisPayload;
      // gambar yang gagal dibaca tidak dicoba lagi selama 10 menit (supaya checkout tetap cepat)
      const failedAt = unreadableQr.get(m.qrImageUrl ?? "");
      if (!payload && m.qrImageUrl && !(failedAt && Date.now() - failedAt < 10 * 60 * 1000)) {
        payload = await qrisFromImageUrl(m.qrImageUrl);
        if (payload) await prisma.paymentMethod.update({ where: { id: m.id }, data: { qrisPayload: payload } }).catch(() => {});
        else unreadableQr.set(m.qrImageUrl, Date.now());
      }
      return { ...m, qrString: payload ? dynamicQris(payload, amountDue) : null };
    }),
  );
}

export async function createPayment(input: {
  userId: string;
  purpose: PaymentPurpose;
  referenceId: string;
  amount: number;
  payeeUserId?: string;
  payeeAmount?: number;
}) {
  return prisma.payment.create({
    data: {
      ...input,
      // invoiceNo dipakai sebagai order_id Midtrans (unik, maks 50 karakter)
      invoiceNo: `DUB-${Date.now().toString(36).toUpperCase()}${randomInt(100, 999)}`,
      expiresAt: new Date(
        Date.now() + (config.paymentMode === "manual" ? config.manualPaymentExpiryMinutes : 60) * 60 * 1000,
      ),
    },
  });
}

/** Tandai lunas + jalankan efeknya (konsultasi terkonfirmasi + ruang meeting, Plus aktif, dll). Idempotent. */
export async function markPaid(paymentId: string, method: string, extra: { paymentType?: string } = {}) {
  // updateMany bersyarat → aman walau webhook datang dua kali bersamaan
  const changed = await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: "PAID" } },
    data: { status: "PAID", method, paidAt: new Date(), paymentType: extra.paymentType },
  });
  const paid = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (changed.count === 0) return paid;

  if (paid.purpose === "CONSULTATION") {
    const c = await prisma.consultation.update({
      where: { id: paid.referenceId },
      data: { status: "CONFIRMED" },
      include: { psychologist: true },
    });
    if (c.promoCode) await countPromoUse(c.promoCode).catch((err) => console.error("Gagal mencatat pemakaian promo:", err));
    if (c.type !== "CHAT") {
      try {
        const meeting = await createMeetingRoom(c);
        await prisma.consultation.update({
          where: { id: c.id },
          data: { meetingProvider: meeting.provider, meetingRoom: meeting.room, meetingUrl: meeting.url },
        });
      } catch (err) {
        console.error("Gagal membuat ruang meeting (akan dibuat ulang saat join):", err);
      }
    }
    await ensureConversation("PSYCHOLOGIST", c.parentId, c.psychologist.userId, c.childId);
    await notify({
      userId: c.psychologist.userId,
      category: "BOOKING",
      icon: "calendar-check",
      tone: "blue",
      title: "Sesi konsultasi baru",
      body: `Ada sesi konsultasi terkonfirmasi pada ${shortDate(c.scheduledAt)} pukul ${hhmm(c.scheduledAt)}.`,
      tag: "Jadwal Sesi",
      action: "Lihat Detail",
      link: `/konsultasi/${c.id}`,
    });
  }

  if (paid.purpose === "SUBSCRIPTION") {
    await prisma.subscription.update({ where: { id: paid.referenceId }, data: { active: true } });
  }

  if (paid.purpose === "ENGAGEMENT" && paid.payeeUserId) {
    await notify({
      userId: paid.payeeUserId,
      category: "BOOKING",
      icon: "cash",
      tone: "green",
      title: "Pembayaran diterima",
      body: `Orang tua sudah membayar Rp${paid.amount.toLocaleString("id-ID")} untuk sesi pendampingan.`,
      tag: `Invoice #${paid.invoiceNo}`,
    });
  }

  await notify({
    userId: paid.userId,
    category: "BOOKING",
    icon: "receipt",
    tone: "green",
    title: "Pembayaran Berhasil",
    body: `Pembayaran Rp${paid.amount.toLocaleString("id-ID")} berhasil dan tersimpan di riwayat transaksi.`,
    tag: `Invoice #${paid.invoiceNo}`,
    action: "Lihat Bukti",
    link: `/pembayaran/${paid.id}`,
  });

  return paid;
}

/** Pembayaran gagal/kedaluwarsa → batalkan konsultasi & lepas slot psikolog. */
export async function markUnpaid(paymentId: string, status: "FAILED" | "EXPIRED") {
  const changed = await prisma.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status } });
  const p = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (changed.count === 0) return p;
  if (p.purpose === "CONSULTATION") {
    const c = await prisma.consultation.findUnique({ where: { id: p.referenceId } });
    if (c && c.status === "PENDING_PAYMENT") {
      await prisma.$transaction([
        prisma.consultation.update({ where: { id: c.id }, data: { status: "CANCELLED", slotId: null } }),
        ...(c.slotId ? [prisma.psychologistSlot.update({ where: { id: c.slotId }, data: { isBooked: false } })] : []),
      ]);
    }
  }
  return p;
}

/** Dijalankan berkala dari index.ts: pembayaran yang lewat batas waktu → EXPIRED */
export async function expireStalePayments() {
  const stale = await prisma.payment.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const p of stale) await markUnpaid(p.id, "EXPIRED");
  return stale.length;
}

/** Terapkan status dari Midtrans (webhook atau cek manual) */
async function applyGatewayStatus(n: MidtransNotification) {
  const payment = await prisma.payment.findUnique({ where: { invoiceNo: n.order_id } });
  if (!payment) return null;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayStatus: n.transaction_status, gatewayPayload: n as object, paymentType: n.payment_type },
  });
  if (Number(n.gross_amount) !== payment.amount) {
    console.error(`Nominal Midtrans tidak cocok untuk ${n.order_id}: ${n.gross_amount} vs ${payment.amount}`);
    return payment;
  }
  const status = mapStatus(n.transaction_status, n.fraud_status);
  if (status === "PAID") return markPaid(payment.id, "midtrans", { paymentType: n.payment_type });
  if (status === "FAILED" || status === "EXPIRED") return markUnpaid(payment.id, status);
  return payment;
}

// --- webhook (TANPA login, diverifikasi dengan signature) ---------------------

export const paymentWebhookRouter = Router();

/** POST /api/payments/midtrans/notification — isi URL ini di Dashboard Midtrans */
paymentWebhookRouter.post("/midtrans/notification", async (req, res) => {
  const n = req.body as MidtransNotification;
  if (!n?.order_id || !verifySignature(n)) {
    return res.status(403).json({ error: "Signature tidak valid" });
  }
  await applyGatewayStatus(n);
  res.json({ ok: true });
});

/** GET /api/payments/finish — halaman setelah bayar; mengarahkan kembali ke aplikasi */
paymentWebhookRouter.get("/finish", (req, res) => {
  const orderId = encodeURIComponent(String(req.query.order_id ?? ""));
  const deepLink = `${config.appScheme}://pembayaran?order_id=${orderId}`;
  res
    .status(200)
    .type("html")
    .send(
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${deepLink}">` +
        `<body style="font-family:sans-serif;text-align:center;padding:40px;background:#FAF3E8;color:#2C3E50">` +
        `<h2>Terima kasih! 🐻‍❄️</h2><p>Kembali ke aplikasi DUBIDU…</p><p><a href="${deepLink}">Buka DUBIDU</a></p></body>`,
    );
});

// --- endpoint untuk user ---------------------------------------------------

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

/** GET /api/payments/methods — daftar QRIS & rekening tujuan yang aktif (dipasang sebelum /:id) */
paymentsRouter.get("/methods", async (_req, res) => {
  res.json((await activeMethods()).map(({ qrisPayload: _q, ...m }) => m));
});

/** GET /api/payments — riwayat transaksi saya */
paymentsRouter.get("/", async (req, res) => {
  const rows = await prisma.payment.findMany({ where: { userId: me(req).id }, orderBy: { createdAt: "desc" } });
  res.json(rows.map(({ gatewayPayload: _g, ...p }) => p));
});

async function loadOwnPayment(req: Request) {
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pembayaran");
  if (p.userId !== me(req).id) throw forbidden();
  return p;
}

/** GET /api/payments/:id */
paymentsRouter.get("/:id", async (req, res) => {
  const p = await prisma.payment.findUnique({ where: { id: param(req, "id") } });
  if (!p) throw notFound("Pembayaran");
  if (p.userId !== me(req).id && p.payeeUserId !== me(req).id) throw forbidden();
  const { gatewayPayload: _g, ...rest } = p;
  res.json(rest);
});

/**
 * POST /api/payments/:id/checkout
 * → { mode: "midtrans", snapToken, redirectUrl }  buka redirectUrl dengan expo-web-browser
 * → { mode: "mock" }                              panggil POST /payments/:id/pay
 */
paymentsRouter.post("/:id/checkout", async (req, res) => {
  const p = await loadOwnPayment(req);
  if (p.status === "PAID") throw new HttpError(409, "Pembayaran ini sudah lunas");
  if (p.status !== "PENDING" || (p.expiresAt && p.expiresAt < new Date())) {
    if (p.status === "PENDING") await markUnpaid(p.id, "EXPIRED");
    throw new HttpError(410, "Batas waktu pembayaran sudah lewat, silakan pesan ulang");
  }
  if (config.paymentMode === "mock") return res.json({ mode: "mock", paymentId: p.id });

  if (config.paymentMode === "manual") {
    const withCode = p.amountDue ? p : await assignUniqueCode(p.id, p.amount);
    const methods = await methodsForAmount(withCode.amountDue!);
    return res.json({
      mode: "manual",
      paymentId: p.id,
      invoiceNo: p.invoiceNo,
      amount: p.amount,
      uniqueCode: withCode.uniqueCode,
      amountDue: withCode.amountDue, // nominal PERSIS yang harus ditransfer
      expiresAt: p.expiresAt,
      methods,
      steps: [
        methods.some((m) => m.qrString)
          ? `Scan QRIS di bawah: nominal Rp${withCode.amountDue!.toLocaleString("id-ID")} (termasuk kode unik ${withCode.uniqueCode}) terisi otomatis. Untuk transfer bank, ketik nominal yang sama persis.`
          : `Transfer tepat Rp${withCode.amountDue!.toLocaleString("id-ID")} (termasuk kode unik ${withCode.uniqueCode}) ke salah satu tujuan di bawah.`,
        "Simpan screenshot / bukti transfer.",
        "Upload bukti dan isi nama pemilik akun pengirim.",
        "Admin mengecek dan mengonfirmasi, biasanya kurang dari 1 jam pada jam kerja.",
      ],
    });
  }

  if (p.snapToken && p.redirectUrl) {
    return res.json({ mode: "midtrans", snapToken: p.snapToken, redirectUrl: p.redirectUrl });
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: p.userId } });
  const snap = await createSnapTransaction({
    orderId: p.invoiceNo,
    amount: p.amount,
    itemName: PURPOSE_LABEL[p.purpose],
    customer: { name: user.fullName, email: user.email, phone: user.phone },
    expiryMinutes: Math.floor(((p.expiresAt?.getTime() ?? Date.now() + 3600000) - Date.now()) / 60000),
    finishUrl: `${config.publicUrl}/api/payments/finish`,
  });
  await prisma.payment.update({ where: { id: p.id }, data: { snapToken: snap.token, redirectUrl: snap.redirectUrl } });
  res.json({ mode: "midtrans", snapToken: snap.token, redirectUrl: snap.redirectUrl });
});

/** POST /api/payments/:id/refresh — cek status langsung ke Midtrans (setelah kembali dari halaman bayar) */
paymentsRouter.post("/:id/refresh", async (req, res) => {
  const p = await loadOwnPayment(req);
  if (config.paymentMode === "midtrans" && p.status === "PENDING" && p.snapToken) {
    const status = await getTransactionStatus(p.invoiceNo);
    if (status?.transaction_status) await applyGatewayStatus(status);
  }
  const { gatewayPayload: _g, ...fresh } = await prisma.payment.findUniqueOrThrow({ where: { id: p.id } });
  res.json(fresh);
});

// --- transfer manual (QRIS GoPay / rekening bank) ----------------------------

/** Kode unik 1–999 supaya nominal transfer tidak kembar dengan pesanan lain yang sedang menunggu. */
async function assignUniqueCode(paymentId: string, amount: number) {
  for (let i = 0; i < 30; i++) {
    const code = randomInt(1, 1000);
    const clash = await prisma.payment.findFirst({
      where: { amountDue: amount + code, status: { in: ["PENDING", "VERIFYING"] } },
      select: { id: true },
    });
    if (!clash) {
      return prisma.payment.update({ where: { id: paymentId }, data: { uniqueCode: code, amountDue: amount + code } });
    }
  }
  throw new HttpError(503, "Sedang banyak transaksi, coba beberapa saat lagi");
}

/**
 * POST /api/payments/:id/proof { methodId, proofUrl, senderName, note? }
 * User sudah transfer → upload bukti (URL dari POST /api/uploads?folder=bukti-bayar) → status VERIFYING.
 */
paymentsRouter.post("/:id/proof", async (req, res) => {
  if (config.paymentMode !== "manual") throw new HttpError(400, "Upload bukti hanya untuk mode transfer manual");
  const body = parse(
    z.object({
      methodId: z.string(),
      proofUrl: z.string().url(),
      senderName: z.string().trim().min(2, "Isi nama pemilik akun pengirim").max(100),
      note: z.string().max(300).optional(),
    }),
    req.body,
  );
  const p = await loadOwnPayment(req);
  if (p.status === "PAID") throw new HttpError(409, "Pembayaran ini sudah lunas");
  if (p.status === "VERIFYING") throw new HttpError(409, "Bukti transfer sudah dikirim, tunggu dicek admin");
  if (p.status !== "PENDING" || (p.expiresAt && p.expiresAt < new Date())) {
    if (p.status === "PENDING") await markUnpaid(p.id, "EXPIRED");
    throw new HttpError(410, "Batas waktu pembayaran sudah lewat, silakan pesan ulang");
  }
  const method = await prisma.paymentMethod.findFirst({ where: { id: body.methodId, active: true } });
  if (!method) throw notFound("Metode pembayaran");

  const updated = await prisma.payment.update({
    where: { id: p.id },
    data: {
      status: "VERIFYING",
      manualMethodId: method.id,
      proofUrl: body.proofUrl,
      proofSenderName: body.senderName,
      proofNote: body.note,
      proofSubmittedAt: new Date(),
      rejectReason: null,
    },
  });
  const nominal = `Rp${(p.amountDue ?? p.amount).toLocaleString("id-ID")}`;
  await notify({
    userId: p.userId,
    category: "BOOKING",
    icon: "timer-sand",
    tone: "yellow",
    title: "Bukti transfer diterima",
    body: `Pembayaran ${nominal} sedang dicek admin. Kamu akan mendapat notifikasi setelah dikonfirmasi.`,
    tag: `Invoice #${p.invoiceNo}`,
    link: `/pembayaran/${p.id}`,
  });
  await notifyAdmins({
    category: "BOOKING",
    icon: "cash-check",
    tone: "blue",
    title: "Bukti transfer baru",
    body: `${body.senderName} mengirim bukti ${nominal} via ${method.label}. Cek mutasi lalu konfirmasi.`,
    tag: `Invoice #${p.invoiceNo}`,
    action: "Cek Pembayaran",
    link: `/admin/payments/${p.id}`,
  });
  const { gatewayPayload: _g, ...rest } = updated;
  res.json(rest);
});

/** POST /api/payments/:id/pay — HANYA mode mock (demo tanpa Midtrans) */
paymentsRouter.post("/:id/pay", async (req, res) => {
  if (config.paymentMode !== "mock") throw new HttpError(400, "Selesaikan pembayaran lewat POST /payments/:id/checkout");
  const p = await loadOwnPayment(req);
  if (p.status === "PENDING" && p.expiresAt && p.expiresAt < new Date()) {
    await markUnpaid(p.id, "EXPIRED");
    throw new HttpError(410, "Batas waktu pembayaran sudah lewat");
  }
  const { gatewayPayload: _g, ...paid } = await markPaid(p.id, "mock");
  res.json(paid);
});

// ---------------------------------------------------------------------------
//  Dubidu Plus (langganan)
// ---------------------------------------------------------------------------


export const subscriptionRouter = Router();
subscriptionRouter.use(requireAuth, requireRole("PARENT", "TEACHER"));

/** GET /api/subscription — status Plus + harga */
subscriptionRouter.get("/", async (req, res) => {
  const user = me(req);
  const active = await prisma.subscription.findFirst({
    where: { userId: user.id, active: true, endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
  });
  const consultationsUsed = active
    ? await prisma.consultation.count({
        where: { parentId: user.id, status: { in: ["CONFIRMED", "COMPLETED"] }, createdAt: { gte: active.startsAt } },
      })
    : 0;
  res.json({
    active: Boolean(active),
    plan: active?.plan ?? null,
    until: active ? shortDate(active.endsAt) : null,
    consultationsUsed,
    prices: await plusPrices(user.role as "PARENT" | "TEACHER"),
  });
});

/** DELETE /api/subscription — khusus akun demo: Plus langsung berhenti (akun asli tetap aktif sampai akhir periode) */
subscriptionRouter.delete("/", async (req, res) => {
  const user = me(req);
  if (!(await isDemoUser(user.id))) throw forbidden("Langganan tetap aktif sampai akhir periode");
  const now = new Date();
  await prisma.subscription.updateMany({
    where: { userId: user.id, active: true, endsAt: { gt: now } },
    data: { active: false, endsAt: now },
  });
  res.json({ active: false });
});

/** POST /api/subscription { plan: MONTHLY|YEARLY } → { subscription, payment } */
subscriptionRouter.post("/", async (req, res) => {
  const user = me(req);
  const { plan } = parse(z.object({ plan: z.enum(["MONTHLY", "YEARLY"]) }), req.body);
  const price = (await plusPrices(user.role as "PARENT" | "TEACHER"))[plan];

  // tagihan Plus yang belum selesai dipakai lagi (tidak membuat tagihan dobel saat tombol ditekan ulang)
  const open = await prisma.payment.findMany({
    where: { userId: user.id, purpose: "SUBSCRIPTION", status: { in: ["PENDING", "VERIFYING"] } },
    orderBy: { createdAt: "desc" },
  });
  for (const p of open) {
    const sub = await prisma.subscription.findUnique({ where: { id: p.referenceId } });
    const stillOpen = p.status === "VERIFYING" || !p.expiresAt || p.expiresAt > new Date();
    if (sub && sub.plan === plan && stillOpen) {
      return res.json({ subscription: sub, payment: p, reused: true });
    }
    // paket lain / sudah lewat batas waktu → tagihan lama dibatalkan (bukti yang sedang dicek admin tidak disentuh)
    if (p.status === "PENDING") await markUnpaid(p.id, stillOpen ? "FAILED" : "EXPIRED");
  }

  const current = await prisma.subscription.findFirst({
    where: { userId: user.id, active: true, endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
  });
  const startsAt = current?.endsAt ?? new Date(); // perpanjang dari akhir langganan sekarang
  const endsAt = new Date(startsAt);
  if (plan === "MONTHLY") endsAt.setMonth(endsAt.getMonth() + 1);
  else endsAt.setFullYear(endsAt.getFullYear() + 1);

  const subscription = await prisma.subscription.create({ data: { userId: user.id, plan, price, startsAt, endsAt } });
  const payment = await createPayment({ userId: user.id, purpose: "SUBSCRIPTION", referenceId: subscription.id, amount: price });
  res.status(201).json({ subscription, payment });
});
