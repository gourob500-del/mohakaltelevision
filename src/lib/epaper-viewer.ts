/** Browser-safe helpers for the e-paper viewer. No server-only imports. */
import { supabase } from "@/integrations/supabase/client";
import { dhakaDate, type EpaperPageData, type TemplateConfig } from "@/lib/epaper-layout";

export type EpaperIssueRow = {
  issue_date: string;
  source_date: string;
  status: string;
  pages: EpaperPageData[];
  template: TemplateConfig & { logo_url?: string | null };
  page_count: number;
  news_count: number;
  generated_at: string;
};

let fontPromise: Promise<void> | undefined;

/** Loads the bundled SolaimanLipi font once; Bengali text must not depend on visitor fonts. */
export function ensureEpaperFont(): Promise<void> {
  fontPromise ??= (async () => {
    const font = new FontFace("SolaimanLipi", "url('/fonts/solaiman-lipi.woff2')");
    document.fonts.add(await font.load());
    await document.fonts.load('16px "SolaimanLipi"');
  })().catch((error) => {
    fontPromise = undefined;
    throw error;
  });
  return fontPromise;
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Lists recent published issues for the archive. */
export async function fetchRecentIssues(
  limit = 45,
): Promise<Pick<EpaperIssueRow, "issue_date" | "page_count" | "news_count">[]> {
  const { data, error } = await supabase
    .from("epaper_issues")
    .select("issue_date, page_count, news_count")
    .eq("status", "PUBLISHED")
    .order("issue_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Fetches one published issue by Dhaka issue date. */
export async function fetchIssue(issueDate: string): Promise<EpaperIssueRow | null> {
  const { data, error } = await supabase
    .from("epaper_issues")
    .select("issue_date, source_date, status, pages, template, page_count, news_count, generated_at")
    .eq("issue_date", issueDate)
    .eq("status", "PUBLISHED")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as EpaperIssueRow | null) ?? null;
}

export function todayDhaka(): string {
  return dhakaDate();
}

export function addDaysLocal(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Paper sizes supported for print/PDF: width x height in mm. */
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, label: "A4" },
  A3: { width: 297, height: 420, label: "A3" },
} as const;

export type PaperSize = keyof typeof PAPER_SIZES;

/** Zoom multipliers offered in the viewer. */
export const ZOOM_LEVELS = [0.8, 1, 1.25, 1.5] as const;
