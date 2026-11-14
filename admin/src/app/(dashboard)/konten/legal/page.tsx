import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/shared/back-link";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listLegal } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { param } from "@/lib/labels";
import type { LegalType } from "@/types/content";

import { LegalEditor } from "./legal-editor";

export const metadata: Metadata = { title: "Konten Legal" };

export default function LegalPage(props: PageProps<"/konten/legal">) {
  return (
    <>
      <BackLink href="/konten" label="Konten" />
      <PageHeader
        title="Konten Legal"
        description="Setiap simpanan menjadi versi baru. Pengguna melihat versi terbaru di menu Pengaturan aplikasi."
      />
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <LegalContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function LegalContent({ searchParams }: Pick<PageProps<"/konten/legal">, "searchParams">) {
  await getCurrentAdmin();
  const type = (param(await searchParams, "doc") || "terms") as LegalType;
  const docs = await listLegal();
  const doc = docs.find((d) => d.type === type) ?? docs[0];

  return (
    <>
      <FilterTabs basePath="/konten/legal" param="doc" current={doc.type} tabs={docs.map((d) => ({ label: d.title, value: d.type }))} />
      <p className="mb-4 text-sm text-muted-foreground">
        Versi {doc.version} · diperbarui {formatDateTime(doc.updatedAt)}
        {doc.updatedByName && ` oleh ${doc.updatedByName}`}
      </p>
      {/* key: editor di-reset saat ganti dokumen */}
      <LegalEditor key={doc.type} doc={doc} />
    </>
  );
}
