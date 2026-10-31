// Uji alur lengkap DUBIDU dari sisi API (butuh database yang sudah di-migrate + seed).
// Jalankan: npm test
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

let base = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

before(async () => {
  process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-TEST";
  process.env.PAYMENT_MODE = "mock"; // tombol bayar demo tetap aktif untuk tes lama
  process.env.MAIL_TEST_RETURN_CODE = "true";
  delete process.env.ANTHROPIC_API_KEY; // tes tanpa AI (deck memakai skor aturan)
  delete process.env.DAILY_API_KEY; // video call memakai cadangan Jitsi
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(async () => {
  server.close();
  await prisma.$disconnect();
});

async function api(path: string, opts: { method?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(base + path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const login = async (contact: string, password = "dubidu123") => {
  const res = await api("/auth/login", { body: { contact, password } });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data.token as string;
};

describe("DUBIDU API", () => {
  const stamp = Date.now();
  let parentToken = "";
  let teacherToken = "";
  let childId = "";
  let teacherId = "";
  let psyToken = ""; // psikolog sungguhan (dibuat admin)
  let psyName = "";
  let applicationId = "";

  it("health check", async () => {
    const res = await api("/health");
    assert.equal(res.status, 200);
  });

  it("menolak request tanpa login", async () => {
    assert.equal((await api("/home/parent")).status, 401);
  });

  it("login akun dummy frontend tetap jalan", async () => {
    await login("parent@dubidu.id", "parent123");
    await login("081200000001", "parent123"); // via nomor HP
    const bad = await api("/auth/login", { body: { contact: "parent@dubidu.id", password: "salah" } });
    assert.equal(bad.status, 401);
  });

  it("registrasi orang tua + anak (alur register → identity → child-data → child-needs)", async () => {
    const res = await api("/auth/register", {
      body: {
        role: "PARENT",
        fullName: "Uji Coba Orang Tua",
        contact: `ortu${stamp}@test.id`,
        password: "rahasia123",
        domicile: "Malang",
        latitude: -7.97,
        longitude: 112.63,
        child: {
          name: "Budi",
          birthDate: "2017-03-03",
          gender: "MALE",
          schoolLevel: "SD",
          conditions: ["Speech delay", "Sulit fokus & konsentrasi"],
        },
      },
    });
    assert.equal(res.status, 201, JSON.stringify(res.data));
    parentToken = res.data.token;
    childId = res.data.children[0].id;
    assert.equal(res.data.children[0].needs.length, 2);

    const dup = await api("/auth/register", {
      body: { role: "PARENT", fullName: "Orang Tua Dobel", contact: `ortu${stamp}@test.id`, password: "rahasia123" },
    });
    assert.equal(dup.status, 409);

    const secondChild = await api("/children", { token: parentToken, body: { name: "Caca" } });
    assert.equal(secondChild.status, 402); // akun gratis maksimal 1 anak

    const badNeed = await api(`/children/${childId}`, { method: "PATCH", token: parentToken, body: { conditions: ["Tidak Ada"] } });
    assert.equal(badNeed.status, 400);
  });

  it("beranda orang tua", async () => {
    const res = await api(`/home/parent?childId=${childId}`, { token: parentToken });
    assert.equal(res.status, 200);
    assert.equal(res.data.selectedChildId, childId);
    assert.equal(res.data.checkin.days.length, 7);
  });

  it("teacher sungguhan: daftar → lengkapi profil → upload dokumen → diverifikasi admin", async () => {
    const reg = await api("/auth/register", {
      body: { role: "TEACHER", fullName: "Guru Uji Coba", contact: `guru${stamp}@test.id`, password: "rahasia123", domicile: "Malang", latitude: -7.97, longitude: 112.63 },
    });
    assert.equal(reg.status, 201, JSON.stringify(reg.data));
    teacherToken = reg.data.token;
    teacherId = reg.data.user.id;
    assert.equal(reg.data.user.isDemo, false);

    const profile = await api("/teachers/me", {
      method: "PATCH",
      token: teacherToken,
      body: { title: "S.Pd", headline: "Spesialis Speech Delay", pricePerSession: 150000, specializations: ["Speech delay", "Sulit fokus & konsentrasi"] },
    });
    assert.equal(profile.status, 200, JSON.stringify(profile.data));
    const early = await api("/matching/children", { token: teacherToken });
    assert.equal(early.status, 403); // belum terverifikasi
    await api("/teachers/me/documents", { token: teacherToken, body: { type: "IJAZAH", url: "https://example.com/ijazah.pdf" } });

    const admin = await login("admin@dubidu.id", "admin12345");
    const verify = await api(`/admin/teachers/${teacherId}/verification`, { method: "PATCH", token: admin, body: { status: "VERIFIED" } });
    assert.equal(verify.data.verificationStatus, "VERIFIED");

    // psikolog sungguhan dibuat admin, lalu membuka jadwal
    psyName = `Psikolog Uji ${stamp}`;
    const psy = await api("/admin/psychologists", {
      token: admin,
      body: { fullName: psyName, email: `psi${stamp}@test.id`, password: "rahasia123", title: "Psikolog Anak", categories: ["ADHD"], basePrice: 160000, discountPercent: 20 },
    });
    assert.equal(psy.status, 201, JSON.stringify(psy.data));
    psyToken = await login(`psi${stamp}@test.id`, "rahasia123");
    const slots = [1, 2, 3].flatMap((d) =>
      ["09:00", "10:30", "13:00"].map((t) => {
        const day = new Date(Date.now() + 7 * 3600000 + d * 86400000).toISOString().slice(0, 10);
        return `${day}T${t}:00+07:00`;
      }),
    );
    const opened = await api("/psychologists/me/slots", { token: psyToken, body: { startAts: slots } });
    assert.equal(opened.data.created, 9);
  });

  it("akun demo & user sungguhan terpisah", async () => {
    // user sungguhan tidak melihat teacher / psikolog / post demo
    const deck = await api(`/matching/teachers?childId=${childId}`, { token: parentToken });
    assert.ok(deck.data.cards.some((c: { id: string }) => c.id === teacherId));
    assert.ok(deck.data.cards.every((c: { fullName: string }) => !/Prasetyo|Nielsen|Larasati|Siti/.test(c.fullName)));
    const psys = await api("/psychologists", { token: parentToken });
    assert.ok(psys.data.some((p: { name: string }) => p.name === psyName));
    assert.ok(psys.data.every((p: { name: string }) => !p.name.startsWith("Amanda")));
    const feed = await api("/posts", { token: parentToken });
    assert.ok(feed.data.posts.every((p: { author: string }) => p.author !== "Bunda Arka"));

    // akses langsung ke data demo ditolak (404)
    const devi = await login("devi@dubidu.id");
    const demoPsy = (await api("/psychologists", { token: devi })).data.find((p: { name: string }) => p.name.startsWith("Amanda"));
    assert.equal((await api(`/psychologists/${demoPsy.id}`, { token: parentToken })).status, 404);
    assert.equal((await api(`/psychologists/${demoPsy.id}/availability`, { token: parentToken })).status, 404);
    assert.equal((await api("/consultations/quote", { token: parentToken, body: { psychologistId: demoPsy.id } })).status, 404);
    const pras = (await api("/home/parent", { token: devi })).data.activeTeachers.find((t: { name: string }) => t.name === "Pras");
    assert.equal((await api(`/teachers/${pras.teacherId}`, { token: parentToken })).status, 404);
    assert.equal((await api(`/matching/teachers/${pras.teacherId}/swipe`, { token: parentToken, body: { childId, direction: "LIKE" } })).status, 404);

    // akun demo tetap melihat dunia demo (untuk presentasi), bukan user sungguhan
    const deviHome = await api("/home/parent", { token: devi });
    const elisya = deviHome.data.children.find((c: { name: string }) => c.name === "Elisya").id;
    const deviDeck = await api(`/matching/teachers?childId=${elisya}`, { token: devi });
    assert.ok(deviDeck.data.cards.length > 0);
    assert.ok(deviDeck.data.cards.every((c: { id: string }) => c.id !== teacherId));
    assert.ok((await api("/psychologists", { token: devi })).data.every((p: { name: string }) => p.name !== psyName));

    // teacher sungguhan hanya melihat anak dari orang tua sungguhan
    const kids = await api("/matching/children", { token: teacherToken });
    assert.equal(kids.status, 200);
    assert.ok(kids.data.cards.some((c: { id: string }) => c.id === childId));
    assert.ok(kids.data.cards.every((c: { id: string }) => c.id !== elisya));

    // admin melihat semuanya + penanda demo
    const admin = await login("admin@dubidu.id", "admin12345");
    const demoUsers = await api("/admin/users?demo=true&pageSize=100", { token: admin });
    assert.ok(demoUsers.data.items.every((u: { isDemo: boolean }) => u.isDemo));
    assert.ok(demoUsers.data.items.some((u: { email: string }) => u.email === "devi@dubidu.id"));
    const stats = await api("/admin/stats", { token: admin });
    assert.equal(stats.data.isDemo, false);
    assert.ok(stats.data.demoUsers > 0);
  });

  it("beranda demo Devi sesuai desain", async () => {
    const token = await login("devi@dubidu.id");
    const res = await api("/home/parent", { token });
    assert.equal(res.data.greeting.name, "Devi");
    assert.deepEqual(res.data.children.map((c: { name: string }) => c.name), ["Elisya", "Cheryl", "Kiyoko"]);
    assert.ok(res.data.quickQuestion.text.includes("es krim"));
    assert.ok(res.data.activeTeachers.length >= 3);
  });

  it("smart matching: dek teacher urut skor & swipe LIKE membuat pengajuan", async () => {
    const deck = await api(`/matching/teachers?childId=${childId}`, { token: parentToken });
    assert.equal(deck.status, 200);
    assert.ok(deck.data.cards.length > 0);
    const scores = deck.data.cards.map((c: { matchPercent: number }) => c.matchPercent);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(deck.data.cards.every((c: { fullName: string }) => !c.fullName.startsWith("Bayu"))); // belum terverifikasi

    assert.ok(deck.data.cards.some((c: { id: string }) => c.id === teacherId));
    const like = await api(`/matching/teachers/${teacherId}/swipe`, {
      token: parentToken,
      body: { childId, direction: "LIKE" },
    });
    assert.equal(like.status, 201, JSON.stringify(like.data));
    applicationId = like.data.application.id;
  });

  it("teacher menerima pengajuan → chat otomatis terbuka", async () => {
    const list = await api("/applications?status=PENDING", { token: teacherToken });
    const app = list.data.find((a: { id: string }) => a.id === applicationId);
    assert.ok(app);
    assert.equal(app.child.name, "B"); // teacher hanya lihat inisial

    const self = await api(`/applications/${applicationId}`, { method: "PATCH", token: parentToken, body: { status: "ACCEPTED" } });
    assert.equal(self.status, 400); // pengaju tidak boleh menerima sendiri

    const res = await api(`/applications/${applicationId}`, { method: "PATCH", token: teacherToken, body: { status: "ACCEPTED" } });
    assert.equal(res.status, 200);
    assert.ok(res.data.conversationId);

    const msg = await api(`/conversations/${res.data.conversationId}/messages`, {
      token: parentToken,
      body: { type: "TEXT", text: "Halo Kak, terima kasih sudah menerima!" },
    });
    assert.equal(msg.status, 201);
    const convos = await api("/conversations", { token: teacherToken });
    const c = convos.data.find((x: { id: string }) => x.id === res.data.conversationId);
    assert.equal(c.unread, 1);
  });

  it("kontrak → jadwal sesi → report card → orang tua lihat laporan", async () => {
    const e = await api("/engagements", {
      token: parentToken,
      body: { applicationId, ratePerSession: 150000, totalSessions: 4, location: "SDN Uji Coba" },
    });
    assert.equal(e.status, 201, JSON.stringify(e.data));
    const start = new Date(Date.now() - 3 * 3600000);
    const s = await api(`/engagements/${e.data.id}/sessions`, {
      token: teacherToken,
      body: { sessions: [{ startAt: start.toISOString(), endAt: new Date(start.getTime() + 7200000).toISOString() }] },
    });
    assert.equal(s.status, 201);

    const report = await api(`/sessions/${s.data[0].id}/report`, {
      token: teacherToken,
      body: {
        dailyNote: "Budi fokus 20 menit penuh.\n\nTransisi berjalan lancar.",
        scores: [{ aspect: "Fokus", value: 4 }, { aspect: "Sosial", value: 3.5 }],
        improved: ["Fokus"],
      },
    });
    assert.equal(report.status, 201, JSON.stringify(report.data));

    const reports = await api(`/children/${childId}/reports`, { token: parentToken });
    assert.equal(reports.data.length, 1);
    const detail = await api(`/reports/${reports.data[0].id}`, { token: parentToken });
    assert.equal(detail.data.teacherNote.length, 2);
    assert.equal(detail.data.growthScore, 3.8);

    const pay = await api(`/engagements/${e.data.id}/payments`, { token: parentToken, body: { sessions: 4 } });
    assert.equal(pay.status, 201);
    const paid = await api(`/payments/${pay.data.id}/pay`, { token: parentToken, body: { method: "mock" } });
    assert.equal(paid.data.status, "PAID");
    assert.equal(paid.data.payeeAmount, 540000);

    const notifs = await api("/notifications", { token: parentToken });
    assert.ok(notifs.data.items.some((n: { category: string }) => n.category === "laporan"));
  });

  it("orang lain tidak bisa melihat report anak", async () => {
    const other = await login("rina@dubidu.id");
    assert.equal((await api(`/children/${childId}/reports`, { token: other })).status, 403);
  });

  it("konsultasi psikolog: lihat slot → booking → bayar → psikolog kirim hasil", async () => {
    const list = await api("/psychologists?category=ADHD", { token: parentToken });
    const psy = list.data.find((p: { name: string }) => p.name === psyName);
    const avail = await api(`/psychologists/${psy.id}/availability?days=7`, { token: parentToken });
    const slot = avail.data
      .flatMap((d: { times: { slotId: string; status: string }[] }) => d.times)
      .find((t: { status: string }) => t.status !== "full");

    const quote = await api("/consultations/quote", { token: parentToken, body: { psychologistId: psy.id, promoCode: "DUBIDUSAYANG" } });
    assert.equal(quote.data.finalPrice, 112000); // 160rb - (20% + 10%)

    const book = await api("/consultations", {
      token: parentToken,
      body: { psychologistId: psy.id, slotId: slot.slotId, type: "VIDEO", childId, promoCode: "DUBIDUSAYANG" },
    });
    assert.equal(book.status, 201, JSON.stringify(book.data));
    const again = await api("/consultations", { token: parentToken, body: { psychologistId: psy.id, slotId: slot.slotId, type: "CHAT" } });
    assert.equal(again.status, 409); // slot sudah dipakai

    await api(`/payments/${book.data.payment.id}/pay`, { token: parentToken, body: {} });
    const result = await api(`/consultations/${book.data.consultation.id}/result`, {
      method: "PATCH",
      token: psyToken,
      body: { observation: "Anak kooperatif dan fokus.", recommendation: "Lanjutkan rutinitas visual schedule." },
    });
    assert.equal(result.data.status, "COMPLETED");
  });

  it("check-in mood sekali sehari + dapat Madu", async () => {
    const first = await api("/checkins", { token: parentToken, body: { childId, mood: "SENANG" } });
    assert.equal(first.status, 201);
    assert.ok(first.data.pointsEarned > 0);
    const second = await api("/checkins", { token: parentToken, body: { childId, mood: "SEDIH" } });
    assert.equal(second.status, 409);
  });

  it("respon cepat: teacher bertanya, orang tua menjawab", async () => {
    const q = await api("/quick-questions", { token: teacherToken, body: { childId, text: "Boleh minum susu cokelat?" } });
    assert.equal(q.status, 201, JSON.stringify(q.data));
    const home = await api("/home/parent", { token: parentToken });
    assert.equal(home.data.quickQuestion.id, q.data.id);
    const ans = await api(`/quick-questions/${q.data.id}/answer`, { token: parentToken, body: { answer: "YES" } });
    assert.equal(ans.data.answer, "YES");
  });

  it("komunitas: posting, suka, komentar", async () => {
    const post = await api("/posts", { token: parentToken, body: { text: "Halo semua, salam kenal!", topic: "Umum" } });
    assert.equal(post.status, 201);
    const like = await api(`/posts/${post.data.id}/like`, { token: teacherToken, body: {} });
    assert.equal(like.data.likeCount, 1);
    await api(`/posts/${post.data.id}/comments`, { token: teacherToken, body: { text: "Salam kenal juga!" } });
    const feed = await api("/posts?topic=Umum", { token: parentToken });
    const mine = feed.data.posts.find((p: { id: string }) => p.id === post.data.id);
    assert.equal(mine.commentCount, 1);
  });

  it("beranda teacher demo Pras (desain gambar 2)", async () => {
    const res = await api("/home/teacher", { token: await login("pras@dubidu.id") });
    assert.equal(res.status, 200);
    assert.equal(res.data.greeting.name, "Pras");
    assert.ok(res.data.todaySchedule.some((s: { time: string }) => s.time === "14:00"));
    assert.ok(res.data.earnings.month > 0);
    assert.ok(res.data.applications.length > 0);
  });

  it("Doobie menjawab (fallback jika belum ada API key)", async () => {
    const res = await api("/doobie/chat", { token: parentToken, body: { message: "Tips agar anak fokus?", childId } });
    assert.equal(res.status, 200);
    assert.ok(res.data.reply.length > 0);
  });

  it("Dubidu Plus: buat langganan → bayar → aktif", async () => {
    const sub = await api("/subscription", { token: parentToken, body: { plan: "MONTHLY" } });
    assert.equal(sub.data.payment.amount, 59000);
    await api(`/payments/${sub.data.payment.id}/pay`, { token: parentToken, body: {} });
    const status = await api("/subscription", { token: parentToken });
    assert.equal(status.data.active, true);
  });

  it("Midtrans: webhook settlement → lunas, konsultasi terkonfirmasi, link meeting dibuat", async () => {
    // detik acak supaya slot baru tidak bentrok dengan slot dari run tes sebelumnya
    const soon = new Date(Date.now() + 5 * 60000);
    soon.setSeconds(1 + (stamp % 58), 0);
    await api("/psychologists/me/slots", { token: psyToken, body: { startAts: [soon.toISOString()] } });
    const psy = (await api("/psychologists", { token: parentToken })).data.find((p: { name: string }) => p.name === psyName);
    const avail = await api(`/psychologists/${psy.id}/availability?days=2`, { token: parentToken });
    const wib = new Date(soon.getTime() + 7 * 3600000).toISOString().slice(11, 16);
    const slot = avail.data
      .flatMap((d: { times: { slotId: string; status: string; time: string }[] }) => d.times)
      .find((t: { time: string; status: string }) => t.time === wib && t.status !== "full");
    assert.ok(slot, JSON.stringify(avail.data[0]));

    const book = await api("/consultations", { token: parentToken, body: { psychologistId: psy.id, slotId: slot.slotId, type: "VIDEO", childId } });
    assert.equal(book.status, 201, JSON.stringify(book.data));
    const payment = book.data.payment;

    const checkout = await api(`/payments/${payment.id}/checkout`, { token: parentToken, body: {} });
    assert.equal(checkout.data.mode, "mock");

    const notif = {
      order_id: payment.invoiceNo,
      status_code: "200",
      gross_amount: `${payment.amount}.00`,
      transaction_status: "settlement",
      payment_type: "qris",
      fraud_status: "accept",
    };
    const sign = (n: typeof notif) =>
      createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}SB-Mid-server-TEST`).digest("hex");

    const forged = await api("/payments/midtrans/notification", { body: { ...notif, signature_key: "palsu" } });
    assert.equal(forged.status, 403);

    const ok = await api("/payments/midtrans/notification", { body: { ...notif, signature_key: sign(notif) } });
    assert.equal(ok.status, 200);
    const again = await api("/payments/midtrans/notification", { body: { ...notif, signature_key: sign(notif) } });
    assert.equal(again.status, 200); // notifikasi ganda aman

    const p = await api(`/payments/${payment.id}`, { token: parentToken });
    assert.equal(p.data.status, "PAID");
    assert.equal(p.data.paymentType, "qris");

    const c = await api(`/consultations/${book.data.consultation.id}`, { token: parentToken });
    assert.equal(c.data.status, "CONFIRMED");
    assert.equal(c.data.meeting.ready, true);

    const join = await api(`/consultations/${book.data.consultation.id}/join`, { token: parentToken });
    assert.equal(join.status, 200, JSON.stringify(join.data));
    assert.ok(join.data.url.startsWith("https://meet.jit.si/dubidu-"));
    const psyJoin = await api(`/consultations/${book.data.consultation.id}/join`, { token: psyToken });
    assert.equal(psyJoin.status, 200);
  });

  it("Midtrans: webhook expire → konsultasi batal & slot dibuka lagi", async () => {
    const psy = (await api("/psychologists", { token: parentToken })).data.find((p: { name: string }) => p.name === psyName);
    const avail = await api(`/psychologists/${psy.id}/availability?days=7`, { token: parentToken });
    const slot = avail.data
      .flatMap((d: { times: { slotId: string; status: string }[] }) => d.times)
      .find((t: { status: string }) => t.status !== "full");
    const book = await api("/consultations", { token: parentToken, body: { psychologistId: psy.id, slotId: slot.slotId, type: "CALL" } });
    assert.equal(book.status, 201, JSON.stringify({ slot, res: book.data }));
    const n = {
      order_id: book.data.payment.invoiceNo,
      status_code: "407",
      gross_amount: `${book.data.payment.amount}.00`,
      transaction_status: "expire",
    };
    const signature_key = createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}SB-Mid-server-TEST`).digest("hex");
    await api("/payments/midtrans/notification", { body: { ...n, signature_key } });
    const c = await api(`/consultations/${book.data.consultation.id}`, { token: parentToken });
    assert.equal(c.data.status, "CANCELLED");
    const rebook = await api("/consultations", { token: parentToken, body: { psychologistId: psy.id, slotId: slot.slotId, type: "CALL" } });
    assert.equal(rebook.status, 201); // slot tersedia lagi
  });

  it("lupa password: kode via email → reset → login dengan password baru", async () => {
    const email = `ortu${stamp}@test.id`;
    const forgot = await api("/auth/forgot-password", { body: { email } });
    assert.equal(forgot.status, 200);
    assert.match(forgot.data.testCode, /^\d{6}$/);
    const unknown = await api("/auth/forgot-password", { body: { email: "tidakada@test.id" } });
    assert.equal(unknown.status, 200); // tidak membocorkan email terdaftar
    assert.equal(unknown.data.testCode, undefined);

    const wrongCode = forgot.data.testCode === "000000" ? "111111" : "000000";
    const wrong = await api("/auth/reset-password", { body: { email, code: wrongCode, newPassword: "passwordBaru1" } });
    assert.equal(wrong.status, 400);
    const ok = await api("/auth/reset-password", { body: { email, code: forgot.data.testCode, newPassword: "passwordBaru1" } });
    assert.equal(ok.status, 200);
    assert.ok(ok.data.token);
    await login(email, "passwordBaru1");
    const reused = await api("/auth/reset-password", { body: { email, code: forgot.data.testCode, newPassword: "lagiLagi123" } });
    assert.equal(reused.status, 400); // kode sekali pakai
  });

  it("Expo push: daftar & hapus token perangkat", async () => {
    const bad = await api("/auth/devices", { token: parentToken, body: { token: "bukan-token" } });
    assert.equal(bad.status, 400);
    const ok = await api("/auth/devices", { token: parentToken, body: { token: `ExponentPushToken[tes${stamp}]`, platform: "android" } });
    assert.equal(ok.status, 201);
    const del = await api("/auth/devices", { method: "DELETE", token: parentToken, body: { token: `ExponentPushToken[tes${stamp}]` } });
    assert.equal(del.status, 204);
  });

  it("AI matching: tanpa kunci AI, deck tetap jalan dengan skor aturan", async () => {
    const deck = await api(`/matching/teachers?childId=${childId}`, { token: parentToken });
    assert.equal(deck.status, 200);
    assert.equal(deck.data.aiPending, false);
    assert.ok(deck.data.cards.every((c: { ai: unknown; matchPercent: number; ruleScore: number }) => c.ai === null && c.matchPercent === c.ruleScore));
  });

  it("admin web: daftar user, pembayaran, konsultasi", async () => {
    const admin = await login("admin@dubidu.id", "admin12345");
    const users = await api("/admin/users?role=TEACHER&q=pras", { token: admin });
    assert.equal(users.data.items[0].email, "pras@dubidu.id");
    const payments = await api("/admin/payments?status=PAID", { token: admin });
    assert.ok(payments.data.summary.paidTotal > 0);
    assert.equal((await api("/admin/consultations", { token: admin })).status, 200);
    assert.equal((await api("/admin/users", { token: parentToken })).status, 403);
  });

  it("transfer manual QRIS/bank: kode unik → upload bukti → admin tolak → upload ulang → admin konfirmasi", async () => {
    process.env.PAYMENT_MODE = "manual";
    try {
      const admin = await login("admin@dubidu.id", "admin12345");
      const qris = await api("/admin/payment-methods", {
        token: admin,
        body: { type: "QRIS", label: "QRIS GoPay Tes", accountName: "DUBIDU Tes", qrImageUrl: "https://example.com/qris.png" },
      });
      assert.equal(qris.status, 201, JSON.stringify(qris.data));
      const badBank = await api("/admin/payment-methods", { token: admin, body: { type: "BANK_TRANSFER", label: "BCA", accountName: "X Y" } });
      assert.equal(badBank.status, 400); // bank wajib nomor rekening

      const sub = await api("/subscription", { token: parentToken, body: { plan: "YEARLY" } });
      const paymentId = sub.data.payment.id;
      assert.equal((await api(`/payments/${paymentId}/pay`, { token: parentToken, body: {} })).status, 400); // tombol demo mati

      const checkout = await api(`/payments/${paymentId}/checkout`, { token: parentToken, body: {} });
      assert.equal(checkout.data.mode, "manual");
      assert.ok(checkout.data.uniqueCode >= 1 && checkout.data.uniqueCode <= 999);
      assert.equal(checkout.data.amountDue, 590000 + checkout.data.uniqueCode);
      assert.ok(checkout.data.methods.some((m: { id: string }) => m.id === qris.data.id));
      const again = await api(`/payments/${paymentId}/checkout`, { token: parentToken, body: {} });
      assert.equal(again.data.amountDue, checkout.data.amountDue); // kode unik tidak berubah

      const proof = { methodId: qris.data.id, proofUrl: "https://example.com/bukti.jpg", senderName: "Uji Coba Orang Tua" };
      const sent = await api(`/payments/${paymentId}/proof`, { token: parentToken, body: proof });
      assert.equal(sent.data.status, "VERIFYING");
      assert.equal((await api(`/payments/${paymentId}/proof`, { token: parentToken, body: proof })).status, 409);

      const adminNotif = await api("/notifications", { token: admin });
      assert.ok(adminNotif.data.items.some((n: { title: string }) => n.title === "Bukti transfer baru"));
      const queue = await api("/admin/payments?status=VERIFYING", { token: admin });
      assert.ok(queue.data.items.some((p: { id: string; proofUrl: string }) => p.id === paymentId && p.proofUrl));

      const rejected = await api(`/admin/payments/${paymentId}/reject`, { token: admin, body: { reason: "Nominal belum termasuk kode unik" } });
      assert.equal(rejected.data.status, "PENDING");
      await api(`/payments/${paymentId}/proof`, { token: parentToken, body: { ...proof, note: "Sudah transfer ulang" } });

      const confirmed = await api(`/admin/payments/${paymentId}/confirm`, { token: admin, body: {} });
      assert.equal(confirmed.data.status, "PAID");
      assert.equal(confirmed.data.method, "manual-qris");
      assert.equal((await api(`/admin/payments/${paymentId}/confirm`, { token: admin, body: {} })).status, 409);

      const plus = await api("/subscription", { token: parentToken });
      assert.equal(plus.data.active, true);
      assert.equal((await api(`/admin/payments/${paymentId}/confirm`, { token: parentToken, body: {} })).status, 403);
    } finally {
      process.env.PAYMENT_MODE = "mock";
    }
  });
});
