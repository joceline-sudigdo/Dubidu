// AI Matching — menilai kecocokan profil anak dengan kompetensi shadow teacher.
//
// Alur:
// 1. Skor aturan (lib/matching.ts) menyaring kandidat teratas dengan cepat.
// 2. AI membaca profil lengkap pasangan anak–teacher (kebutuhan, keterangan orang tua,
//    report card terakhir, pendidikan, pengalaman, pendekatan) → skor 0–100 + alasan singkat.
// 3. Hasil disimpan di tabel MatchInsight. Selama profil tidak berubah (inputHash sama),
//    AI tidak dipanggil ulang → hemat biaya & cepat.
// Data yang dikirim ke AI TIDAK memuat nama anak, nama teacher, atau kontak.
import { createHash } from "node:crypto";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { config } from "../config.js";
import { prisma } from "../db.js";
import { aiClient, FALLBACK } from "./ai.js";
import { ageFrom } from "./dates.js";

export type AiInsight = { aiScore: number; reasons: string[]; caution: string | null };

const BATCH = 8;

const SYSTEM_PROMPT = `Kamu adalah mesin smart-matching DUBIDU yang menilai kecocokan antara anak berkebutuhan khusus (usia 5–15 tahun, kebutuhan dukungan rendah–sedang) dan calon shadow teacher.

Untuk setiap pasangan, nilai 0–100 seberapa cocok teacher untuk mendampingi anak tersebut di sekolah, dengan mempertimbangkan:
- Seberapa banyak kebutuhan anak yang tercakup kompetensi/spesialisasi teacher (paling penting).
- Pengalaman teacher dengan kondisi serupa dan rentang usia anak.
- Relevansi pendidikan (mis. PLB, psikologi, PAUD/PGSD) dan pendekatan yang ditulis teacher.
- Catatan perkembangan dari report card terakhir bila ada (aspek yang masih lemah butuh teacher yang kuat di aspek itu).

Panduan skor: 85–100 sangat cocok, 70–84 cocok, 50–69 cukup dengan catatan, di bawah 50 kurang cocok.

Tulis "reasons" berisi 2–3 alasan singkat (maks. 12 kata) dalam bahasa Indonesia yang hangat, ditujukan kepada orang tua, tanpa menyebut nama. Isi "caution" dengan satu kalimat jika ada hal yang perlu diperhatikan, atau null jika tidak ada.
Jangan membuat diagnosis medis/psikologis. Nilai hanya berdasarkan data yang diberikan.`;

const ResultSchema = z.object({
  results: z.array(
    z.object({
      pairId: z.string(),
      score: z.number().int(),
      reasons: z.array(z.string()),
      caution: z.string().nullable(),
    }),
  ),
});

// --- data profil ------------------------------------------------------------

export async function childProfileForAi(childId: string) {
  const child = await prisma.child.findUniqueOrThrow({
    where: { id: childId },
    include: { needs: { include: { needOption: true } } },
  });
  const report = await prisma.sessionReport.findFirst({
    where: { childId },
    include: { scores: true },
    orderBy: { createdAt: "desc" },
  });
  return {
    usia: ageFrom(child.birthDate),
    jenisKelamin: child.gender,
    jenjang: [child.schoolLevel, child.grade].filter(Boolean).join(" ") || null,
    kebutuhan: child.needs.map((n) => `${n.needOption.category}: ${n.needOption.label}`),
    keteranganOrangTua: child.diagnosis,
    kondisiRumah: child.homeNotes,
    reportTerakhir: report
      ? {
          nilai: Object.fromEntries(report.scores.map((s) => [s.aspect, s.value])),
          perluPerhatian: report.attention,
        }
      : null,
  };
}

export async function teacherProfileForAi(teacherUserId: string) {
  const t = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId: teacherUserId },
    include: { specializations: { include: { needOption: true } } },
  });
  return {
    gelar: t.title,
    keahlian: t.headline,
    tentang: t.about,
    pendidikan: t.education,
    pengalamanTahun: t.experienceYears,
    usiaAnakDidampingi: t.childAgeMin != null ? `${t.childAgeMin}–${t.childAgeMax} tahun` : null,
    spesialisasi: t.specializations.map((s) => `${s.needOption.category}: ${s.needOption.label}`),
    rating: t.reviewCount > 0 ? `${t.rating} dari ${t.reviewCount} ulasan` : "belum ada ulasan",
  };
}

const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 32);

// --- inti -------------------------------------------------------------------

const inflight = new Map<string, Promise<void>>();

/**
 * Ambil insight AI untuk pasangan (childId, teacherUserId).
 * Yang sudah ada di cache langsung dipakai; sisanya dinilai AI (paralel per batch).
 * Kalau ANTHROPIC_API_KEY kosong → map kosong (deck tetap jalan dengan skor aturan).
 */
export async function getAiInsights(pairs: { childId: string; teacherUserId: string }[]) {
  const result = new Map<string, AiInsight>();
  const client = aiClient();
  if (!client || pairs.length === 0) return result;

  const childIds = [...new Set(pairs.map((p) => p.childId))];
  const teacherIds = [...new Set(pairs.map((p) => p.teacherUserId))];
  const children = new Map(await Promise.all(childIds.map(async (id) => [id, await childProfileForAi(id)] as const)));
  const teachers = new Map(await Promise.all(teacherIds.map(async (id) => [id, await teacherProfileForAi(id)] as const)));

  const withHash = pairs.map((p) => ({
    ...p,
    key: `${p.childId}:${p.teacherUserId}`,
    inputHash: hash([children.get(p.childId), teachers.get(p.teacherUserId), config.matchingModel]),
  }));

  const cached = await prisma.matchInsight.findMany({
    where: { OR: pairs.map((p) => ({ childId: p.childId, teacherUserId: p.teacherUserId })) },
  });
  const cacheMap = new Map(cached.map((c) => [`${c.childId}:${c.teacherUserId}`, c]));

  const missing = withHash.filter((p) => {
    const c = cacheMap.get(p.key);
    if (c && c.inputHash === p.inputHash) {
      result.set(p.key, { aiScore: c.aiScore, reasons: c.reasons, caution: c.caution });
      return false;
    }
    return true;
  });

  // kelompokkan per batch & hindari panggilan ganda untuk pasangan yang sedang dihitung
  const batches: (typeof missing)[] = [];
  for (let i = 0; i < missing.length; i += BATCH) batches.push(missing.slice(i, i + BATCH));

  await Promise.all(
    batches.map(async (batch) => {
      const batchKey = batch.map((p) => `${p.key}@${p.inputHash}`).join("|");
      let job = inflight.get(batchKey);
      if (!job) {
        job = scoreBatch(batch, children, teachers).finally(() => inflight.delete(batchKey));
        inflight.set(batchKey, job);
      }
      await job;
    }),
  );

  if (missing.length) {
    const fresh = await prisma.matchInsight.findMany({
      where: { OR: missing.map((p) => ({ childId: p.childId, teacherUserId: p.teacherUserId, inputHash: p.inputHash })) },
    });
    for (const f of fresh) result.set(`${f.childId}:${f.teacherUserId}`, { aiScore: f.aiScore, reasons: f.reasons, caution: f.caution });
  }
  return result;
}

async function scoreBatch(
  batch: { childId: string; teacherUserId: string; key: string; inputHash: string }[],
  children: Map<string, unknown>,
  teachers: Map<string, unknown>,
) {
  const client = aiClient();
  if (!client) return;
  const payload = batch.map((p, i) => ({
    pairId: `p${i + 1}`,
    anak: children.get(p.childId),
    calonTeacher: teachers.get(p.teacherUserId),
  }));

  try {
    const response = await client.beta.messages.parse({
      model: config.matchingModel,
      ...FALLBACK,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(ResultSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Nilai ${payload.length} pasangan berikut. Kembalikan satu hasil untuk setiap pairId.\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return;

    for (const r of response.parsed_output.results) {
      const idx = Number(r.pairId.replace(/^p/, "")) - 1;
      const pair = batch[idx];
      if (!pair) continue;
      const data = {
        aiScore: Math.max(0, Math.min(100, Math.round(r.score))),
        reasons: r.reasons.slice(0, 3),
        caution: r.caution,
        inputHash: pair.inputHash,
        model: config.matchingModel,
        createdAt: new Date(),
      };
      await prisma.matchInsight.upsert({
        where: { childId_teacherUserId: { childId: pair.childId, teacherUserId: pair.teacherUserId } },
        create: { childId: pair.childId, teacherUserId: pair.teacherUserId, ...data },
        update: data,
      });
    }
  } catch (err) {
    console.error("AI matching gagal (deck tetap memakai skor aturan):", err);
  }
}

/** Gabungan skor aturan & AI → angka "Kecocokan %" di kartu */
export function blendScore(ruleScore: number, ai?: AiInsight) {
  return ai ? Math.round(ruleScore * 0.4 + ai.aiScore * 0.6) : ruleScore;
}

/** Tunggu AI paling lama `ms`; kalau lebih lama, kembalikan apa yang sudah ada (AI tetap jalan di belakang). */
export async function getAiInsightsWithin(pairs: { childId: string; teacherUserId: string }[], ms: number) {
  const job = getAiInsights(pairs);
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), ms));
  const done = await Promise.race([job, timeout]);
  if (done) return { insights: done, pending: false };

  // belum selesai: pakai hasil yang sudah tersimpan (walau dari profil versi lama)
  const insights = new Map<string, AiInsight>();
  if (pairs.length) {
    const rows = await prisma.matchInsight.findMany({
      where: { OR: pairs.map((p) => ({ childId: p.childId, teacherUserId: p.teacherUserId })) },
    });
    for (const r of rows) insights.set(`${r.childId}:${r.teacherUserId}`, { aiScore: r.aiScore, reasons: r.reasons, caution: r.caution });
  }
  return { insights, pending: true };
}

/** Hitung di belakang layar (dipanggil setelah profil anak dibuat/diubah) supaya deck langsung siap. */
export function warmMatchesForChild(childId: string) {
  if (!aiClient()) return;
  void (async () => {
    const needs = await prisma.childNeed.findMany({ where: { childId }, select: { needOptionId: true } });
    const child = await prisma.child.findUniqueOrThrow({ where: { id: childId }, select: { parent: { select: { isDemo: true } } } });
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        verificationStatus: "VERIFIED",
        user: { isDemo: child.parent.isDemo },
        specializations: { some: { needOptionId: { in: needs.map((n) => n.needOptionId) } } },
      },
      select: { userId: true },
      orderBy: { rating: "desc" },
      take: 12,
    });
    await getAiInsights(teachers.map((t) => ({ childId, teacherUserId: t.userId })));
  })().catch((err) => console.error("Warm AI matching gagal:", err));
}
