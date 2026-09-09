import { supabase } from "@/integrations/supabase/client";

export type WatermarkConfig = {
  enabled: boolean;
  position: string;
  opacity: number;
  text: string;
  websiteUrl: string;
  logoUrl: string | null;
};

export const WATERMARK_POSITIONS = [
  { value: "bottom-right", label: "নিচে ডানে" },
  { value: "bottom-left", label: "নিচে বামে" },
  { value: "bottom-center", label: "নিচে মাঝখানে" },
  { value: "top-right", label: "উপরে ডানে" },
  { value: "top-left", label: "উপরে বামে" },
  { value: "center", label: "মাঝখানে" },
];

let cache: { at: number; config: WatermarkConfig } | null = null;

export async function getWatermarkConfig(): Promise<WatermarkConfig> {
  if (cache && Date.now() - cache.at < 60_000) return cache.config;
  const { data } = await supabase
    .from("website_settings")
    .select("site_name, website_url, logo_url, watermark_enabled, watermark_position, watermark_opacity")
    .eq("id", 1)
    .maybeSingle();
  const config: WatermarkConfig = {
    enabled: data?.watermark_enabled ?? true,
    position: data?.watermark_position ?? "bottom-right",
    opacity: Number(data?.watermark_opacity ?? 0.6),
    text: data?.site_name || "MOHAKAL TELEVISION",
    websiteUrl: (data?.website_url || "").replace(/^https?:\/\//, ""),
    logoUrl: data?.logo_url ?? null,
  };
  cache = { at: Date.now(), config };
  return config;
}

export function clearWatermarkCache() {
  cache = null;
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function place(position: string, w: number, h: number, bw: number, bh: number, pad: number) {
  const x =
    position.endsWith("left") ? pad : position.endsWith("right") ? w - bw - pad : (w - bw) / 2;
  const y = position.startsWith("top") ? pad : position === "center" ? (h - bh) / 2 : h - bh - pad;
  return { x, y };
}

/** Burns the site watermark (logo + name + url) into an image file. */
export async function applyWatermark(file: File, config: WatermarkConfig): Promise<File> {
  if (typeof window === "undefined" || !config.enabled) return file;
  if (file.type === "image/gif") return file;

  const source = await loadImage(URL.createObjectURL(file));
  if (!source) return file;

  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(source, 0, 0);

  const W = canvas.width;
  const H = canvas.height;
  const pad = Math.round(Math.min(W, H) * 0.025);
  const fontSize = Math.max(14, Math.round(W * 0.028));
  const subSize = Math.max(11, Math.round(fontSize * 0.62));
  const logo = config.logoUrl ? await loadImage(config.logoUrl, true) : null;
  const logoSize = logo ? Math.round(fontSize * 1.9) : 0;

  ctx.font = `bold ${fontSize}px sans-serif`;
  const textW = ctx.measureText(config.text).width;
  ctx.font = `${subSize}px sans-serif`;
  const subW = config.websiteUrl ? ctx.measureText(config.websiteUrl).width : 0;

  const gap = Math.round(fontSize * 0.4);
  const contentW = Math.max(textW, subW) + (logo ? logoSize + gap : 0);
  const contentH = Math.max(logoSize, fontSize + (config.websiteUrl ? subSize + 4 : 0));
  const boxW = contentW + gap * 2;
  const boxH = contentH + gap * 1.2;
  const { x, y } = place(config.position, W, H, boxW, boxH, pad);

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0.05, config.opacity));
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, boxW, boxH);

  let tx = x + gap;
  if (logo) {
    ctx.drawImage(logo, tx, y + (boxH - logoSize) / 2, logoSize, logoSize);
    tx += logoSize + gap;
  }
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  const ty = y + (boxH - contentH) / 2;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(config.text, tx, ty);
  if (config.websiteUrl) {
    ctx.font = `${subSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(config.websiteUrl, tx, ty + fontSize + 4);
  }
  ctx.restore();

  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), type, 0.92),
  );
  if (!blob) return file;
  const name = file.name.replace(/\.(jpe?g|png|webp)$/i, "") + (type === "image/png" ? ".png" : ".jpg");
  return new File([blob], name, { type });
}
