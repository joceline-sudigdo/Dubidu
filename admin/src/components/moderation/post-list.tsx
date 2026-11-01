import { EyeOff, Flag, Heart, Image as ImageIcon, MessageCircle, RotateCcw } from "lucide-react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { Notice } from "@/components/shared/detail-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { setCommentStatusAction, setPostStatusAction } from "@/lib/actions/moderation";
import { formatDateTime } from "@/lib/format";
import { HIDE_REASONS, MODERATION } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CommunityPost } from "@/types/community";

// postingan publik komunitas. Foto tidak ditampilkan (bisa memuat wajah anak), hanya jumlahnya.
export function PostList({ posts }: { posts: CommunityPost[] }) {
  if (posts.length === 0) return <Notice>Belum ada postingan.</Notice>;

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <article key={p.id} className={cn("rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5", p.status === "HIDDEN" && "opacity-80")}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {p.authorName} <span className="text-xs font-normal text-muted-foreground">· {p.authorRole}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(p.createdAt)} · topik {p.topic}
              </p>
            </div>
            {p.reportCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                <Flag className="size-3.5" /> {p.reportCount} laporan
              </span>
            )}
            <StatusBadge {...MODERATION[p.status]} />
          </div>

          <p className="mt-3 text-sm leading-relaxed">{p.text}</p>
          {p.hiddenReason && <p className="mt-2 text-xs text-danger">Disembunyikan: {p.hiddenReason}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" /> {p.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" /> {p.comments.length}
            </span>
            {p.photoCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3.5" /> {p.photoCount} foto (tidak ditampilkan)
              </span>
            )}
            <div className="ml-auto">
              {p.status === "VISIBLE" ? (
                <ActionDialog
                  action={setPostStatusAction}
                  hidden={{ id: p.id, hide: "true" }}
                  triggerLabel="Sembunyikan"
                  triggerIcon={<EyeOff />}
                  triggerTone="danger"
                  triggerSize="sm"
                  title="Sembunyikan postingan?"
                  description="Postingan tidak lagi terlihat di komunitas. Penulis mendapat notifikasi beserta alasannya."
                  submitLabel="Sembunyikan"
                  submitTone="danger"
                  reason={{ label: "Alasan", required: true, quick: HIDE_REASONS }}
                />
              ) : (
                <ActionDialog
                  action={setPostStatusAction}
                  hidden={{ id: p.id, hide: "false" }}
                  triggerLabel="Pulihkan"
                  triggerIcon={<RotateCcw />}
                  triggerSize="sm"
                  title="Pulihkan postingan?"
                  submitLabel="Pulihkan"
                  reason={{ label: "Alasan" }}
                />
              )}
            </div>
          </div>

          {p.comments.length > 0 && (
            <details className="mt-3 rounded-xl bg-surface p-3">
              <summary className="cursor-pointer text-sm font-semibold text-brand">Lihat {p.comments.length} komentar</summary>
              <ul className="mt-3 space-y-2">
                {p.comments.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start gap-2 rounded-lg bg-white p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {c.authorName} <span className="text-xs font-normal text-muted-foreground">· {c.authorRole}</span>
                      </p>
                      <p className={cn(c.status === "HIDDEN" && "text-muted-foreground line-through")}>{c.text}</p>
                    </div>
                    <ActionDialog
                      action={setCommentStatusAction}
                      hidden={{ postId: p.id, commentId: c.id, hide: c.status === "VISIBLE" ? "true" : "false" }}
                      triggerLabel={c.status === "VISIBLE" ? "Sembunyikan" : "Pulihkan"}
                      triggerSize="sm"
                      triggerTone={c.status === "VISIBLE" ? "danger" : "outline"}
                      title={c.status === "VISIBLE" ? "Sembunyikan komentar?" : "Pulihkan komentar?"}
                      submitLabel={c.status === "VISIBLE" ? "Sembunyikan" : "Pulihkan"}
                      submitTone={c.status === "VISIBLE" ? "danger" : "primary"}
                      reason={c.status === "VISIBLE" ? { label: "Alasan", required: true, quick: HIDE_REASONS } : { label: "Alasan" }}
                    />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
