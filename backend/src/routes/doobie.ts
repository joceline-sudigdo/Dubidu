import type Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { prisma } from "../db.js";
import { assertChildAccess } from "../lib/access.js";
import { aiClient, FALLBACK } from "../lib/ai.js";
import { me, requireAuth } from "../lib/auth.js";
import { ageFrom } from "../lib/dates.js";
import { parse } from "../lib/http.js";

export const doobieRouter = Router();
doobieRouter.use(requireAuth);


const SYSTEM_PROMPT = `Kamu adalah Doobie, beruang kutub ramah di aplikasi DUBIDU yang menemani orang tua dan shadow teacher anak berkebutuhan khusus (ABK) usia 5–15 tahun.

Cara menjawab:
- Bahasa Indonesia yang hangat, sederhana, dan suportif. Sapa pengguna dengan sopan.
- Jawaban singkat (maksimal ±150 kata), praktis, dan bisa langsung dicoba di rumah atau di kelas.
- Gunakan data anak yang diberikan bila relevan.

Batasan penting:
- DUBIDU tidak memberikan diagnosis medis maupun psikologis, terapi, atau keputusan profesional. Jangan pernah menyatakan diagnosis.
- Jika pertanyaan menyangkut diagnosis, obat, tanda bahaya, atau kondisi yang memburuk, sarankan dengan lembut untuk konsultasi ke psikolog atau dokter (fitur "Konsultasi Psikolog" di aplikasi).
- Jika ada tanda bahaya bagi keselamatan anak, minta pengguna segera menghubungi tenaga profesional atau layanan darurat 112.`;

/** Ringkasan data anak untuk konteks Doobie */
async function childContext(childId: string) {
  const child = await prisma.child.findUniqueOrThrow({
    where: { id: childId },
    include: { needs: { include: { needOption: true } } },
  });
  const report = await prisma.sessionReport.findFirst({
    where: { childId },
    include: { scores: true },
    orderBy: { createdAt: "desc" },
  });
  const lines = [
    `Nama anak: ${child.name}`,
    `Usia: ${ageFrom(child.birthDate) ?? "tidak diketahui"} tahun, jenjang ${child.schoolLevel ?? "-"} ${child.grade ?? ""}`,
    `Kebutuhan: ${child.needs.map((n) => n.needOption.label).join(", ") || "-"}`,
    child.diagnosis ? `Keterangan orang tua: ${child.diagnosis}` : null,
    report
      ? `Report card terakhir: ${report.scores.map((s) => `${s.aspect} ${s.value}/5`).join(", ")}. Catatan: ${report.dailyNote.slice(0, 300)}`
      : null,
  ];
  return lines.filter(Boolean).join("\n");
}

const FALLBACK_REPLY =
  "Halo! Doobie sedang belum aktif 🐻‍❄️ Sementara itu, kamu bisa cek report card terbaru atau konsultasi dengan psikolog mitra ya!";

/** POST /api/doobie/chat { message, childId?, topic? } → { reply } */
doobieRouter.post("/chat", async (req, res) => {
  const userId = me(req).id;
  const body = parse(
    z.object({ message: z.string().trim().min(1).max(2000), childId: z.string().optional(), topic: z.string().max(60).optional() }),
    req.body,
  );
  if (body.childId) await assertChildAccess(me(req), body.childId);

  // 10 pesan terakhir sebagai riwayat percakapan
  const history = (
    await prisma.doobieMessage.findMany({
      where: { userId, childId: body.childId ?? null },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  ).reverse();

  let reply = FALLBACK_REPLY;
  const client = aiClient();
  if (client) {
    const context = body.childId ? await childContext(body.childId) : "Belum ada anak yang dipilih.";
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      {
        role: "user",
        content: `${body.topic ? `[Topik: ${body.topic}]\n` : ""}${body.message}`,
      },
    ];
    // Riwayat harus diawali pesan "user"
    while (messages.length && messages[0]!.role !== "user") messages.shift();

    try {
      // fallbacks "default": kalau model menolak karena filter keamanan, API otomatis mencoba model cadangan
      const response = await client.beta.messages.create({
        model: config.doobieModel,
        ...FALLBACK,
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: `${SYSTEM_PROMPT}\n\nData anak:\n${context}`,
        messages,
      });
      if (response.stop_reason === "refusal") {
        reply = "Maaf, Doobie tidak bisa membantu pertanyaan itu. Coba tanyakan dengan cara lain, atau konsultasikan ke psikolog mitra ya.";
      } else {
        reply = response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim() || reply;
      }
    } catch (err) {
      console.error("Doobie error:", err);
      reply = "Doobie sedang sibuk sebentar 🐻‍❄️ Coba lagi beberapa saat lagi ya.";
    }
  }

  await prisma.doobieMessage.createMany({
    data: [
      { userId, childId: body.childId ?? null, role: "user", content: body.message },
      { userId, childId: body.childId ?? null, role: "assistant", content: reply },
    ],
  });
  res.json({ reply });
});

/** GET /api/doobie/history?childId=... */
doobieRouter.get("/history", async (req, res) => {
  const childId = req.query.childId ? String(req.query.childId) : null;
  const rows = await prisma.doobieMessage.findMany({
    where: { userId: me(req).id, childId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  res.json(rows.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })));
});
