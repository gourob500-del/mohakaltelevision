import { supabase } from "@/integrations/supabase/client";
import type { PublicWebsiteSettings } from "@/lib/settings.functions";

export type PhotoCardNews = {
  id: string;
  slug: string;
  title: string;
  status: string;
  featured_image: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  published_at: string | null;
  summary?: string | null;
  content?: string | null;
};

/** Dynamic fields a template can place. Text elements may also embed {{field}} placeholders. */
export const PHOTO_CARD_FIELDS = [
  { key: "logo", label: "লোগো", kind: "image" },
  { key: "news_image", label: "সংবাদের ছবি", kind: "image" },
  { key: "advertisement", label: "বিজ্ঞাপন", kind: "image" },
  { key: "headline", label: "শিরোনাম", kind: "text" },
  { key: "date", label: "তারিখ", kind: "text" },
  { key: "reporter_name", label: "প্রতিবেদকের নাম", kind: "text" },
  { key: "reporter_designation", label: "পদবি", kind: "text" },
  { key: "reporter_line", label: "নাম • পদবি", kind: "text" },
  { key: "news_content", label: "সংবাদের অংশ", kind: "text" },
  { key: "website", label: "ওয়েবসাইট", kind: "text" },
  { key: "social_media", label: "সোশ্যাল মিডিয়া", kind: "text" },
] as const;
export type PhotoCardField = (typeof PHOTO_CARD_FIELDS)[number]["key"];

export type TemplateElement = {
  type: "rect" | "text" | "field";
  field?: PhotoCardField | undefined;
  text?: string | undefined;
  x: number; y: number; w: number; h: number;
  color?: string | undefined;
  size?: number | undefined;
  bold?: boolean | undefined;
  align?: "left" | "center" | "right" | undefined;
  fit?: "contain" | "cover" | undefined;
  opacity?: number | undefined;
  border?: string | undefined;
};

export type PhotoCardTemplate = {
  id: string;
  name: string;
  width: number;
  height: number;
  background_color: string;
  background_url: string | null;
  elements: TemplateElement[];
  ad_image_url: string | null;
  ad_text: string | null;
  is_active: boolean;
  is_builtin: boolean;
  created_at?: string;
};

export const PHOTO_CARD_SIZE = 1200;
let fontPromise: Promise<void> | undefined;

function loadFont() {
  fontPromise ??= (async () => {
    const font = new FontFace("SolaimanLipi", "url('/fonts/solaiman-lipi.woff2')");
    document.fonts.add(await font.load());
    await document.fonts.load('48px "SolaimanLipi"');
  })().catch((error) => { fontPromise = undefined; throw error; });
  return fontPromise;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => { imageCache.delete(src); reject(new Error("ছবি লোড করা যায়নি। আবার চেষ্টা করুন।")); };
      image.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

export async function fetchActiveTemplate() {
  const { data, error } = await supabase.from("photo_card_templates").select("*").eq("is_active", true).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("কোনো সক্রিয় ফটোকার্ড টেমপ্লেট নেই। অ্যাডমিন প্যানেল থেকে একটি টেমপ্লেট চালু করুন।");
  return data as unknown as PhotoCardTemplate;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function newsExcerpt(news: PhotoCardNews) {
  let summary = news.summary, content = news.content;
  if (summary == null && content == null) {
    const { data } = await supabase.from("news").select("summary, content").eq("id", news.id).maybeSingle();
    summary = data?.summary ?? null; content = data?.content ?? null;
  }
  return stripHtml(summary || content || "");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    if (ctx.measureText(word).width > width) return null;
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks font to fit fully; with clamp, long text is cut with an ellipsis at the minimum readable size. */
function drawText(ctx: CanvasRenderingContext2D, el: TemplateElement, text: string, clamp: boolean) {
  if (!text) return;
  const max = el.size ?? 32, min = clamp ? Math.max(16, Math.round(max * 0.7)) : 14;
  ctx.textBaseline = "top";
  ctx.textAlign = el.align ?? "left";
  const x = el.align === "center" ? el.x + el.w / 2 : el.align === "right" ? el.x + el.w : el.x;
  for (let size = max; size >= min; size -= 2) {
    ctx.font = `${el.bold ? "bold " : ""}${size}px "SolaimanLipi", sans-serif`;
    const lh = size * 1.32;
    const lines = wrap(ctx, text, el.w);
    if (!lines) continue;
    const fits = lines.length * lh <= el.h;
    if (fits || (clamp && size - 2 < min)) {
      const count = Math.max(1, Math.floor(el.h / lh));
      const shown = lines.slice(0, count);
      if (lines.length > count) {
        let last = shown[count - 1];
        while (last && ctx.measureText(`${last}…`).width > el.w) last = last.split(" ").slice(0, -1).join(" ");
        shown[count - 1] = `${last}…`;
      }
      shown.forEach((l, i) => ctx.fillText(l, x, el.y + i * lh));
      return;
    }
  }
  throw new Error("লেখাটি ফটোকার্ডে সম্পূর্ণ বসানো যায়নি। টেমপ্লেটে লেখার জায়গা বড় করুন।");
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, el: TemplateElement) {
  const scale = el.fit === "cover" ? Math.max(el.w / img.width, el.h / img.height) : Math.min(el.w / img.width, el.h / img.height);
  const w = img.width * scale, h = img.height * scale;
  ctx.save();
  ctx.beginPath(); ctx.rect(el.x, el.y, el.w, el.h); ctx.clip();
  ctx.drawImage(img, el.x + (el.w - w) / 2, el.y + (el.h - h) / 2, w, h);
  ctx.restore();
}

export async function renderPhotoCard(news: PhotoCardNews, settings: PublicWebsiteSettings, template?: PhotoCardTemplate) {
  if (news.status !== "PUBLISHED" || !news.published_at) throw new Error("শুধু প্রকাশিত সংবাদের ফটোকার্ড তৈরি করা যাবে।");
  if (!news.featured_image) throw new Error("এই সংবাদে প্রধান ছবি নেই। আগে সংবাদে ছবি যুক্ত করুন।");
  const tpl = template ?? (await fetchActiveTemplate());
  const els = Array.isArray(tpl.elements) ? tpl.elements : [];
  const uses = (f: string) => els.some((e) => e.field === f || e.text?.includes(`{{${f}}}`));

  let website = settings.website_url;
  try { const u = new URL(website); website = u.host + (u.pathname === "/" ? "" : u.pathname); } catch { /* keep */ }
  const social = [settings.facebook_url, settings.youtube_url, settings.twitter_url, settings.instagram_url]
    .filter(Boolean).map((u) => { try { const p = new URL(u!); return p.host.replace(/^www\./, "") + p.pathname.replace(/\/$/, ""); } catch { return u!; } }).join("  |  ");
  const values: Record<string, string> = {
    headline: news.title,
    date: new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric" }).format(new Date(news.published_at)),
    reporter_name: news.reporter_name ?? "",
    reporter_designation: news.reporter_designation ?? "",
    reporter_line: [news.reporter_name, news.reporter_designation].filter(Boolean).join(" • "),
    news_content: uses("news_content") ? await newsExcerpt(news) : "",
    website,
    social_media: social,
    advertisement: tpl.ad_text ?? "",
    logo: "", news_image: "",
  };

  const imgSrc: Record<string, string | null> = {
    logo: settings.logo_url, news_image: news.featured_image, advertisement: tpl.ad_image_url,
  };
  const [, bg, ...imgs] = await Promise.all([
    loadFont(),
    tpl.background_url ? loadImage(tpl.background_url) : Promise.resolve(null),
    ...(["logo", "news_image", "advertisement"] as const).map((k) => uses(k) && imgSrc[k] ? loadImage(imgSrc[k]!) : Promise.resolve(null)),
  ]);
  const images: Record<string, HTMLImageElement | null> = { logo: imgs[0] ?? null, news_image: imgs[1] ?? null, advertisement: imgs[2] ?? null };

  const canvas = document.createElement("canvas");
  canvas.width = tpl.width || PHOTO_CARD_SIZE;
  canvas.height = tpl.height || PHOTO_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ফটোকার্ড তৈরি করা যাচ্ছে না।");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = tpl.background_color || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  for (const el of els) {
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    ctx.fillStyle = el.color || "#101010";
    if (el.type === "rect") ctx.fillRect(el.x, el.y, el.w, el.h);
    else if (el.type === "text") {
      drawText(ctx, el, (el.text ?? "").replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? ""), false);
    } else if (el.field) {
      const img = images[el.field];
      if (img) drawImage(ctx, img, el);
      else if (el.field === "logo") {
        // Existing MTV header mark when no logo is uploaded in settings.
        ctx.fillStyle = "#d71920"; ctx.fillRect(el.x, el.y + 4, el.w * 0.94, el.h * 0.84);
        ctx.fillStyle = "#ffffff"; ctx.font = `bold ${Math.round(el.h * 0.32)}px sans-serif`; ctx.textBaseline = "middle";
        ctx.fillText("MTV", el.x + el.w * 0.11, el.y + el.h * 0.46);
      } else if (el.field !== "news_image") {
        drawText(ctx, { ...el, y: el.field === "advertisement" ? el.y + Math.max(0, (el.h - (el.size ?? 26) * 1.32) / 2) : el.y, x: el.field === "advertisement" ? el.x + 16 : el.x, w: el.field === "advertisement" ? el.w - 32 : el.w },
          values[el.field] ?? "", el.field === "news_content" || el.field === "social_media" || el.field === "advertisement");
      }
      if (el.border) { ctx.globalAlpha = 1; ctx.strokeStyle = el.border; ctx.lineWidth = 2; ctx.strokeRect(el.x, el.y, el.w, el.h); }
    }
    ctx.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    try { canvas.toBlob((r) => r ? resolve(r) : reject(new Error("PNG তৈরি করা যায়নি।")), "image/png"); }
    catch { reject(new Error("ছবিটি নিরাপদভাবে ডাউনলোড করা যাচ্ছে না। ছবির উৎস পরীক্ষা করুন।")); }
  });
}

export function photoCardFile(news: PhotoCardNews, blob: Blob) {
  return new File([blob], `mohakal-photocard-${news.id}.png`, { type: "image/png" });
}

export function downloadPhotoCard(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = file.name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
