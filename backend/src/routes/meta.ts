import { Router } from "express";

import { prisma } from "../db.js";
import { requireAuth } from "../lib/auth.js";
import { HttpError } from "../lib/http.js";
import { SKILL_KEY, SKILL_LABEL, SKILLS } from "../lib/matching.js";
import { CHECKIN_REWARDS } from "../lib/points.js";
import { CATEGORY_LABEL, CATEGORY_TONE } from "../lib/present.js";
import { storeFile, uploadMiddleware } from "../lib/upload.js";

export const metaRouter = Router();

/** GET /api/meta/needs — daftar kebutuhan anak per kategori (untuk layar child-needs & spesialisasi teacher) */
metaRouter.get("/meta/needs", async (_req, res) => {
  const options = await prisma.needOption.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
  const grouped = Object.keys(CATEGORY_LABEL).map((category) => ({
    category,
    title: CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL],
    tone: CATEGORY_TONE[category as keyof typeof CATEGORY_TONE],
    options: options.filter((o) => o.category === category).map((o) => ({ id: o.id, label: o.label, skill: o.skill ? SKILL_KEY[o.skill] : null })),
  }));
  res.json(grouped.filter((g) => g.options.length > 0));
});

/** GET /api/meta/app — konstanta kecil yang dipakai beberapa layar */
metaRouter.get("/meta/app", (_req, res) => {
  res.json({
    moods: [
      { id: "SENANG", label: "Senang", emoji: "😄" },
      { id: "TENANG", label: "Tenang", emoji: "😊" },
      { id: "BIASA", label: "Biasa", emoji: "🙂" },
      { id: "REWEL", label: "Rewel", emoji: "😫" },
      { id: "SEDIH", label: "Sedih", emoji: "😢" },
    ],
    checkinRewards: CHECKIN_REWARDS,
    // 7 bidang keahlian untuk matching (kunci dipakai di skills teacher & needs anak)
    skills: SKILLS.map((s) => ({ key: SKILL_KEY[s], label: SKILL_LABEL[s] })),
    communityTopics: ["ADHD", "Autism", "Speech Delay", "Sensori", "Umum"],
    consultationTypes: [
      { id: "VIDEO", label: "Video Call", hint: "Paling Populer" },
      { id: "CALL", label: "Panggilan", hint: "Suara Jernih" },
      { id: "CHAT", label: "Chat", hint: "Fleksibel" },
    ],
  });
});

/**
 * POST /api/uploads?folder=ktp  (multipart/form-data, field "file")
 * Balikan: { url }. Pakai URL ini di field ktpUrl, medicalRecordUrl, avatarUrl, foto report, dll.
 */
metaRouter.post("/uploads", requireAuth, uploadMiddleware, async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Kirim file di field "file"');
  const folder = String(req.query.folder ?? "umum").replace(/[^a-z0-9-]/gi, "").slice(0, 30) || "umum";
  const url = await storeFile(req.file, folder);
  res.status(201).json({ url });
});
