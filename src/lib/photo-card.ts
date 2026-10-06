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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ছবি লোড করা যায়নি। আবার চেষ্টা করুন।"));
    image.src = src;
  });
}

/** Fit every word, including unusually long Bengali words, without truncation. */
function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if (ctx.measureText(word).width > width) return null;
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, maximum: number, bold = false) {
  for (let size = maximum; size >= 16; size -= 2) {
    ctx.font = `${bold ? "bold " : ""}${size}px "SolaimanLipi", sans-serif`;
    const lines = linesFor(ctx, text, width);
    const lineHeight = size * 1.32;
    if (!lines || lines.length * lineHeight > height) continue;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
    return;
  }
  throw new Error("লেখাটি ফটোকার্ডে সম্পূর্ণ বসানো যায়নি।");
}

export async function renderPhotoCard(news: PhotoCardNews, settings: PublicWebsiteSettings) {
  if (news.status !== "PUBLISHED" || !news.published_at) throw new Error("শুধু প্রকাশিত সংবাদের ফটোকার্ড তৈরি করা যাবে।");
  if (!news.featured_image) throw new Error("এই সংবাদে প্রধান ছবি নেই। আগে সংবাদে ছবি যুক্ত করুন।");
  const [, image, logo] = await Promise.all([
    loadFont(), loadImage(news.featured_image), settings.logo_url ? loadImage(settings.logo_url) : Promise.resolve(null),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_CARD_SIZE;
  canvas.height = PHOTO_CARD_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ফটোকার্ড তৈরি করা যাচ্ছে না।");
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const red = token("--photocard-red"), black = token("--photocard-black"), white = token("--photocard-white");
  const rect = (color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  rect(white, 0, 0, 1200, 1200);
  rect(red, 0, 0, 1200, 8);
  if (logo) {
    const scale = Math.min(100 / logo.width, 100 / logo.height);
    ctx.drawImage(logo, 36 + (100 - logo.width * scale) / 2, 22 + (100 - logo.height * scale) / 2, logo.width * scale, logo.height * scale);
  } else {
    // Same MTV identity already used by the existing site header, not a replacement logo.
    rect(red, 36, 26, 94, 84);
    ctx.fillStyle = white; ctx.font = 'bold 32px sans-serif'; ctx.textBaseline = "middle"; ctx.fillText("MTV", 47, 68);
  }
  ctx.fillStyle = black;
  drawText(ctx, "মহাকাল টেলিভিশন", 154, 24, 790, 68, 58, true);
  ctx.fillStyle = red;
  drawText(ctx, "MOHAKAL TELEVISION", 156, 88, 590, 32, 24, true);
  const date = new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric" }).format(new Date(news.published_at));
  ctx.fillStyle = black;
  drawText(ctx, date, 790, 92, 374, 34, 26);
  rect(black, 0, 140, 1200, 530);
  // Contain preserves faces, captions and graphics in the article's actual photo.
  const scale = Math.min(1200 / image.width, 530 / image.height);
  ctx.drawImage(image, (1200 - image.width * scale) / 2, 140 + (530 - image.height * scale) / 2, image.width * scale, image.height * scale);
  ctx.save();
  ctx.globalAlpha = 0.82;
  rect(black, 752, 620, 448, 50);
  ctx.fillStyle = white;
  drawText(ctx, "MOHAKAL TELEVISION", 774, 633, 400, 32, 26, true);
  ctx.restore();
  rect(red, 0, 670, 1200, 8);
  rect(black, 0, 678, 1200, 270);
  ctx.fillStyle = white;
  drawText(ctx, news.title, 40, 708, 1120, 215, 62, true);
  ctx.fillStyle = black;
  drawText(ctx, [news.reporter_name, news.reporter_designation].filter(Boolean).join(" • "), 40, 966, 1120, 62, 34);
  rect(red, 0, 1044, 1200, 4);
  ctx.fillStyle = black;
  drawText(ctx, "বিজ্ঞাপন", 40, 1065, 150, 36, 26);
  ctx.strokeStyle = token("--photocard-border");
  ctx.lineWidth = 2;
  ctx.strokeRect(210, 1065, 950, 68);
  let website = settings.website_url;
  try { const url = new URL(website); website = url.host + (url.pathname === "/" ? "" : url.pathname); } catch { /* keep the stored value */ }
  ctx.fillStyle = black;
  drawText(ctx, website, 40, 1150, 1120, 34, 25);
  const blob = await new Promise<Blob>((resolve, reject) => {
    try { canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG তৈরি করা যায়নি।")), "image/png"); }
    catch { reject(new Error("ছবিটি নিরাপদভাবে ডাউনলোড করা যাচ্ছে না। ছবির উৎস পরীক্ষা করুন।")); }
  });
  return blob;
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