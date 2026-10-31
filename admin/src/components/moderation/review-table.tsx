import { EyeOff, RotateCcw, Star } from "lucide-react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { setReviewStatusAction } from "@/lib/actions/moderation";
import { formatDateTime } from "@/lib/format";
import { MODERATION, ROLE } from "@/lib/labels";
import { HIDE_REASONS } from "@/lib/mock/community";
import type { Review } from "@/types/community";

const COLUMNS: Column<Review>[] = [
  {
    key: "target",
    header: "Untuk",
    cell: (r) => (
      <div className="min-w-40">
        <p className="font-semibold">{r.targetName}</p>
        <p className="text-xs text-muted-foreground">{ROLE[r.targetRole]}</p>
      </div>
    ),
  },
  {
    key: "rating",
    header: "Rating",
    cell: (r) => (
      <span className="flex items-center gap-0.5" aria-label={`${r.rating} bintang`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={i < r.rating ? "size-3.5 fill-warning text-warning" : "size-3.5 text-border"} />
        ))}
      </span>
    ),
  },
  {
    key: "comment",
    header: "Ulasan",
    className: "max-w-sm",
    cell: (r) => (
      <div>
        <p className="text-sm">{r.comment ?? <span className="text-muted-foreground">Tanpa komentar</span>}</p>
        <p className="text-xs text-muted-foreground">
          {r.authorName} · {formatDateTime(r.createdAt)}
        </p>
        {r.hiddenReason && <p className="text-xs text-danger">Disembunyikan: {r.hiddenReason}</p>}
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge {...MODERATION[r.status]} /> },
  {
    key: "act",
    header: "",
    className: "text-right",
    cell: (r) =>
      r.status === "VISIBLE" ? (
        <ActionDialog
          action={setReviewStatusAction}
          hidden={{ id: r.id, hide: "true" }}
          triggerLabel="Sembunyikan"
          triggerIcon={<EyeOff />}
          triggerTone="danger"
          triggerSize="sm"
          title="Sembunyikan ulasan?"
          description="Ulasan tidak tampil di profil dan tidak dihitung dalam rating."
          submitLabel="Sembunyikan"
          submitTone="danger"
          reason={{ label: "Alasan", required: true, quick: HIDE_REASONS }}
        />
      ) : (
        <ActionDialog
          action={setReviewStatusAction}
          hidden={{ id: r.id, hide: "false" }}
          triggerLabel="Pulihkan"
          triggerIcon={<RotateCcw />}
          triggerSize="sm"
          title="Pulihkan ulasan?"
          submitLabel="Pulihkan"
          reason={{ label: "Alasan" }}
        />
      ),
  },
];

export function ReviewTable({ reviews }: { reviews: Review[] }) {
  return <DataTable columns={COLUMNS} rows={reviews} rowKey={(r) => r.id} empty="Belum ada ulasan." />;
}
