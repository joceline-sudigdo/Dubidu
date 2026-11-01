// ============================================================================
//  Seed DUBIDU
//  1. Master data kebutuhan anak  → SELALU di-upsert (aman dijalankan di produksi)
//  2. Data demo (akun Devi, Pras, Elisya, dst.) → hanya kalau database masih kosong
//     dan SEED_DEMO tidak "false".
//  Jalankan: npm run db:seed   (atau otomatis setelah `npm run db:reset`)
// ============================================================================
import bcrypt from "bcryptjs";

import { prisma, type NeedCategory, type Skill } from "../src/db.js";

const NEEDS: Record<NeedCategory, string[]> = {
  // label DISAMAKAN dengan layar child-needs di frontend
  KOMUNIKASI: ["Speech delay", "Sulit menyampaikan kebutuhan", "Kesulitan memahami instruksi"],
  SOSIAL: ["Sulit berinteraksi dengan teman", "Kurang kontak mata", "Sulit bergiliran & berbagi"],
  AKADEMIK: ["Sulit fokus & konsentrasi", "Kesulitan membaca & menulis", "Kesulitan berhitung"],
  SENSORIK: ["Sensitif terhadap suara", "Sensitif terhadap sentuhan", "Mencari stimulasi berlebih"],
  PERILAKU: ["Tantrum / ledakan emosi", "Hiperaktif / sulit duduk tenang", "Sulit mengikuti aturan & rutinitas"],
};

/** Kebutuhan anak → bidang keahlian teacher yang dipakai matching */
const NEED_SKILL: Record<string, Skill> = {
  "Speech delay": "SPEECH",
  "Sulit menyampaikan kebutuhan": "COMMUNICATION",
  "Kesulitan memahami instruksi": "COMMUNICATION",
  "Sulit berinteraksi dengan teman": "SOCIAL",
  "Sulit bergiliran & berbagi": "SOCIAL",
  "Kurang kontak mata": "AUTISM",
  "Sulit mengikuti aturan & rutinitas": "AUTISM",
  "Sulit fokus & konsentrasi": "ADHD",
  "Hiperaktif / sulit duduk tenang": "ADHD",
  "Tantrum / ledakan emosi": "ADHD",
  "Kesulitan membaca & menulis": "ACADEMIC",
  "Kesulitan berhitung": "ACADEMIC",
  "Sensitif terhadap suara": "SENSORY",
  "Sensitif terhadap sentuhan": "SENSORY",
  "Mencari stimulasi berlebih": "SENSORY",
};

async function seedNeeds() {
  for (const [category, labels] of Object.entries(NEEDS)) {
    for (const [order, label] of labels.entries()) {
      const skill = NEED_SKILL[label] ?? null;
      await prisma.needOption.upsert({
        where: { label },
        create: { label, category: category as NeedCategory, order, skill },
        update: { category: category as NeedCategory, order, skill },
      });
    }
  }
  console.log("✔ master kebutuhan anak");
}

// --- helper waktu (WIB) -----------------------------------------------------
const DAY = 86400000;
/** tanggal WIB hari ini + offset hari, jam "HH:MM" → Date */
function at(dayOffset: number, hm: string) {
  const now = new Date(Date.now() + 7 * 3600000);
  const ymd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + dayOffset * DAY)
    .toISOString()
    .slice(0, 10);
  return new Date(`${ymd}T${hm}:00+07:00`);
}
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

// Level keahlian teacher demo (0–100): [Speech, Komunikasi, ADHD, Sensori, Sosial, Autisme, Akademik]
const SKILL_ORDER: Skill[] = ["SPEECH", "COMMUNICATION", "ADHD", "SENSORY", "SOCIAL", "AUTISM", "ACADEMIC"];
const DEMO_SKILLS: Record<string, number[]> = {
  "pras@dubidu.id": [72, 78, 88, 80, 82, 90, 70],
  "teacher@dubidu.id": [55, 65, 70, 60, 62, 50, 93],
  "nielsen@dubidu.id": [94, 88, 86, 75, 70, 60, 68],
  "larasati@dubidu.id": [80, 78, 90, 92, 72, 65, 66],
  "sarah@dubidu.id": [70, 80, 64, 82, 92, 94, 68],
  "kevin@dubidu.id": [52, 66, 92, 78, 70, 58, 74],
  "citra@dubidu.id": [60, 68, 80, 95, 72, 78, 62],
  "siti@dubidu.id": [78, 82, 62, 70, 90, 91, 60],
  "bayu@dubidu.id": [58, 64, 70, 60, 65, 52, 90],
};

/** Perbarui level keahlian teacher demo yang sudah ada (mis. di Neon). Akun sungguhan tidak disentuh. */
async function syncDemoTeacherSkills() {
  let updated = 0;
  for (const [email, levels] of Object.entries(DEMO_SKILLS)) {
    const profile = await prisma.teacherProfile.findFirst({ where: { user: { email, isDemo: true } } });
    if (!profile) continue;
    for (const [i, skill] of SKILL_ORDER.entries()) {
      await prisma.teacherSkill.upsert({
        where: { teacherId_skill: { teacherId: profile.id, skill } },
        create: { teacherId: profile.id, skill, selfLevel: levels[i]!, level: levels[i]! },
        update: { selfLevel: levels[i]!, level: levels[i]!, adminAdjusted: false },
      });
    }
    updated++;
  }
  if (updated) console.log(`✔ level keahlian ${updated} teacher demo`);
}

async function seedDemo() {
  const needId = async (label: string) => (await prisma.needOption.findUniqueOrThrow({ where: { label } })).id;
  const hash = await bcrypt.hash("dubidu123", 10);
  const MALANG = { latitude: -7.9666, longitude: 112.6326 };
  const near = (dLat: number, dLng: number) => ({ latitude: MALANG.latitude + dLat, longitude: MALANG.longitude + dLng });

  // --- admin -----------------------------------------------------------------
  await prisma.user.create({
    data: { role: "ADMIN", fullName: "Admin Dubidu", email: "admin@dubidu.id", passwordHash: await bcrypt.hash("admin12345", 10) },
  });

  // --- tujuan transfer manual (CONTOH — ganti dengan QRIS & rekening asli lewat web admin) ---
  await prisma.paymentMethod.createMany({
    data: [
      {
        type: "QRIS", label: "QRIS GoPay (contoh)", accountName: "DUBIDU (contoh – ganti di web admin)",
        qrImageUrl: "https://placehold.co/600x600/png?text=QRIS+CONTOH", order: 1,
        instructions: "Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking. Masukkan nominal persis termasuk kode unik.",
      },
      {
        type: "BANK_TRANSFER", label: "Transfer Bank (contoh)", bankName: "BCA", accountNumber: "0000000000",
        accountName: "DUBIDU (contoh – ganti di web admin)", order: 2,
        instructions: "Transfer nominal persis termasuk kode unik agar cepat dikonfirmasi.",
      },
    ],
  });

  // --- orang tua -------------------------------------------------------------
  const devi = await prisma.user.create({
    data: {
      role: "PARENT", fullName: "Devi Anggraini", nickname: "Devi", email: "devi@dubidu.id", phone: "081234567890",
      passwordHash: hash, domicile: "Malang, Jawa Timur", points: 340, ...MALANG,
    },
  });
  // akun dari dummy-accounts.json frontend tetap bisa login
  const sari = await prisma.user.create({
    data: {
      role: "PARENT", fullName: "Sari Wulandari", nickname: "Sari", email: "parent@dubidu.id", phone: "081200000001",
      passwordHash: await bcrypt.hash("parent123", 10), domicile: "Malang, Jawa Timur", ...near(0.01, 0.01),
    },
  });
  const rina = await prisma.user.create({
    data: { role: "PARENT", fullName: "Rina Hartono", nickname: "Rina", email: "rina@dubidu.id", passwordHash: hash, domicile: "Malang", ...near(-0.02, 0.01) },
  });
  const arka = await prisma.user.create({
    data: { role: "PARENT", fullName: "Bunda Arka", nickname: "Bunda Arka", email: "arka@dubidu.id", passwordHash: hash, domicile: "Malang", ...near(0.03, -0.01) },
  });
  const dimasMom = await prisma.user.create({
    data: { role: "PARENT", fullName: "Mama Dimas", nickname: "Mama Dimas", email: "mamadimas@dubidu.id", passwordHash: hash, domicile: "Batu", ...near(-0.04, -0.05) },
  });

  await prisma.subscription.create({
    data: { userId: devi.id, plan: "YEARLY", price: 590000, startsAt: at(-60, "00:00"), endsAt: new Date("2026-12-31T23:59:59+07:00"), active: true },
  });

  const mkChild = async (parentId: string, data: Record<string, unknown>, needs: string[]) =>
    prisma.child.create({
      data: {
        parentId,
        ...(data as { name: string; fullName: string }),
        needs: { create: await Promise.all(needs.map(async (l) => ({ needOptionId: await needId(l) }))) },
      },
    });

  const elisya = await mkChild(devi.id, {
    name: "Elisya", fullName: "Elisya Effriani", birthDate: new Date("2013-04-12"), gender: "FEMALE",
    schoolLevel: "SMP", grade: "8th", schoolName: "SMPN 3 Malang", domicile: "Klojen, Malang", diagnosis: "ADHD & Regulasi Sensori",
  }, ["Sulit fokus & konsentrasi", "Sensitif terhadap suara", "Hiperaktif / sulit duduk tenang", "Speech delay"]);
  const cheryl = await mkChild(devi.id, {
    name: "Cheryl", fullName: "Cheryl Anindita", birthDate: new Date("2018-08-02"), gender: "FEMALE",
    schoolLevel: "SD", grade: "3rd", schoolName: "SDN Klojen 01", domicile: "Klojen, Malang", diagnosis: "Speech Delay",
  }, ["Speech delay", "Sulit menyampaikan kebutuhan", "Mencari stimulasi berlebih"]);
  const kiyoko = await mkChild(devi.id, {
    name: "Kiyoko", fullName: "Kiyoko Hana", birthDate: new Date("2020-11-20"), gender: "FEMALE",
    schoolLevel: "TK", grade: "TK B", domicile: "Lowokwaru, Malang", diagnosis: "Autism Spectrum",
  }, ["Kurang kontak mata", "Sulit berinteraksi dengan teman", "Sensitif terhadap sentuhan"]);
  const kenneth = await mkChild(rina.id, {
    name: "Kenneth", fullName: "Kenneth Hartono", birthDate: new Date("2019-02-14"), gender: "MALE",
    schoolLevel: "SD", grade: "1st", domicile: "Blimbing, Malang", diagnosis: "Speech Delay",
  }, ["Speech delay", "Kesulitan memahami instruksi"]);
  const bella = await mkChild(rina.id, {
    name: "Bella", fullName: "Bella Hartono", birthDate: new Date("2016-06-30"), gender: "FEMALE",
    schoolLevel: "SD", grade: "4th", domicile: "Blimbing, Malang", diagnosis: "Disleksia ringan",
  }, ["Kesulitan membaca & menulis", "Sulit fokus & konsentrasi"]);
  const nps = await mkChild(sari.id, {
    name: "Nadia", fullName: "Nadia Putri Sari", birthDate: new Date("2014-01-09"), gender: "FEMALE",
    schoolLevel: "SD", grade: "6th", domicile: "Sukun, Malang", diagnosis: "ADHD",
  }, ["Sulit fokus & konsentrasi", "Hiperaktif / sulit duduk tenang", "Tantrum / ledakan emosi"]);
  const amira = await mkChild(arka.id, {
    name: "Amira", fullName: "Amira Mahesa", birthDate: new Date("2017-09-09"), gender: "FEMALE",
    schoolLevel: "SD", grade: "2nd", domicile: "Malang", diagnosis: "Autism Spectrum",
  }, ["Kurang kontak mata", "Sensitif terhadap suara"]);
  await mkChild(dimasMom.id, {
    name: "Dimas", fullName: "Dimas Arya", birthDate: new Date("2019-05-05"), gender: "MALE", schoolLevel: "TK", grade: "TK B", domicile: "Batu",
  }, ["Speech delay", "Sulit bergiliran & berbagi"]);

  // --- shadow teacher --------------------------------------------------------
  type T = {
    fullName: string; nickname: string; email: string; title: string; headline: string; about: string; education: string;
    exp: number; price: number; availability: string; area: string; rating: number; reviews: number; specs: string[];
    status?: "VERIFIED" | "PENDING"; loc: { latitude: number; longitude: number };
  };
  const mkTeacher = async (t: T) =>
    prisma.user.create({
      data: {
        role: "TEACHER", fullName: t.fullName, nickname: t.nickname, email: t.email, passwordHash: hash, domicile: `${t.area}, Malang`, ...t.loc,
        teacherProfile: {
          create: {
            title: t.title, headline: t.headline, about: t.about, education: t.education, experienceYears: t.exp,
            childAgeMin: 5, childAgeMax: 15, pricePerSession: t.price, availability: t.availability, area: t.area,
            verificationStatus: t.status ?? "VERIFIED", verifiedAt: t.status === "PENDING" ? null : new Date(),
            rating: t.rating, reviewCount: t.reviews,
            specializations: { create: await Promise.all(t.specs.map(async (l) => ({ needOptionId: await needId(l) }))) },
            skills: {
              create: SKILL_ORDER.map((skill, i) => ({
                skill,
                selfLevel: DEMO_SKILLS[t.email]![i]!,
                level: DEMO_SKILLS[t.email]![i]!,
              })),
            },
          },
        },
      },
    });

  const pras = await mkTeacher({
    fullName: "Prasetyo Wibowo", nickname: "Pras", email: "pras@dubidu.id", title: "S.Pd", headline: "Shadow Teacher PLB • Autisme & ADHD",
    about: "Lulusan Pendidikan Luar Biasa, sudah mendampingi lebih dari 5 anak dengan autisme dan cerebral palsy di sekolah inklusi.",
    education: "S1 Pendidikan Luar Biasa – Universitas Negeri Malang", exp: 4, price: 150000, availability: "Senin–Jumat, pagi–siang",
    area: "Lowokwaru", rating: 4.9, reviews: 31, loc: near(0.01, -0.02),
    specs: ["Sulit fokus & konsentrasi", "Hiperaktif / sulit duduk tenang", "Kurang kontak mata", "Speech delay", "Tantrum / ledakan emosi"],
  });
  const rinaTeacher = await mkTeacher({
    fullName: "Rina Kartika", nickname: "Rina", email: "teacher@dubidu.id", title: "S.Pd", headline: "Spesialis Membaca & Menulis",
    about: "Guru SD inklusi yang senang mendampingi anak belajar membaca dengan metode multisensori.", education: "S1 PGSD",
    exp: 3, price: 120000, availability: "Senin, Rabu, Jumat sore", area: "Blimbing", rating: 4.7, reviews: 12, loc: near(-0.02, 0.02),
    specs: ["Kesulitan membaca & menulis", "Kesulitan berhitung", "Sulit fokus & konsentrasi"],
  });
  await prisma.user.update({ where: { id: rinaTeacher.id }, data: { passwordHash: await bcrypt.hash("teacher123", 10), phone: "081200000002" } });
  const nielsen = await mkTeacher({
    fullName: "Nielsen Dave", nickname: "Nielsen", email: "nielsen@dubidu.id", title: "S.Pd", headline: "Spesialis ADHD & Speech Delay",
    about: "Berpengalaman dengan metode PECS dan stimulasi wicara aktif di kelas inklusi.", education: "S1 Pendidikan Khusus",
    exp: 5, price: 150000, availability: "Senin–Jumat, sore hari", area: "Lowokwaru", rating: 4.9, reviews: 28, loc: near(0.015, -0.01),
    specs: ["Speech delay", "Sulit fokus & konsentrasi", "Sensitif terhadap suara", "Kesulitan memahami instruksi"],
  });
  const larasati = await mkTeacher({
    fullName: "Larasati Sudigdo", nickname: "Larasati", email: "larasati@dubidu.id", title: "S.Psi", headline: "ADHD & Sensorik",
    about: "Psikologi pendidikan, fokus pada regulasi sensori dan rutinitas kelas.", education: "S1 Psikologi – Universitas Brawijaya",
    exp: 3, price: 140000, availability: "Setiap hari, pagi", area: "Klojen", rating: 4.8, reviews: 19, loc: near(0.002, 0.003),
    specs: ["Mencari stimulasi berlebih", "Sensitif terhadap suara", "Speech delay", "Hiperaktif / sulit duduk tenang"],
  });
  const sarah = await mkTeacher({
    fullName: "Sarah Putri", nickname: "Sarah", email: "sarah@dubidu.id", title: "S.Pd", headline: "Autism Spectrum & Interaksi Sosial",
    about: "Mendampingi anak autisme di TK dan SD dengan pendekatan visual schedule.", education: "S1 PG-PAUD",
    exp: 4, price: 135000, availability: "Senin–Sabtu, pagi", area: "Lowokwaru", rating: 4.8, reviews: 22, loc: near(0.02, -0.015),
    specs: ["Kurang kontak mata", "Sulit berinteraksi dengan teman", "Sensitif terhadap sentuhan", "Sulit bergiliran & berbagi"],
  });
  const kevin = await mkTeacher({
    fullName: "Kevin Aditya", nickname: "Kevin", email: "kevin@dubidu.id", title: "S.Psi", headline: "ADHD & Fokus",
    about: "Membantu anak ADHD membangun rutinitas belajar.", education: "S1 Psikologi", exp: 2, price: 125000,
    availability: "Sore & akhir pekan", area: "Sukun", rating: 4.6, reviews: 9, loc: near(-0.03, -0.01),
    specs: ["Sulit fokus & konsentrasi", "Hiperaktif / sulit duduk tenang", "Sulit mengikuti aturan & rutinitas"],
  });
  const citra = await mkTeacher({
    fullName: "Citra Sari", nickname: "Citra", email: "citra@dubidu.id", title: "S.Pd", headline: "Sensori Integrasi",
    about: "Berpengalaman di kelas sensori integrasi.", education: "S1 PLB", exp: 3, price: 130000,
    availability: "Senin–Kamis", area: "Klojen", rating: 4.7, reviews: 14, loc: near(0.004, 0.01),
    specs: ["Sensitif terhadap sentuhan", "Sensitif terhadap suara", "Mencari stimulasi berlebih"],
  });
  await mkTeacher({
    fullName: "Siti Rahma", nickname: "Siti", email: "siti@dubidu.id", title: "S.Pd", headline: "Spesialis Autisme & Interaksi Sosial",
    about: "Sabar dan konsisten menggunakan visual support.", education: "S1 PLB", exp: 3, price: 135000,
    availability: "Setiap hari, pagi–siang", area: "Klojen", rating: 4.8, reviews: 19, loc: near(0.006, 0.004),
    specs: ["Kurang kontak mata", "Sulit berinteraksi dengan teman", "Speech delay"],
  });
  await mkTeacher({
    fullName: "Bayu Prakoso", nickname: "Bayu", email: "bayu@dubidu.id", title: "S.Pd", headline: "Spesialis Disleksia & Membaca",
    about: "Baru bergabung, menunggu verifikasi.", education: "S1 PGSD", exp: 1, price: 120000,
    availability: "Senin, Rabu, Jumat sore", area: "Blimbing", rating: 0, reviews: 0, loc: near(-0.015, 0.02), status: "PENDING",
    specs: ["Kesulitan membaca & menulis"],
  });

  // --- psikolog --------------------------------------------------------------
  type P = { fullName: string; email: string; title: string; place: string; exp: number; badge: string; tags: string[]; categories: string[]; base: number; disc: number; dur: number; rating: number; reviews: number };
  const psychologists: P[] = [
    { fullName: "Amanda Putri, M.Psi., Psikolog", email: "amanda@dubidu.id", title: "Psikolog Anak & Sensori", place: "RSIA Bunda Jakarta", exp: 3, badge: "Top Rated", tags: ["Anak & Remaja", "ADHD & Sensori"], categories: ["ADHD"], base: 160000, disc: 20, dur: 45, rating: 4.9, reviews: 34 },
    { fullName: "Dimas Wicaksono, S.Psi.", email: "dimas.psi@dubidu.id", title: "Psikolog Wicara & Komunikasi", place: "Pusat Terapi Anak", exp: 2, badge: "Online Sekarang", tags: ["Speech Delay", "Komunikasi PECS", "GDD (Global Delay)"], categories: ["Speech Delay"], base: 80000, disc: 0, dur: 45, rating: 4.8, reviews: 20 },
    { fullName: "dr. Reni Anggraini, Sp.A", email: "reni@dubidu.id", title: "Dokter Spesialis Anak", place: "Senior Klinis", exp: 14, badge: "Dubidu Expert", tags: ["Autisme (ASD)", "Konseling Ortu", "Sensori & Motorik"], categories: ["Autisme"], base: 200000, disc: 0, dur: 60, rating: 5.0, reviews: 215 },
    { fullName: "dr. Farhan Alatas, Sp.KFR", email: "farhan@dubidu.id", title: "Dokter & Terapis Tumbuh Kembang", place: "Poliklinik Tumbuh Kembang", exp: 5, badge: "Dokter & Terapis", tags: ["Sensory Processing", "Tumbuh Kembang", "Regulasi Diri"], categories: ["ADHD", "Autisme"], base: 150000, disc: 0, dur: 45, rating: 4.8, reviews: 76 },
    { fullName: "Dr. Andi Pratama", email: "psikolog@dubidu.id", title: "Psikolog Klinis Anak", place: "Klinik Tumbuh Kembang Malang", exp: 8, badge: "Dubidu Expert", tags: ["Asesmen Awal", "ADHD", "Konseling Ortu"], categories: ["ADHD", "Autisme", "Speech Delay"], base: 175000, disc: 10, dur: 60, rating: 4.9, reviews: 58 },
  ];
  for (const p of psychologists) {
    const user = await prisma.user.create({
      data: {
        role: "PSYCHOLOGIST", fullName: p.fullName, email: p.email,
        passwordHash: p.email === "psikolog@dubidu.id" ? await bcrypt.hash("psikolog123", 10) : hash,
        psychologistProfile: {
          create: { title: p.title, place: p.place, experienceYears: p.exp, badge: p.badge, tags: p.tags, categories: p.categories, basePrice: p.base, discountPercent: p.disc, durationMinutes: p.dur, rating: p.rating, reviewCount: p.reviews },
        },
      },
      include: { psychologistProfile: true },
    });
    // slot 7 hari ke depan
    const times = ["09:00", "10:30", "13:00", "14:30", "16:00", "19:00"];
    await prisma.psychologistSlot.createMany({
      data: [1, 2, 3, 4, 5, 6, 7].flatMap((d) => times.map((t) => ({ psychologistId: user.psychologistProfile!.id, startAt: at(d, t) }))),
    });
  }

  // --- pengajuan + kontrak + sesi + report card -------------------------------
  const engage = async (opts: {
    child: { id: string; parentId: string }; teacher: { id: string }; initiatedBy: "PARENT" | "TEACHER";
    total: number; done: number; rate: number; phase: string; location: string; frequency: string; todayAt?: string;
  }) => {
    const app = await prisma.application.create({
      data: { childId: opts.child.id, teacherUserId: opts.teacher.id, initiatedBy: opts.initiatedBy, status: "ACCEPTED", respondedAt: at(-60, "10:00"), createdAt: at(-62, "10:00"), matchScore: 90 },
    });
    const e = await prisma.engagement.create({
      data: {
        applicationId: app.id, childId: opts.child.id, teacherUserId: opts.teacher.id, parentId: opts.child.parentId,
        ratePerSession: opts.rate, totalSessions: opts.total, phase: opts.phase, location: opts.location, frequency: opts.frequency,
        startDate: at(-7 * opts.done, "00:00"),
      },
    });
    for (let n = 1; n <= opts.done; n++) {
      const start = at(-7 * (opts.done - n + 1), "08:00");
      await prisma.session.create({ data: { engagementId: e.id, number: n, startAt: start, endAt: addMinutes(start, 210), status: "DONE" } });
    }
    let n = opts.done + 1;
    if (opts.todayAt) {
      const start = at(0, opts.todayAt);
      await prisma.session.create({ data: { engagementId: e.id, number: n++, startAt: start, endAt: addMinutes(start, 120) } });
    }
    for (let w = 1; n <= Math.min(opts.total, opts.done + 4); w++, n++) {
      const start = at(w * 3, "15:00");
      await prisma.session.create({ data: { engagementId: e.id, number: n, startAt: start, endAt: addMinutes(start, 180) } });
    }
    return e;
  };

  const eNielsen = await engage({ child: elisya, teacher: nielsen, initiatedBy: "PARENT", total: 12, done: 8, rate: 150000, phase: "Target Smt 1", location: "SMPN 3 Malang", frequency: "2x seminggu (Jumat & Sabtu)" });
  const eLarasati = await engage({ child: cheryl, teacher: larasati, initiatedBy: "PARENT", total: 8, done: 3, rate: 140000, phase: "Fase Adaptasi", location: "SDN Klojen 01, Kota Malang", frequency: "2x seminggu" });
  await engage({ child: kiyoko, teacher: sarah, initiatedBy: "TEACHER", total: 10, done: 2, rate: 135000, phase: "Fase Adaptasi", location: "TK Dharma Wanita Lowokwaru", frequency: "3x seminggu" });
  const ePrasElisya = await engage({ child: elisya, teacher: pras, initiatedBy: "TEACHER", total: 16, done: 6, rate: 150000, phase: "Target Smt 1", location: "SMPN 3 Malang", frequency: "Setiap hari sekolah", todayAt: "14:00" });
  await engage({ child: kenneth, teacher: pras, initiatedBy: "PARENT", total: 12, done: 4, rate: 150000, phase: "Fase Adaptasi", location: "SDN Blimbing 2", frequency: "2x seminggu" });
  await engage({ child: bella, teacher: pras, initiatedBy: "PARENT", total: 8, done: 2, rate: 150000, phase: "Fase Adaptasi", location: "SDN Blimbing 2", frequency: "1x seminggu" });

  // pengajuan lain (Riwayat & Pengajuan Aktif)
  await prisma.application.createMany({
    data: [
      { childId: nps.id, teacherUserId: pras.id, initiatedBy: "TEACHER", status: "PENDING", createdAt: at(-2, "09:00") },
      { childId: amira.id, teacherUserId: pras.id, initiatedBy: "TEACHER", status: "REJECTED", createdAt: at(-20, "09:00"), respondedAt: at(-18, "09:00") },
      { childId: kiyoko.id, teacherUserId: citra.id, initiatedBy: "PARENT", status: "PENDING", createdAt: at(-5, "09:00") },
      { childId: elisya.id, teacherUserId: kevin.id, initiatedBy: "PARENT", status: "REJECTED", createdAt: at(-120, "09:00"), respondedAt: at(-118, "09:00") },
      { childId: cheryl.id, teacherUserId: citra.id, initiatedBy: "PARENT", status: "REJECTED", createdAt: at(-90, "09:00"), respondedAt: at(-88, "09:00") },
    ],
  });

  // report card untuk sesi yang sudah selesai (Elisya bersama Nielsen)
  const doneSessions = await prisma.session.findMany({
    where: { engagementId: { in: [eNielsen.id, eLarasati.id, ePrasElisya.id] }, status: "DONE" },
    include: { engagement: true },
    orderBy: { startAt: "asc" },
  });
  for (const [i, s] of doneSessions.entries()) {
    const growth = Math.min(1.5, i * 0.15);
    await prisma.sessionReport.create({
      data: {
        sessionId: s.id, childId: s.engagement.childId, teacherUserId: s.engagement.teacherUserId,
        dailyNote:
          "Hari ini anak menunjukkan lonjakan fokus belajar yang luar biasa! Berhasil berkonsentrasi penuh selama 25 menit berturut-turut saat menyelesaikan puzzle kata tematik.\n\nKetika lonceng istirahat berbunyi, anak sempat menutup kedua telinga. Dengan teknik deep pressure dan afirmasi nafas 40 detik, transisi berjalan tenang tanpa tantrum.\n\nAnak secara spontan tersenyum dan melakukan kontak mata 3–4 detik saat diajak berbagi krayon bersama teman sebangku.",
        achievement: "Mampu menuntaskan 12 kartu konsep tanpa interupsi.",
        sensoryNote: "Butuh headphone peredam bising saat jadwal bel sekolah.",
        homeTip: "Afirmasi 5 menit sebelum bel istirahat atau suara mendadak.",
        improved: ["Fokus Belajar", "Kontak Mata Spontan", "Kemandirian"],
        attention: ["Regulasi Emosi (Suara Bel)"],
        needsAttention: i === 0,
        scores: {
          create: [
            { aspect: "Fokus", value: Math.min(5, 3 + growth) },
            { aspect: "Sosial", value: Math.min(5, 3.5 + growth) },
            { aspect: "Sensori", value: Math.min(5, 2.5 + growth / 2) },
            { aspect: "Komunikasi", value: Math.min(5, 3 + growth) },
            { aspect: "Kemandirian", value: Math.min(5, 3.5 + growth) },
            { aspect: "Regulasi Emosi", value: Math.min(5, 2.5 + growth / 2) },
          ],
        },
      },
    });
  }

  // pendapatan Pras bulan ini (kartu "Pendapatan")
  const payments = [
    { amount: 600000, daysAgo: 0 }, { amount: 450000, daysAgo: 3 }, { amount: 300000, daysAgo: 9 },
  ];
  for (const [i, p] of payments.entries()) {
    await prisma.payment.create({
      data: {
        userId: devi.id, purpose: "ENGAGEMENT", referenceId: ePrasElisya.id, invoiceNo: `DUB-SEED${i + 1}`, amount: p.amount,
        status: "PAID", method: "mock", payeeUserId: pras.id, payeeAmount: Math.round(p.amount * 0.9),
        // satu pembayaran selalu "hari ini" supaya kartu Pendapatan bulan ini tidak kosong
        paidAt: p.daysAgo === 0 ? new Date(Date.now() - 60000) : at(-p.daysAgo, "10:00"),
      },
    });
  }

  // --- chat ------------------------------------------------------------------
  const convo = async (type: "TEACHER" | "PSYCHOLOGIST", a: string, b: string, childId: string, msgs: [string, string, number][]) => {
    const c = await prisma.conversation.create({
      data: { type, childId, participants: { create: [{ userId: a, lastReadAt: at(-1, "00:00") }, { userId: b, lastReadAt: at(0, "23:59") }] } },
    });
    for (const [sender, text, minutesAgo] of msgs) {
      await prisma.message.create({ data: { conversationId: c.id, senderId: sender, text, createdAt: new Date(Date.now() - minutesAgo * 60000) } });
    }
    return c;
  };
  const cNielsen = await convo("TEACHER", devi.id, nielsen.id, elisya.id, [
    [devi.id, "Halo Kak Nielsen! Saya sangat tertarik dengan pengalaman Kakak menangani anak speech delay. Boleh diskusi untuk pendampingan Elisya?", 60],
    [nielsen.id, "Halo Bu Devi! Tentu sangat bisa, saya berpengalaman dengan metode PECS dan stimulasi wicara aktif di kelas.", 55],
    [nielsen.id, "Apakah Ibu ada rekam asesmen awal atau daftar kata yang sering memicu tantrum saat di kelas?", 50],
    [devi.id, "Ada Kak! Sebentar saya carikan PDF laporan dari psikolog anak bulan lalu ya.", 45],
  ]);
  await prisma.message.create({
    data: {
      conversationId: cNielsen.id, senderId: nielsen.id, type: "SCHEDULE", createdAt: new Date(Date.now() - 52 * 60000),
      schedule: { title: "Sesi Observasi Pertama", date: "Sabtu, 19 September 2026", hours: "08:00 - 11:30 WIB (Sekolah)", place: "SDN Klojen 01, Kota Malang" },
    },
  });
  await convo("TEACHER", devi.id, larasati.id, cheryl.id, [
    [larasati.id, "Selamat pagi Mam! Cheryl sudah sampai di kelas dengan ceria.", 120],
    [larasati.id, "Mam, bolehkan Cheryl makan es krim untuk siang ini?", 90],
  ]);
  await convo("TEACHER", devi.id, sarah.id, kiyoko.id, [[sarah.id, "Kiyoko hari ini mau ikut bernyanyi bersama teman 🥹", 300]]);
  await convo("TEACHER", devi.id, pras.id, elisya.id, [[pras.id, "Bu Devi, nanti jam 14:00 saya jemput Elisya di kelas ya.", 30]]);
  await convo("TEACHER", rina.id, pras.id, kenneth.id, [[rina.id, "Terima kasih Kak Pras, Kenneth senang sekali belajar bareng!", 200]]);

  await prisma.quickQuestion.create({
    data: { teacherId: larasati.id, parentId: devi.id, childId: cheryl.id, text: "Mam, bolehkan Cheryl makan es krim untuk siang ini?" },
  });

  // --- komunitas -------------------------------------------------------------
  const post1 = await prisma.communityPost.create({
    data: { authorId: arka.id, topic: "Autism", createdAt: new Date(Date.now() - 3 * 60000),
      text: "Hari pertama Arka mau pakai ear-muff di tempat ramai tanpa rewel! Ternyata sounding visual 3 hari sebelumnya sangat membantu. Untuk Ayah/Bunda yang sedang berjuang, pelan-pelan ya, setiap langkah kecil adalah kemenangan besar.." },
  });
  await prisma.communityPost.create({
    data: { authorId: dimasMom.id, topic: "Speech Delay", createdAt: new Date(Date.now() - 2 * 3600000),
      text: "Masyallah, hari ini Dimas menyusun balok huruf sambil mengucapkannya dengan jelas... Air mata haru gak bisa ditahan 🥹" },
  });
  await prisma.communityPost.create({
    data: { authorId: sari.id, topic: "ADHD", createdAt: new Date(Date.now() - 5 * 3600000),
      text: "Ada yang punya tips supaya anak ADHD bisa fokus mengerjakan PR lebih dari 10 menit? Masih sering beralih ke mainan lain." },
  });
  await prisma.postLike.createMany({ data: [devi, sari, rina, dimasMom].map((u) => ({ postId: post1.id, userId: u.id })) });
  await prisma.postComment.create({ data: { postId: post1.id, authorId: devi.id, text: "Ikut senang Bunda! Terima kasih tipsnya 🤍" } });

  // --- notifikasi --------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { userId: devi.id, category: "CHAT", icon: "message-text", tone: "blue", title: "Kak Larasati, S.Psi membalas", body: "Mam, bolehkan Cheryl makan es krim untuk siang ini?", tag: "Pesan Terapis", action: "Balas Pesan", createdAt: new Date(Date.now() - 28 * 60000) },
      { userId: devi.id, category: "LAPORAN", icon: "clipboard-check", tone: "green", title: "Laporan Perkembangan Baru", body: "Kak Nielsen telah mengirimkan Report Card Sesi ke-8 untuk Elisya. Fokus meningkat 25 menit!", tag: "Sesi #8", action: "Buka Laporan", createdAt: new Date(Date.now() - 2 * 3600000) },
      { userId: devi.id, category: "LAINNYA", icon: "star-four-points", tone: "yellow", title: "Rekomendasi Shadow Teacher", body: "Kami menemukan 2 Shadow Teacher tersertifikasi ADHD & Speech Delay di area Malang sesuai kebutuhan Elisya.", tag: "Kecocokan 98%", action: "Lihat Profil", createdAt: new Date(Date.now() - 4 * 3600000) },
      { userId: devi.id, category: "BOOKING", icon: "calendar-month", tone: "blue", title: "Pengingat Sesi", body: "Sesi tatap muka dengan Kak Pras terjadwal hari ini pukul 14:00 WIB.", tag: "Jadwal Sesi", readAt: new Date(), createdAt: at(-1, "16:20") },
      { userId: pras.id, category: "LAINNYA", icon: "account-heart", tone: "blue", title: "Pengajuan baru menunggu", body: "Pengajuanmu untuk NPS masih menunggu jawaban orang tua.", tag: "Pengajuan", createdAt: new Date(Date.now() - 3600000) },
    ],
  });

  // check-in Senin–Rabu minggu ini untuk Elisya (agar kartu check-in terlihat seperti desain)
  const now = new Date(Date.now() + 7 * 3600000);
  const mondayOffset = (now.getUTCDay() + 6) % 7;
  const rewards = [10, 15, 20, 25, 30, 40, 100];
  for (let i = 0; i < mondayOffset; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (mondayOffset - i) * DAY);
    await prisma.moodCheckin.create({ data: { childId: elisya.id, userId: devi.id, date: d, mood: "SENANG", pointsEarned: rewards[i]! } });
  }
  await prisma.pointTransaction.create({ data: { userId: devi.id, amount: 340, reason: "saldo awal (seed)" } });

  // semua akun di atas (kecuali admin) adalah akun contoh → dipisahkan dari user sungguhan
  await prisma.user.updateMany({ where: { role: { not: "ADMIN" } }, data: { isDemo: true } });
  console.log("✔ data demo");
  console.log(`
  Akun demo (password: dubidu123 kecuali disebut lain)
  ─────────────────────────────────────────────────────
  Orang tua : devi@dubidu.id        (Elisya, Cheryl, Kiyoko)
  Teacher   : pras@dubidu.id        (jadwal hari ini 14:00 dengan Elisya)
  Psikolog  : amanda@dubidu.id
  Admin     : admin@dubidu.id / admin12345
  Akun dummy frontend: parent@dubidu.id/parent123, teacher@dubidu.id/teacher123, psikolog@dubidu.id/psikolog123
  `);
}

async function main() {
  await seedNeeds();
  if (process.env.SEED_DEMO === "false") return;
  if ((await prisma.user.count()) > 0) {
    console.log("• database sudah berisi user, data demo tidak dibuat ulang");
    await syncDemoTeacherSkills();
    return;
  }
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
