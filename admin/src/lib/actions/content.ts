"use server";

import { revalidatePath } from "next/cache";

import {
  cancelRedemption,
  deleteDoobieTopic,
  deleteFaq,
  getRewardsData,
  saveDoobieTopic,
  saveFaq,
  saveMission,
  savePromo,
  saveReward,
  updateLegal,
  updateLevels,
  updatePlan,
  updateSettings,
} from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { ContentRole, LegalType, PlusPlan, PromoCode, RewardCategory } from "@/types/content";

import { adminAction, bool, num, requireText, text, type ActionState } from "./helpers";

const role = (fd: FormData): ContentRole => (text(fd, "role") === "teacher" ? "teacher" : "parent");

// ---------- legal ----------
export async function updateLegalAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const type = text(fd, "type") as LegalType;
  return adminAction(async (admin) => {
    if (type !== "terms" && type !== "privacy") throw new Error("Dokumen tidak dikenal.");
    const hs = fd.getAll("h").map((v) => String(v).trim());
    const ps = fd.getAll("p").map((v) => String(v).trim());
    const sections = hs.map((h, i) => ({ h, p: ps[i] ?? "" })).filter((s) => s.h || s.p);
    if (sections.length === 0) throw new Error("Dokumen minimal punya satu bagian.");
    if (sections.some((s) => !s.h || !s.p)) throw new Error("Setiap bagian wajib punya judul dan isi.");
    const doc = await updateLegal(type, sections, admin.fullName);
    revalidatePath("/konten/legal");
    return {
      action: "CONTENT_UPDATED",
      targetType: "LEGAL",
      targetId: type,
      targetLabel: `${doc.title} → versi ${doc.version}`,
      reason: requireText(text(fd, "reason"), "Ringkasan perubahan", 5),
      message: `Tersimpan sebagai versi ${doc.version}.`,
    };
  });
}

// ---------- FAQ ----------
export async function saveFaqAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id") || undefined;
  return adminAction(async () => {
    const faq = await saveFaq({
      id,
      question: requireText(text(fd, "question"), "Pertanyaan", 5),
      answer: requireText(text(fd, "answer"), "Jawaban", 10),
      category: text(fd, "category") || "Umum",
      published: bool(fd, "published"),
    });
    revalidatePath("/konten/faq");
    return { action: id ? "CONTENT_UPDATED" : "CONTENT_CREATED", targetType: "FAQ", targetId: faq.id, targetLabel: faq.question, reason: text(fd, "reason") };
  });
}

export async function deleteFaqAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const faq = await deleteFaq(text(fd, "id"));
    revalidatePath("/konten/faq");
    return { action: "CONTENT_DELETED", targetType: "FAQ", targetId: faq.id, targetLabel: faq.question, reason: requireText(text(fd, "reason"), "Alasan", 5) };
  });
}

// ---------- Doobie ----------
export async function saveDoobieAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const isNew = text(fd, "isNew") === "true";
  return adminAction(async () => {
    const id = requireText(text(fd, "id").toLowerCase().replace(/[^a-z0-9-]+/g, "-"), "ID topik", 3);
    // satu paragraf = satu gelembung chat Doobie (pisahkan dengan baris kosong)
    const answer = text(fd, "answer")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (answer.length === 0) throw new Error("Jawaban wajib diisi.");
    const topic = await saveDoobieTopic({
      isNew,
      id,
      role: role(fd),
      label: requireText(text(fd, "label"), "Label chip", 3),
      question: requireText(text(fd, "question"), "Pertanyaan", 5),
      answer,
    });
    revalidatePath("/konten/doobie");
    return { action: isNew ? "CONTENT_CREATED" : "CONTENT_UPDATED", targetType: "DOOBIE", targetId: topic.id, targetLabel: `${topic.label} (${topic.role})`, reason: text(fd, "reason") };
  });
}

export async function deleteDoobieAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const topic = await deleteDoobieTopic(text(fd, "id"));
    revalidatePath("/konten/doobie");
    return { action: "CONTENT_DELETED", targetType: "DOOBIE", targetId: topic.id, targetLabel: topic.label, reason: requireText(text(fd, "reason"), "Alasan", 5) };
  });
}

// ---------- rewards ----------
export async function saveRewardAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id") || undefined;
  return adminAction(async () => {
    const cost = num(fd, "cost");
    if (cost < 10) throw new Error("Harga minimal 10 ikan.");
    const stockText = text(fd, "stock");
    const minLevel = num(fd, "minLevel");
    const reward = await saveReward({
      id,
      role: role(fd),
      title: requireText(text(fd, "title"), "Nama hadiah", 3),
      subtitle: text(fd, "subtitle"),
      cost,
      category: (text(fd, "category") || "Voucher") as RewardCategory,
      icon: text(fd, "icon") || "gift",
      minLevel: minLevel > 1 ? minLevel : null,
      stock: stockText === "" ? null : Math.max(0, num(fd, "stock")),
      active: bool(fd, "active"),
    });
    revalidatePath("/konten/rewards");
    return {
      action: id ? "CONTENT_UPDATED" : "CONTENT_CREATED",
      targetType: "REWARD",
      targetId: reward.id,
      targetLabel: `${reward.title} · ${reward.cost} ikan${reward.active ? "" : " (nonaktif)"}`,
      reason: text(fd, "reason"),
    };
  });
}

export async function saveMissionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id") || undefined;
  return adminAction(async () => {
    const reward = num(fd, "reward");
    if (reward < 1 || reward > 1000) throw new Error("Hadiah misi antara 1–1000 ikan.");
    const mission = await saveMission({
      id,
      role: role(fd),
      title: requireText(text(fd, "title"), "Judul misi", 3),
      subtitle: text(fd, "subtitle"),
      reward,
      actionLabel: text(fd, "actionLabel") || "Kerjakan",
      active: bool(fd, "active"),
    });
    revalidatePath("/konten/rewards");
    return { action: id ? "CONTENT_UPDATED" : "CONTENT_CREATED", targetType: "MISSION", targetId: mission.id, targetLabel: `${mission.title} · +${mission.reward}`, reason: text(fd, "reason") };
  });
}

export async function updateLevelsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const { levels: current } = await getRewardsData();
    const levels = current.map((l) => ({
      level: l.level,
      name: requireText(text(fd, `name_${l.level}`), `Nama level ${l.level}`),
      min: l.level === 1 ? 0 : num(fd, `min_${l.level}`),
      perk: text(fd, `perk_${l.level}`) || null,
    }));
    if (levels.some((l, i) => i > 0 && l.min <= levels[i - 1].min)) throw new Error("Batas ikan tiap level harus lebih besar dari level sebelumnya.");
    await updateLevels(levels);
    revalidatePath("/konten/rewards");
    return {
      action: "CONTENT_UPDATED",
      targetType: "LEVEL",
      targetId: null,
      targetLabel: levels.map((l) => `${l.name} ${l.min}`).join(" · "),
      reason: requireText(text(fd, "reason"), "Alasan", 5),
    };
  });
}

export async function cancelRedemptionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const reason = requireText(text(fd, "reason"), "Alasan", 5);
    const r = await cancelRedemption(text(fd, "id"));
    revalidatePath("/konten/rewards");
    return { action: "REDEMPTION_CANCELLED", targetType: "REDEMPTION", targetId: r.id, targetLabel: `${r.code} · ${r.userName}`, reason };
  });
}

// ---------- Plus, promo, biaya ----------
export async function updatePlanAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const price = num(fd, "price");
    if (price < 10000) throw new Error("Harga minimal Rp10.000.");
    const plan = await updatePlan(role(fd), text(fd, "key") as PlusPlan["key"], {
      price,
      note: requireText(text(fd, "note"), "Keterangan"),
      badge: text(fd, "badge") || null,
    });
    revalidatePath("/konten/plus");
    return {
      action: "CONTENT_UPDATED",
      targetType: "PLAN",
      targetId: `${plan.role}-${plan.key}`,
      targetLabel: `Plus ${plan.title} (${plan.role}) → ${formatRupiah(plan.price)}`,
      reason: requireText(text(fd, "reason"), "Alasan perubahan harga", 5),
    };
  });
}

export async function savePromoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const isNew = text(fd, "isNew") === "true";
  return adminAction(async () => {
    const code = requireText(text(fd, "code").toUpperCase().replace(/[^A-Z0-9]/g, ""), "Kode promo", 4);
    const discountPercent = num(fd, "discountPercent");
    if (discountPercent < 1 || discountPercent > 50) throw new Error("Diskon antara 1–50%.");
    const expires = text(fd, "expiresAt");
    const promo = await savePromo(
      {
        code,
        discountPercent,
        appliesTo: (text(fd, "appliesTo") || "ALL") as PromoCode["appliesTo"],
        active: bool(fd, "active"),
        expiresAt: expires ? new Date(`${expires}T23:59:00+07:00`).toISOString() : null,
      },
      isNew
    );
    revalidatePath("/konten/plus");
    return {
      action: isNew ? "CONTENT_CREATED" : "CONTENT_UPDATED",
      targetType: "PROMO",
      targetId: promo.code,
      targetLabel: `${promo.code} · ${promo.discountPercent}%${promo.active ? "" : " (nonaktif)"}`,
      reason: text(fd, "reason"),
    };
  });
}

export async function updateSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return adminAction(async () => {
    const settings = {
      platformFeePercent: num(fd, "platformFeePercent"),
      plusPlatformFeePercent: num(fd, "plusPlatformFeePercent"),
      payoutFee: num(fd, "payoutFee"),
      minPayout: num(fd, "minPayout"),
    };
    if (settings.platformFeePercent > 30 || settings.plusPlatformFeePercent > settings.platformFeePercent)
      throw new Error("Biaya platform maksimal 30%, dan biaya Plus tidak boleh lebih besar dari biaya biasa.");
    await updateSettings(settings);
    revalidatePath("/konten/plus");
    return {
      action: "CONTENT_UPDATED",
      targetType: "SETTING",
      targetId: "fees",
      targetLabel: `Biaya platform ${settings.platformFeePercent}% / Plus ${settings.plusPlatformFeePercent}% · biaya transfer ${formatRupiah(settings.payoutFee)}`,
      reason: requireText(text(fd, "reason"), "Alasan", 5),
    };
  });
}
