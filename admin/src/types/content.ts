// Konten & konfigurasi yang sekarang masih hard-coded di aplikasi (src/data/*).
// Semuanya butuh tabel baru di backend (lihat hasil audit).

export type LegalType = "terms" | "privacy";

// app: src/data/legal.ts
export type LegalDoc = {
  type: LegalType;
  title: string;
  version: number;
  updatedAt: string;
  updatedByName: string | null;
  sections: { h: string; p: string }[];
};

// app: src/app/bantuan.tsx (FAQ)
export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
};

export type ContentRole = "parent" | "teacher";

// app: src/data/doobie.ts
export type DoobieTopic = {
  id: string;
  role: ContentRole;
  label: string;
  question: string;
  answer: string[];
  order: number;
};

export type RewardCategory = "Voucher" | "Cashback" | "Kesehatan";

// app: src/data/rewards.ts
export type Reward = {
  id: string;
  role: ContentRole;
  title: string;
  subtitle: string;
  cost: number;
  category: RewardCategory;
  icon: string;
  minLevel: number | null;
  stock: number | null; // null = tanpa batas (kolom baru)
  active: boolean;
};

export type Mission = {
  id: string;
  role: ContentRole;
  title: string;
  subtitle: string;
  reward: number;
  actionLabel: string;
  active: boolean;
};

export type RewardLevel = {
  level: number;
  name: string;
  min: number;
  perk: string | null;
};

export type RedemptionStatus = "ACTIVE" | "USED" | "CANCELLED";

export type Redemption = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  userName: string;
  role: ContentRole;
  code: string;
  cost: number;
  status: RedemptionStatus;
  redeemedAt: string;
  expiresAt: string;
};

// app: src/data/plus.ts
export type PlusPlan = {
  role: ContentRole;
  key: "bulanan" | "tahunan";
  title: string;
  price: number;
  note: string;
  badge: string | null;
};

export type PromoCode = {
  code: string;
  discountPercent: number;
  appliesTo: "CONSULTATION" | "SUBSCRIPTION" | "ALL";
  active: boolean;
  usageCount: number;
  expiresAt: string | null;
};

// biaya platform dll. (sekarang di env backend & src/data/contracts.ts)
export type AppSettings = {
  platformFeePercent: number;
  plusPlatformFeePercent: number;
  payoutFee: number;
  minPayout: number;
};
