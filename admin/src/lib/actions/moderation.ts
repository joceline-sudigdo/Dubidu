"use server";

import { revalidatePath } from "next/cache";

import {
  createAuditLog,
  findCommentPostId,
  getPost,
  listReports,
  listReviews,
  resolveReport,
  setCommentStatus,
  setPostStatus,
  setReviewStatus,
  setUserActive,
} from "@/lib/api";

import { adminAction, clientIp, requireText, text, type ActionState } from "./helpers";

const snippet = (s: string) => (s.length > 60 ? `${s.slice(0, 60)}…` : s);

function refresh() {
  revalidatePath("/moderasi");
  revalidatePath("/");
}

// tindak lanjut laporan: sembunyikan konten dan/atau nonaktifkan akun, lalu tutup laporannya
export async function resolveReportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  const outcome = text(fd, "outcome"); // "resolve" | "dismiss"
  return adminAction(async (admin) => {
    const reason = requireText(text(fd, "reason"), "Catatan tindakan", 5);
    const report = (await listReports()).find((r) => r.id === id);
    if (!report) throw new Error("Laporan tidak ditemukan.");
    if (report.status !== "OPEN") throw new Error("Laporan ini sudah ditangani.");

    // aksi tambahan dicatat sebagai baris audit terpisah
    const extra = async (entry: Parameters<typeof createAuditLog>[0]) => createAuditLog(entry);
    const actor = { actorId: admin.id, actorName: admin.fullName, ipAddress: await clientIp(), reason };

    if (outcome === "resolve") {
      if (fd.get("hideContent") === "on") {
        if (report.targetType === "POST") {
          await setPostStatus(report.targetId, "HIDDEN", reason);
          await extra({ ...actor, action: "POST_HIDDEN", targetType: "POST", targetId: report.targetId, targetLabel: snippet(report.targetLabel) });
        } else if (report.targetType === "COMMENT") {
          const postId = await findCommentPostId(report.targetId);
          if (postId) {
            await setCommentStatus(report.targetId, "HIDDEN");
            await extra({ ...actor, action: "COMMENT_HIDDEN", targetType: "COMMENT", targetId: report.targetId, targetLabel: snippet(report.targetLabel) });
          }
        }
      }
      if (fd.get("suspendUser") === "on" && report.targetUserId) {
        await setUserActive(report.targetUserId, false, reason);
        await extra({ ...actor, action: "USER_SUSPENDED", targetType: "USER", targetId: report.targetUserId, targetLabel: report.targetUserName ?? "-" });
        revalidatePath("/pengguna");
      }
    }

    await resolveReport(id, outcome === "resolve" ? "RESOLVED" : "DISMISSED", reason);
    refresh();
    return {
      action: outcome === "resolve" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
      targetType: "REPORT",
      targetId: id,
      targetLabel: `${report.reason} · ${snippet(report.targetLabel)}`,
      reason,
    };
  });
}

// sembunyikan / pulihkan postingan komunitas
export async function setPostStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  const hide = text(fd, "hide") === "true";
  return adminAction(async () => {
    const reason = hide ? requireText(text(fd, "reason"), "Alasan", 5) : text(fd, "reason");
    const post = await getPost(id);
    if (!post) throw new Error("Postingan tidak ditemukan.");
    await setPostStatus(id, hide ? "HIDDEN" : "VISIBLE", reason || null);
    refresh();
    return { action: hide ? "POST_HIDDEN" : "POST_RESTORED", targetType: "POST", targetId: id, targetLabel: `${post.authorName}: ${snippet(post.text)}`, reason };
  });
}

export async function setCommentStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const postId = text(fd, "postId");
  const commentId = text(fd, "commentId");
  const hide = text(fd, "hide") === "true";
  return adminAction(async () => {
    const reason = hide ? requireText(text(fd, "reason"), "Alasan", 5) : text(fd, "reason");
    const comment = (await getPost(postId))?.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error("Komentar tidak ditemukan.");
    await setCommentStatus(commentId, hide ? "HIDDEN" : "VISIBLE");
    refresh();
    return {
      action: hide ? "COMMENT_HIDDEN" : "COMMENT_RESTORED",
      targetType: "COMMENT",
      targetId: commentId,
      targetLabel: `${comment.authorName}: ${snippet(comment.text)}`,
      reason,
    };
  });
}

// ulasan yang disembunyikan tidak dihitung di rating
export async function setReviewStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id");
  const hide = text(fd, "hide") === "true";
  return adminAction(async () => {
    const reason = hide ? requireText(text(fd, "reason"), "Alasan", 5) : text(fd, "reason");
    const review = (await listReviews()).find((r) => r.id === id);
    if (!review) throw new Error("Ulasan tidak ditemukan.");
    await setReviewStatus(id, hide ? "HIDDEN" : "VISIBLE", reason || null);
    refresh();
    return {
      action: hide ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
      targetType: "REVIEW",
      targetId: id,
      targetLabel: `${review.authorName} → ${review.targetName} (${review.rating}★)`,
      reason,
    };
  });
}
