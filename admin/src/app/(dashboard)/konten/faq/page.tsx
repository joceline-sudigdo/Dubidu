import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { BackLink } from "@/components/shared/back-link";
import { Notice } from "@/components/shared/detail-card";
import { CheckboxField, Field, TextareaField } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { deleteFaqAction, saveFaqAction } from "@/lib/actions/content";
import { listFaqs } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import type { Faq } from "@/types/content";

export const metadata: Metadata = { title: "FAQ Bantuan" };

function FaqFields({ f }: { f?: Faq }) {
  return (
    <div className="space-y-3">
      <Field label="Pertanyaan" name="question" defaultValue={f?.question} required />
      <TextareaField label="Jawaban" name="answer" defaultValue={f?.answer} required className="[&_textarea]:min-h-32" />
      <Field label="Kategori" name="category" defaultValue={f?.category ?? "Umum"} placeholder="Pembayaran, Matching, …" />
      <CheckboxField label="Tampilkan di aplikasi" name="published" defaultChecked={f?.published ?? true} />
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <BackLink href="/konten" label="Konten" />
      <PageHeader
        title="FAQ Bantuan"
        description="Daftar pertanyaan di Pusat Bantuan aplikasi, ditampilkan sesuai urutan."
        actions={
          <ActionDialog action={saveFaqAction} triggerLabel="Tambah FAQ" triggerIcon={<Plus />} triggerTone="primary" title="Tambah FAQ" submitLabel="Simpan" wide>
            <FaqFields />
          </ActionDialog>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <FaqList />
      </Suspense>
    </>
  );
}

async function FaqList() {
  await getCurrentAdmin();
  const faqs = await listFaqs();
  if (faqs.length === 0) return <Notice>Belum ada FAQ.</Notice>;

  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <article key={f.id} className="rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand-dark">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">{f.question}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{f.category}</span>
                <StatusBadge label={f.published ? "Tampil" : "Draf"} tone={f.published ? "success" : "neutral"} />
              </div>
            </div>
            <div className="flex gap-2">
              <ActionDialog
                action={saveFaqAction}
                hidden={{ id: f.id }}
                triggerLabel="Ubah"
                triggerIcon={<Pencil />}
                triggerSize="sm"
                title="Ubah FAQ"
                submitLabel="Simpan"
                reason={{ label: "Alasan perubahan" }}
                wide>
                <FaqFields f={f} />
              </ActionDialog>
              <ActionDialog
                action={deleteFaqAction}
                hidden={{ id: f.id }}
                triggerLabel="Hapus"
                triggerIcon={<Trash2 />}
                triggerTone="danger"
                triggerSize="sm"
                title="Hapus FAQ?"
                description={`“${f.question}” akan hilang dari Pusat Bantuan.`}
                submitLabel="Hapus"
                submitTone="danger"
                reason={{ label: "Alasan", required: true }}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
