/** Client-safe Facebook post text builders (also used inside server handlers). */

export type CaptionNews = {
  slug: string;
  title: string;
  summary?: string | null;
  reporter_name?: string | null;
  reporter_designation?: string | null;
  published_at?: string | null;
};

export type CaptionSettings = {
  site_name?: string | null;
  website_url?: string | null;
};

/** Canonical link of a news article, preferring the configured website URL. */
export function newsLink(news: Pick<CaptionNews, "slug">, baseUrl?: string | null): string {
  const path = `/news/${encodeURIComponent(news.slug)}`;
  const base = baseUrl && /^https?:\/\//.test(baseUrl) ? baseUrl : typeof window !== "undefined" ? window.location.origin : "https://mohakaltelevision.lovable.app";
  try {
    return new URL(path, base).href;
  } catch {
    return `${base}${path}`;
  }
}

/** Main Facebook post caption: attention-grabbing, no link-bait penalty text. */
export function buildFacebookCaption(news: CaptionNews, settings: CaptionSettings): string {
  const lines: string[] = [`🔴 ${settings.site_name || "মহাকাল টেলিভিশন"}`, "", news.title];
  if (news.summary && news.summary.trim()) lines.push("", news.summary.trim().slice(0, 600));
  if (news.published_at) {
    const date = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric" }).format(new Date(news.published_at));
    lines.push("", `🗓 প্রকাশ: ${date}`);
  }
  const reporter = [news.reporter_name, news.reporter_designation && `(${news.reporter_designation})`].filter(Boolean).join(" ");
  if (reporter) lines.push(`✍️ প্রতিবেদক: ${reporter}`);
  lines.push("", `🔗 বিস্তারিত পড়ুন: ${newsLink(news, settings.website_url)}`);
  lines.push("", "#মহাকালটেলিভিশন #MohakalTelevision #বাংলাসংবাদ");
  return lines.join("\n");
}

/** The first-comment text that carries the article link (Facebook reach trick). */
export function buildFacebookComment(url: string): string {
  return `👇 বিস্তারিত সংবাদের লিঙ্ক:\n${url}`;
}
