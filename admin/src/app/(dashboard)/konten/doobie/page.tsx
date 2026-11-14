import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

import { ActionDialog } from "@/components/shared/action-dialog";
import { BackLink } from "@/components/shared/back-link";
import { Field, SelectField, TextareaField } from "@/components/shared/form-fields";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { deleteDoobieAction, saveDoobieAction } from "@/lib/actions/content";
import { listDoobieTopics } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { param } from "@/lib/labels";
import type { ContentRole, DoobieTopic } from "@/types/content";

export const metadata: Metadata = { title: "Template Doobie" };

function TopicFields({ t, role }: { t?: DoobieTopic; role: ContentRole }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label="ID topik"
        name="id"
        defaultValue={t?.id}
        readOnly={!!t}
        required
        placeholder="misal: sekolah-inklusi"
        hint={t ? "ID tidak bisa diubah" : "Huruf kecil & tanda hubung, dipakai aplikasi"}
      />
      <SelectField
        label="Untuk"
        name="role"
        defaultValue={t?.role ?? role}
        options={[
          { value: "parent", label: "Orang tua" },
          { value: "teacher", label: "Shadow teacher" },
        ]}
      />
      <Field label="Label chip" name="label" defaultValue={t?.label} required className="sm:col-span-2" placeholder="Pantau progress anak" />
      <Field label="Pertanyaan (pesan user)" name="question" defaultValue={t?.question} required className="sm:col-span-2" />
      <TextareaField
        label="Jawaban Doobie"
        name="answer"
        defaultValue={t?.answer.join("\n\n")}
        required
        className="sm:col-span-2 [&_textarea]:min-h-48"
        hint="Pisahkan dengan baris kosong. Setiap paragraf tampil sebagai satu gelembung chat."
      />
    </div>
  );
}

export default function DoobiePage(props: PageProps<"/konten/doobie">) {
  return (
    <>
      <BackLink href="/konten" label="Konten" />
      <PageHeader
        title="Template Doobie"
        description="Topik yang muncul sebagai chip di kartu dan chat Doobie, beserta jawabannya."
        actions={
          <ActionDialog
            action={saveDoobieAction}
            hidden={{ isNew: "true" }}
            triggerLabel="Tambah topik"
            triggerIcon={<Plus />}
            triggerTone="primary"
            title="Tambah topik Doobie"
            submitLabel="Simpan"
            wide>
            <TopicFields role="parent" />
          </ActionDialog>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <DoobieContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function DoobieContent({ searchParams }: Pick<PageProps<"/konten/doobie">, "searchParams">) {
  await getCurrentAdmin();
  const role = (param(await searchParams, "role") || "parent") as ContentRole;
  const all = await listDoobieTopics();
  const topics = all.filter((t) => t.role === role);

  return (
    <>
      <FilterTabs
        basePath="/konten/doobie"
        param="role"
        current={role}
        tabs={[
          { label: "Orang tua", value: "parent", count: all.filter((t) => t.role === "parent").length },
          { label: "Shadow teacher", value: "teacher", count: all.filter((t) => t.role === "teacher").length },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {topics.map((t) => (
          <article key={t.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm shadow-brand-dark/5">
            <div className="flex items-start gap-2">
              <span className="rounded-full border-2 border-brand px-3 py-1 text-sm font-semibold text-brand">{t.label}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">{t.id}</span>
            </div>
            {/* pratinjau percakapan seperti di aplikasi */}
            <div className="space-y-2 rounded-xl bg-surface p-3">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3 py-2 text-sm text-white">{t.question}</p>
              {t.answer.map((a, i) => (
                <div key={i} className="flex items-end gap-2">
                  {i === 0 ? (
                    <Image src="/brand/doobie.png" alt="" width={28} height={20} className="size-7 rounded-full bg-brand-soft object-contain" />
                  ) : (
                    <span className="size-7" />
                  )}
                  <p className="max-w-[85%] rounded-2xl rounded-bl-md border bg-white px-3 py-2 text-sm">{a}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto flex gap-2">
              <ActionDialog
                action={saveDoobieAction}
                hidden={{ isNew: "false" }}
                triggerLabel="Ubah"
                triggerIcon={<Pencil />}
                triggerSize="sm"
                title={`Ubah topik “${t.label}”`}
                submitLabel="Simpan"
                reason={{ label: "Alasan perubahan" }}
                wide>
                <TopicFields t={t} role={role} />
              </ActionDialog>
              <ActionDialog
                action={deleteDoobieAction}
                hidden={{ id: t.id }}
                triggerLabel="Hapus"
                triggerIcon={<Trash2 />}
                triggerTone="danger"
                triggerSize="sm"
                title="Hapus topik?"
                description="Chip topik ini tidak lagi muncul di aplikasi."
                submitLabel="Hapus"
                submitTone="danger"
                reason={{ label: "Alasan", required: true }}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
