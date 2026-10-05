import { useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBnDate } from "@/lib/mtv";

export type PhotoCardNews = {
  title: string;
  featured_image: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  published_at: string | null;
  district?: { name: string } | null;
  slug: string;
};

const SIZE = 1080;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1]}…`;
    return cut;
  }
  return lines;
}

async function drawCard(canvas: HTMLCanvasElement, news: PhotoCardNews) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const css = getComputedStyle(document.documentElement);
  const color = (v: string, f: string) => (css.getPropertyValue(v).trim() ? `hsl(${css.getPropertyValue(v).trim()})` : f);
  const red = "#d71920";
  void color;
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const imgH = 600;
  if (news.featured_image) {
    try {
      const img = await loadImage(news.featured_image);
      const scale = Math.max(SIZE / img.width, imgH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SIZE, imgH);
      ctx.clip();
      ctx.drawImage(img, (SIZE - w) / 2, (imgH - h) / 2, w, h);
      ctx.restore();
    } catch {
      /* draw without image */
    }
  }
  // brand strip
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, 420, 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Noto Sans Bengali', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("MOHAKAL TELEVISION", 24, 36);

  ctx.fillStyle = red;
  ctx.fillRect(0, imgH, SIZE, 10);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px 'Noto Sans Bengali', sans-serif";
  ctx.textBaseline = "top";
  const lines = wrap(ctx, news.title, SIZE - 100, 4);
  lines.forEach((l, i) => ctx.fillText(l, 50, imgH + 40 + i * 72));

  const byline = [news.reporter_name, news.reporter_designation, news.district?.name].filter(Boolean).join(" · ");
  ctx.fillStyle = "#e5e5e5";
  ctx.font = "30px 'Noto Sans Bengali', sans-serif";
  if (byline) ctx.fillText(byline, 50, SIZE - 120);

  ctx.fillStyle = red;
  ctx.fillRect(0, SIZE - 64, SIZE, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = "26px 'Noto Sans Bengali', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(formatBnDate(news.published_at), 50, SIZE - 32);
  const site = "mohakaltelevision.lovable.app";
  ctx.fillText(site, SIZE - 50 - ctx.measureText(site).width, SIZE - 32);
}

export function PhotoCardButton({ news, size = "sm" }: { news: PhotoCardNews; size?: "sm" | "default" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        <ImageIcon /> ফটোকার্ড তৈরি
      </Button>
      {open ? <PhotoCardDialog news={news} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PhotoCardDialog({ news, onClose }: { news: PhotoCardNews; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    void drawCard(ref.current, news).then(() => setReady(true));
  }, [news]);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      try {
        ref.current?.toBlob((b) => resolve(b), "image/png");
      } catch {
        resolve(null);
      }
    });

  const download = async () => {
    const blob = await toBlob();
    if (!blob) { toast.error("ফটোকার্ড তৈরি করা যায়নি"); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `photocard-${news.slug}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const share = async () => {
    const blob = await toBlob();
    if (!blob) { toast.error("ফটোকার্ড তৈরি করা যায়নি"); return; }
    const file = new File([blob], `photocard-${news.slug}.png`, { type: "image/png" });
    const url = `${window.location.origin}/news/${news.slug}`;
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: news.title, text: `${news.title}\n${url}` }).catch(() => undefined);
    } else {
      await download();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ফটোকার্ড</DialogTitle>
        </DialogHeader>
        <canvas ref={ref} className="aspect-square w-full rounded-md border border-border" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void download()} disabled={!ready}>
            <Download /> ডাউনলোড
          </Button>
          <Button variant="outline" onClick={() => void share()} disabled={!ready}>
            <Share2 /> শেয়ার
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
