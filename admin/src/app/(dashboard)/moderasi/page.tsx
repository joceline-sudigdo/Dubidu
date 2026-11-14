import type { Metadata } from "next";
import { Suspense } from "react";

import { PostList } from "@/components/moderation/post-list";
import { ReportList } from "@/components/moderation/report-list";
import { ReviewTable } from "@/components/moderation/review-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { listPosts, listReports, listReviews } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/dal";
import { param } from "@/lib/labels";

export const metadata: Metadata = { title: "Moderasi" };

export default function ModerasiPage(props: PageProps<"/moderasi">) {
  return (
    <>
      <PageHeader
        title="Moderasi"
        description="Tindak laporan pengguna, rapikan postingan komunitas, dan sembunyikan ulasan yang melanggar aturan."
      />
      <Suspense fallback={<TableSkeleton />}>
        <ModerasiContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ModerasiContent({ searchParams }: Pick<PageProps<"/moderasi">, "searchParams">) {
  await getCurrentAdmin();
  const sp = await searchParams;
  const tab = param(sp, "tab") || "laporan";
  const [reports, posts, reviews] = await Promise.all([listReports(), listPosts(), listReviews()]);
  const openReports = reports.filter((r) => r.status === "OPEN");

  return (
    <>
      <FilterTabs
        basePath="/moderasi"
        param="tab"
        current={tab}
        tabs={[
          { label: "Laporan baru", value: "laporan", count: openReports.length },
          { label: "Riwayat laporan", value: "riwayat", count: reports.length - openReports.length },
          { label: "Postingan", value: "postingan", count: posts.length },
          { label: "Ulasan", value: "ulasan", count: reviews.length },
        ]}
      />
      {tab === "laporan" && <ReportList reports={openReports} />}
      {tab === "riwayat" && <ReportList reports={reports.filter((r) => r.status !== "OPEN")} />}
      {tab === "postingan" && <PostList posts={[...posts].sort((a, b) => b.reportCount - a.reportCount)} />}
      {tab === "ulasan" && <ReviewTable reviews={reviews} />}
    </>
  );
}
