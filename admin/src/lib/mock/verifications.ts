import "server-only";

import type { TeacherApplication, TeacherDocument } from "@/types/verification";

// dari data aplikasi: src/data/psychologist.ts (applicants)
const docs = (uploaded: boolean[], degree: string): TeacherDocument[] =>
  (
    [
      ["KTP", "KTP"],
      ["LAINNYA", "Foto diri"],
      ["IJAZAH", degree],
      ["SERTIFIKAT", "Sertifikat pelatihan"],
      ["CV", "CV / Portofolio"],
    ] as const
  ).map(([type, label], i) => ({
    id: `doc_${label.replace(/\W+/g, "").toLowerCase()}_${i}`,
    type,
    label,
    url: uploaded[i] ? "/brand/doobie.png" : null, // contoh berkas (gambar placeholder)
    status: uploaded[i] ? "PENDING" : "UNVERIFIED",
    note: null,
  }));

export const mockApplications: TeacherApplication[] = [
  {
    id: "tp_dimas",
    userId: "u_dimas_s",
    fullName: "Dimas Saputra",
    title: "S.Pd",
    domicile: "Malang, Jawa Timur",
    education: "S1 Pendidikan Luar Biasa · Universitas Negeri Malang",
    experienceYears: 3,
    pricePerSession: 160000,
    specializations: ["Kurang kontak mata", "Sulit berinteraksi dengan teman", "Sulit bergiliran & berbagi"],
    bio: "Pernah menjadi guru pendamping di SD inklusi selama 3 tahun. Terbiasa memakai jadwal visual dan social story.",
    documents: docs([true, true, true, true, true], "Ijazah S1 PLB"),
    psychologistReview: {
      psychologistName: "Amanda Putri, M.Psi.",
      recommendation: "revision",
      issues: ["Sertifikat pelatihan tidak jelas / perlu diperbarui", "Perlu interview ulang"],
      note: "Paham strategi visual, tapi sertifikat ABA buram dan jawaban soal penanganan tantrum masih umum.",
      interview: "Kamis, 8 Okt · 13:00 (online)",
      reviewedAt: "2026-10-30T07:00:00.000Z",
    },
    status: "PENDING",
    decisionNote: null,
    decidedAt: null,
    submittedAt: "2026-10-28T03:00:00.000Z",
  },
  {
    id: "tp_nadia",
    userId: "u_nadia",
    fullName: "Nadia Putri",
    title: "S.Psi",
    domicile: "Malang, Jawa Timur",
    education: "S1 Psikologi · Universitas Brawijaya",
    experienceYears: 1,
    pricePerSession: 130000,
    specializations: ["Speech delay", "Sulit menyampaikan kebutuhan"],
    bio: "Asisten terapis wicara di klinik tumbuh kembang. Suka memakai permainan peran untuk melatih ekspresi emosi.",
    documents: docs([true, true, true, false, true], "Ijazah S1 Psikologi"),
    psychologistReview: {
      psychologistName: "Amanda Putri, M.Psi.",
      recommendation: "verified",
      issues: ["Sertifikat pelatihan belum diunggah"],
      note: "Komunikatif dan hangat. Sertifikat pelatihan bisa menyusul, tidak menghalangi verifikasi.",
      interview: "Jumat, 9 Okt · 10:00 (online)",
      reviewedAt: "2026-10-31T04:00:00.000Z",
    },
    status: "PENDING",
    decisionNote: null,
    decidedAt: null,
    submittedAt: "2026-10-30T03:00:00.000Z",
  },
  {
    id: "tp_rizky",
    userId: "u_rizky",
    fullName: "Rizky Ananda",
    title: "A.Md.Kep",
    domicile: "Malang, Jawa Timur",
    education: "D3 Keperawatan · Poltekkes Malang",
    experienceYears: 0,
    pricePerSession: 110000,
    specializations: ["Sensitif terhadap sentuhan"],
    bio: "Pernah mendampingi anak dengan keterlambatan motorik di rumah sakit anak selama 6 bulan.",
    documents: docs([true, true, true, true, false], "Ijazah D3"),
    psychologistReview: null,
    status: "PENDING",
    decisionNote: null,
    decidedAt: null,
    submittedAt: "2026-10-31T03:00:00.000Z",
  },
  {
    id: "tp_kirana",
    userId: "u_kirana",
    fullName: "Kirana Wulan",
    title: "S.Pd",
    domicile: "Malang, Jawa Timur",
    education: "S1 Pendidikan PAUD · Universitas Negeri Malang",
    experienceYears: 4,
    pricePerSession: 170000,
    specializations: ["Speech delay", "Kesulitan membaca & menulis"],
    bio: "Guru PAUD inklusi selama 4 tahun, berpengalaman melatih kesiapan membaca anak speech delay.",
    documents: docs([true, true, true, true, true], "Ijazah S1 PAUD").map((d) => ({ ...d, status: "VERIFIED" })),
    psychologistReview: {
      psychologistName: "Dimas Wicaksono, S.Psi.",
      recommendation: "verified",
      issues: [],
      note: "Komunikatif dan paham strategi visual.",
      interview: "Senin, 28 Sep · 09:00 (online)",
      reviewedAt: "2026-10-23T03:00:00.000Z",
    },
    status: "VERIFIED",
    decisionNote: "Dokumen lengkap, sesuai rekomendasi psikolog.",
    decidedAt: "2026-10-24T02:00:00.000Z",
    submittedAt: "2026-10-22T03:00:00.000Z",
  },
];

// pilihan catatan revisi (sama dengan aplikasi psikolog: GENERAL_ISSUES)
export const REVISION_ISSUES = [
  "Pengalaman belum relevan",
  "Perlu interview ulang",
  "Data diri tidak lengkap",
  "Dokumen buram / tidak terbaca",
  "Dokumen wajib belum diunggah",
];
