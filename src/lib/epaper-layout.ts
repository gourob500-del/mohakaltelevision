/** Pure e-paper layout engine shared by server generation, admin preview and tests. */

export const MAX_PAGES = 4;

export type EpaperNewsInput = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  featured_image: string | null;
  caption: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  district: string | null;
  category_slug: string | null;
  category_name: string | null;
  is_top: boolean;
  is_breaking: boolean;
  published_at: string;
};

export type EpaperAdInput = {
  id: string;
  title: string;
  organization: string | null;
  image_url: string;
  link_url: string | null;
  starts_on: string | null;
  ends_on: string | null;
  pages: number[];
  position: "top" | "bottom" | "left" | "right" | "middle" | "full";
  size: "small" | "medium" | "large";
  is_active: boolean;
  sort_order: number;
};

export type TemplateConfig = {
  columns: Record<string, number>;
  headlineSize: number;
  bodySize: number;
  accent: string;
  ink: string;
  paper: string;
  margin: number;
  capacity: Record<string, number>;
};

export const DEFAULT_TEMPLATE: TemplateConfig = {
  columns: { "1": 4, "2": 3, "3": 3, "4": 3 },
  headlineSize: 40,
  bodySize: 14,
  accent: "#d71920",
  ink: "#111111",
  paper: "#ffffff",
  margin: 14,
  capacity: { "1": 7, "2": 9, "3": 9, "4": 9 },
};

export const PAGE_TITLES: Record<number, string> = {
  1: "প্রথম পাতা",
  2: "জাতীয় ও আন্তর্জাতিক",
  3: "স্থানীয় সংবাদ",
  4: "খেলা, বিনোদন ও অন্যান্য",
};

export type ItemSize = "lead" | "medium" | "small";
export const SIZE_UNITS: Record<ItemSize, number> = { lead: 4, medium: 2, small: 1 };
const AD_UNITS: Record<EpaperAdInput["size"], number> = { small: 1, medium: 2, large: 3 };
const EXCERPT_CHARS: Record<ItemSize, number> = { lead: 900, medium: 420, small: 220 };

export type EpaperItem = {
  newsId: string;
  slug: string;
  title: string;
  excerpt: string;
  truncated: boolean;
  image: string | null;
  caption: string | null;
  byline: string;
  category: string | null;
  size: ItemSize;
};

export type EpaperAdPlacement = Omit<EpaperAdInput, "pages" | "is_active" | "sort_order" | "starts_on" | "ends_on">;

export type EpaperPageData = {
  number: number;
  title: string;
  kind: "front" | "general" | "local" | "ads";
  items: EpaperItem[];
  ads: EpaperAdPlacement[];
};

/** Dhaka is UTC+6 with no DST. Returns the UTC instant range of a Dhaka calendar day. */
export function dhakaDayRange(day: string): { start: string; end: string } {
  const start = new Date(`${day}T00:00:00+06:00`);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Today's calendar date in Dhaka (YYYY-MM-DD) for a given instant. */
export function dhakaDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The issue for day D contains news published on D-1 (Dhaka). */
export function sourceDateFor(issueDate: string): string {
  return addDays(issueDate, -1);
}

/** Next automatic run: 00:10 Dhaka. */
export function nextRunAt(now: Date = new Date()): Date {
  const today = dhakaDate(now);
  const todayRun = new Date(`${today}T00:10:00+06:00`);
  return todayRun.getTime() > now.getTime() ? todayRun : new Date(`${addDays(today, 1)}T00:10:00+06:00`);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts only at sentence boundaries so meaning is never altered mid-sentence. */
export function sentenceExcerpt(text: string, maxChars: number): { text: string; truncated: boolean } {
  const clean = text.trim();
  if (clean.length <= maxChars) return { text: clean, truncated: false };
  const sentences = clean.match(/[^।.!?]+[।.!?]+["'”’]?\s*|[^।.!?]+$/g) ?? [clean];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > maxChars) break;
    out += s;
  }
  if (!out) out = sentences[0] ?? "";
  // A single very long first sentence is kept whole rather than cut mid-sentence.
  return { text: out.trim(), truncated: out.trim().length < clean.length };
}

export function adActiveOn(ad: EpaperAdInput, day: string): boolean {
  if (!ad.is_active) return false;
  if (ad.starts_on && ad.starts_on > day) return false;
  if (ad.ends_on && ad.ends_on < day) return false;
  return true;
}

function priority(n: EpaperNewsInput): number {
  return (n.is_top ? 2 : 0) + (n.is_breaking ? 1 : 0);
}

export type Overrides = Record<string, number>; // newsId -> page (0 = exclude)

export type LayoutInput = {
  issueDate: string;
  news: EpaperNewsInput[];
  ads: EpaperAdInput[];
  pageCategories: Record<string, string[]>;
  template: TemplateConfig;
  overrides?: Overrides;
};

export type LayoutResult = { pages: EpaperPageData[]; included: number; leftOver: number };

function toItem(n: EpaperNewsInput, size: ItemSize): EpaperItem {
  const body = stripHtml(n.content);
  const source = body.length > 40 ? body : n.summary?.trim() || body;
  const ex = sentenceExcerpt(source, EXCERPT_CHARS[size]);
  return {
    newsId: n.id,
    slug: n.slug,
    title: n.title,
    excerpt: ex.text,
    truncated: ex.truncated,
    image: size === "small" ? null : n.featured_image,
    caption: size === "small" ? null : n.caption,
    byline: [n.reporter_name, n.reporter_designation, n.district].filter(Boolean).join(", "),
    category: n.category_name,
    size,
  };
}

/** Builds at most 4 pages. Never returns more, whatever the input. */
export function buildLayout(input: LayoutInput): LayoutResult {
  const { issueDate, template } = input;
  const overrides = input.overrides ?? {};
  const seen = new Set<string>();
  const news = [...input.news]
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return overrides[n.id] !== 0;
    })
    .sort((a, b) => priority(b) - priority(a) || b.published_at.localeCompare(a.published_at));

  const ads = input.ads.filter((a) => adActiveOn(a, issueDate)).sort((a, b) => a.sort_order - b.sort_order);
  const pageAds: Record<number, EpaperAdPlacement[]> = { 1: [], 2: [], 3: [], 4: [] };
  const remaining: Record<number, number> = {};
  for (let p = 1; p <= MAX_PAGES; p++) remaining[p] = Math.max(2, template.capacity[String(p)] ?? 8);
  const fullAdPages = new Set<number>();
  for (const ad of ads) {
    for (const p of ad.pages) {
      if (p < 1 || p > MAX_PAGES) continue;
      const { pages: _p, is_active: _a, sort_order: _s, starts_on: _st, ends_on: _e, ...placement } = ad;
      if (ad.position === "full") {
        if (p === 1 || fullAdPages.has(p)) continue; // front page always carries news
        fullAdPages.add(p);
        pageAds[p] = [placement];
        remaining[p] = 0;
      } else if (!fullAdPages.has(p)) {
        const cost = AD_UNITS[ad.size];
        // Ads may use at most half of a page so news is never pushed out entirely.
        const cap = Math.floor((template.capacity[String(p)] ?? 8) / 2);
        const used = pageAds[p]!.reduce((s, a) => s + AD_UNITS[a.size], 0);
        if (used + cost > cap) continue;
        pageAds[p]!.push(placement);
        remaining[p] = remaining[p]! - cost;
      }
    }
  }

  const pageOf = (n: EpaperNewsInput): number => {
    const forced = overrides[n.id];
    if (forced && forced >= 1 && forced <= MAX_PAGES) return forced;
    for (const p of ["2", "3", "4"]) {
      if (n.category_slug && (input.pageCategories[p] ?? []).includes(n.category_slug)) return Number(p);
    }
    return 4;
  };

  const items: Record<number, EpaperItem[]> = { 1: [], 2: [], 3: [], 4: [] };
  const place = (p: number, n: EpaperNewsInput): boolean => {
    if (fullAdPages.has(p)) return false;
    const first = items[p]!.length === 0;
    const sizes: ItemSize[] = first ? ["lead", "medium", "small"] : ["medium", "small"];
    for (const s of sizes) {
      if (SIZE_UNITS[s] <= remaining[p]!) {
        items[p]!.push(toItem(n, s));
        remaining[p] = remaining[p]! - SIZE_UNITS[s];
        return true;
      }
    }
    return false;
  };

  const leftovers: EpaperNewsInput[] = [];
  const forcedOrFront = news.filter((n) => overrides[n.id] && overrides[n.id]! > 0);
  const auto = news.filter((n) => !(overrides[n.id] && overrides[n.id]! > 0));
  for (const n of forcedOrFront) if (!place(pageOf(n), n)) leftovers.push(n);
  // Front page: highest priority first, a mix of all sections.
  const front = auto.slice(0, 5);
  for (const n of front) if (!place(1, n)) leftovers.push(n);
  for (const n of auto.slice(5)) if (!place(pageOf(n), n)) leftovers.push(n);
  // Spill into any page that still has room.
  const unplaced: EpaperNewsInput[] = [];
  for (const n of leftovers) {
    let ok = false;
    for (let p = 2; p <= MAX_PAGES && !ok; p++) ok = place(p, n);
    if (!ok) unplaced.push(n);
  }

  const kinds: EpaperPageData["kind"][] = ["front", "general", "local", "ads"];
  const pages: EpaperPageData[] = [];
  for (let p = 1; p <= MAX_PAGES; p++) {
    if (items[p]!.length === 0 && pageAds[p]!.length === 0) continue; // no empty pages
    if (p === 1 && items[p]!.length === 0) continue;
    pages.push({ number: 0, title: PAGE_TITLES[p]!, kind: kinds[p - 1]!, items: items[p]!, ads: pageAds[p]! });
  }
  // A page of ads only is kept only when there is real news in the issue.
  const hasNews = pages.some((pg) => pg.items.length > 0);
  const final = (hasNews ? pages : []).slice(0, MAX_PAGES).map((pg, i) => ({ ...pg, number: i + 1 }));
  const included = final.reduce((s, pg) => s + pg.items.length, 0);
  return { pages: final, included, leftOver: unplaced.length };
}
