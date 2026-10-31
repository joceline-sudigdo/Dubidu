import {
  Banknote,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // false = halaman belum dibangun (ditampilkan dengan label "Segera")
  ready: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

// urutan mengikuti prioritas MVP dari hasil audit
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Utama",
    items: [{ label: "Ringkasan", href: "/", icon: LayoutDashboard, ready: true }],
  },
  {
    title: "Tinjauan",
    items: [
      { label: "Verifikasi Teacher", href: "/verifikasi", icon: ShieldCheck, ready: true },
      { label: "Bukti Transfer", href: "/pembayaran", icon: ReceiptText, ready: true },
      { label: "Pencairan Dana", href: "/pencairan", icon: Banknote, ready: true },
    ],
  },
  {
    title: "Kelola",
    items: [
      { label: "Pengguna", href: "/pengguna", icon: Users, ready: true },
      { label: "Moderasi", href: "/moderasi", icon: MessageSquareWarning, ready: true },
      { label: "Konten", href: "/konten", icon: FileText, ready: true },
    ],
  },
  {
    title: "Keamanan",
    items: [{ label: "Audit Log", href: "/audit-log", icon: ScrollText, ready: true }],
  },
];
