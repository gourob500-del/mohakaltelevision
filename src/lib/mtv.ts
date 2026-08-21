export const NEWS_STATUSES = [
  "DRAFT",
  "PENDING",
  "CORRECTION_REQUIRED",
  "APPROVED",
  "PUBLISHED",
  "REJECTED",
] as const;

export type NewsStatus = (typeof NEWS_STATUSES)[number];

export const STATUS_BN: Record<NewsStatus, string> = {
  DRAFT: "খসড়া",
  PENDING: "অপেক্ষমাণ",
  CORRECTION_REQUIRED: "সংশোধন প্রয়োজন",
  APPROVED: "অনুমোদিত",
  PUBLISHED: "প্রকাশিত",
  REJECTED: "বাতিল",
};

export const STATUS_CLASS: Record<NewsStatus, string> = {
  DRAFT: "bg-status-draft/15 text-status-draft border-status-draft/30",
  PENDING: "bg-status-pending/15 text-status-pending border-status-pending/30",
  CORRECTION_REQUIRED:
    "bg-status-correction/15 text-status-correction border-status-correction/30",
  APPROVED: "bg-status-approved/15 text-status-approved border-status-approved/30",
  PUBLISHED: "bg-status-published/15 text-status-published border-status-published/30",
  REJECTED: "bg-status-rejected/15 text-status-rejected border-status-rejected/30",
};

export const ACCOUNT_STATUS_BN: Record<string, string> = {
  PENDING: "অপেক্ষমাণ",
  ACTIVE: "সক্রিয়",
  SUSPENDED: "স্থগিত",
};

export const ROLE_BN: Record<string, string> = {
  SUPER_ADMIN: "সুপার অ্যাডমিন",
  ADMIN: "অ্যাডমিন",
  REPRESENTATIVE: "প্রতিনিধি",
  VISITOR: "দর্শক",
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function formatBnDate(input?: string | null, withTime = true): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const date = `${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBn(d.getFullYear())}`;
  if (!withTime) return date;
  const h24 = d.getHours();
  const period = h24 < 12 ? "পূর্বাহ্ণ" : "অপরাহ্ণ";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${toBn(h)}:${toBn(m)} ${period}`;
}

export function makeSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ascii || "mtv-news"}-${rand}`;
}

export const NAV_LINKS: { label: string; to: string; params?: Record<string, string> }[] = [
  { label: "প্রচ্ছদ", to: "/" },
  { label: "সর্বশেষ", to: "/latest" },
  { label: "জাতীয়", to: "/category/national" },
  { label: "আন্তর্জাতিক", to: "/category/international" },
  { label: "জেলা", to: "/district" },
  { label: "ধর্ম", to: "/category/religion" },
  { label: "শিক্ষা", to: "/category/education" },
  { label: "রাজনীতি", to: "/category/politics" },
  { label: "বিনোদন", to: "/category/entertainment" },
  { label: "খেলাধুলা", to: "/category/sports" },
  { label: "অন্যান্য", to: "/category/others" },
];
