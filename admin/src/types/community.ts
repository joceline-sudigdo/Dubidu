// Dasar: `CommunityPost`, `PostComment`, `Review` di schema.
// Kolom `status` (moderasi) dan tabel `ContentReport` = baru.

export type ModerationStatus = "VISIBLE" | "HIDDEN";

export type CommunityComment = {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  status: ModerationStatus;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string; // "Orang Tua" | "Shadow Teacher" | "Psikolog"
  topic: string;
  text: string;
  photoCount: number;
  likeCount: number;
  comments: CommunityComment[];
  status: ModerationStatus;
  hiddenReason: string | null;
  reportCount: number;
  createdAt: string;
};

export type Review = {
  id: string;
  authorName: string;
  targetUserId: string;
  targetName: string;
  targetRole: "TEACHER" | "PSYCHOLOGIST";
  rating: number;
  comment: string | null;
  status: ModerationStatus;
  hiddenReason: string | null;
  createdAt: string;
};

export type ReportTargetType = "POST" | "COMMENT" | "USER" | "CONVERSATION";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

// laporan dari tombol "Laporkan" di aplikasi. Untuk CONVERSATION, admin hanya melihat alasan, bukan isi chat.
export type ContentReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string; // ringkasan target, misal potongan postingan atau nama akun
  targetUserId: string | null; // pemilik konten yang dilaporkan
  targetUserName: string | null;
  reporterName: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  resolution: string | null;
  handledByName: string | null;
  handledAt: string | null;
  createdAt: string;
};
