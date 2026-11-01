/**
 * Server-side e-paper generation engine.
 * Runs only inside server handlers (dynamically imported) — never on the client.
 */
import {
  buildLayout,
  DEFAULT_TEMPLATE,
  dhakaDate,
  dhakaDayRange,
  sourceDateFor,
  type EpaperAdInput,
  type EpaperNewsInput,
  type Overrides,
  type TemplateConfig,
} from "./epaper-layout";

export type GenerateOutcome =
  | { ok: true; skipped: false; issueDate: string; sourceDate: string; pageCount: number; newsCount: number; leftOver: number }
  | { ok: true; skipped: true; reason: string; issueDate: string }
  | { ok: false; issueDate: string; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type EpaperSettingsRow = {
  automation_enabled: boolean;
  logo_url: string | null;
  page_categories: Record<string, string[]> | null;
};

type NewsDbRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  featured_image: string | null;
  caption: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  is_top: boolean;
  is_breaking: boolean;
  published_at: string;
  category: { slug: string; name: string } | null;
  district: { name: string } | null;
};

/** Merges stored template config over the defaults so bad/partial data can never break generation. */
export function mergeTemplate(raw: unknown): TemplateConfig {
  const base: TemplateConfig = structuredClone(DEFAULT_TEMPLATE);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<TemplateConfig>;
  if (r.columns && typeof r.columns === "object") base.columns = { ...base.columns, ...r.columns };
  if (r.capacity && typeof r.capacity === "object") base.capacity = { ...base.capacity, ...r.capacity };
  if (typeof r.headlineSize === "number" && r.headlineSize > 0) base.headlineSize = r.headlineSize;
  if (typeof r.bodySize === "number" && r.bodySize > 0) base.bodySize = r.bodySize;
  if (typeof r.accent === "string") base.accent = r.accent;
  if (typeof r.ink === "string") base.ink = r.ink;
  if (typeof r.paper === "string") base.paper = r.paper;
  if (typeof r.margin === "number" && r.margin >= 0) base.margin = r.margin;
  return base;
}

/**
 * Generates (or regenerates) the e-paper issue for a Dhaka calendar day.
 * The issue for day D uses news published on D-1 (Dhaka).
 * Upserts by issue_date, so the same issue is never duplicated.
 */
export async function generateIssue(opts: {
  issueDate?: string;
  trigger: string;
  respectAutomation?: boolean;
  /** Explicit overrides; when omitted, the issue's stored manual overrides are kept. */
  overrides?: Overrides;
}): Promise<GenerateOutcome> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const issueDate = opts.issueDate && DATE_RE.test(opts.issueDate) ? opts.issueDate : dhakaDate();
  const sourceDate = sourceDateFor(issueDate);
  const range = dhakaDayRange(sourceDate);

  try {
    const [settingsQ, templateQ, adsQ, newsQ, existingQ] = await Promise.all([
      supabaseAdmin
        .from("epaper_settings")
        .select("automation_enabled, logo_url, page_categories")
        .eq("id", 1)
        .maybeSingle(),
      supabaseAdmin.from("epaper_templates").select("config").eq("is_active", true).maybeSingle(),
      supabaseAdmin.from("epaper_ads").select("*").order("sort_order"),
      supabaseAdmin
        .from("news")
        .select(
          "id, slug, title, summary, content, featured_image, caption, reporter_name, reporter_designation, is_top, is_breaking, published_at, category:categories(slug, name), district:districts(name)",
        )
        .eq("status", "PUBLISHED")
        .eq("epaper_exclude", false)
        .gte("published_at", range.start)
        .lte("published_at", range.end),
      supabaseAdmin.from("epaper_issues").select("overrides").eq("issue_date", issueDate).maybeSingle(),
    ]);

    const settings = (settingsQ.data ?? null) as EpaperSettingsRow | null;
    if (opts.respectAutomation && settings && !settings.automation_enabled) {
      await supabaseAdmin.from("epaper_runs").insert({
        issue_date: issueDate,
        trigger: opts.trigger,
        status: "SKIPPED",
        message: "অটোমেশন বন্ধ আছে",
      });
      return { ok: true, skipped: true, reason: "অটোমেশন বন্ধ আছে", issueDate };
    }

    const template = mergeTemplate(templateQ.data?.config);
    const pageCategories = settings?.page_categories ?? {};
    const storedOverrides = (existingQ.data?.overrides ?? {}) as Overrides;
    const overrides = opts.overrides ?? storedOverrides;

    const news: EpaperNewsInput[] = ((newsQ.data ?? []) as unknown as NewsDbRow[]).map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      content: n.content,
      featured_image: n.featured_image,
      caption: n.caption,
      reporter_name: n.reporter_name,
      reporter_designation: n.reporter_designation,
      district: n.district?.name ?? null,
      category_slug: n.category?.slug ?? null,
      category_name: n.category?.name ?? null,
      is_top: n.is_top,
      is_breaking: n.is_breaking,
      published_at: n.published_at,
    }));

    const ads: EpaperAdInput[] = ((adsQ.data ?? []) as unknown as EpaperAdInput[]).map((a) => ({
      id: a.id,
      title: a.title,
      organization: a.organization,
      image_url: a.image_url,
      link_url: a.link_url,
      starts_on: a.starts_on,
      ends_on: a.ends_on,
      pages: a.pages ?? [],
      position: a.position,
      size: a.size,
      is_active: a.is_active,
      sort_order: a.sort_order,
    }));

    const layout = buildLayout({ issueDate, news, ads, pageCategories, template, overrides });

    const { error: upsertError } = await supabaseAdmin.from("epaper_issues").upsert(
      {
        issue_date: issueDate,
        source_date: sourceDate,
        status: layout.included > 0 ? "PUBLISHED" : "DRAFT",
        pages: layout.pages,
        template: { ...template, logo_url: settings?.logo_url ?? null },
        page_count: layout.pages.length,
        news_count: layout.included,
        overrides,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "issue_date" },
    );

    if (upsertError) throw new Error(upsertError.message);

    const message =
      layout.included > 0
        ? `${layout.included} সংবাদ, ${layout.pages.length} পৃষ্ঠা`
        : "ওই দিনের কোনো প্রকাশিত সংবাদ পাওয়া যায়নি";
    await supabaseAdmin.from("epaper_runs").insert({
      issue_date: issueDate,
      trigger: opts.trigger,
      status: "SUCCESS",
      message,
      news_count: layout.included,
      page_count: layout.pages.length,
    });

    return {
      ok: true,
      skipped: false,
      issueDate,
      sourceDate,
      pageCount: layout.pages.length,
      newsCount: layout.included,
      leftOver: layout.leftOver,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "অজানা ত্রুটি";
    try {
      await supabaseAdmin.from("epaper_runs").insert({
        issue_date: issueDate,
        trigger: opts.trigger,
        status: "FAILED",
        message: error,
      });
    } catch {
      // logging must never mask the original failure
    }
    return { ok: false, issueDate, error };
  }
}
