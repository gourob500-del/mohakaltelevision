import { useEffect, useRef, useState } from "react";
import { Download, ImageIcon, LoaderCircle, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchSettings } from "@/lib/queries";
import { downloadPhotoCard, photoCardFile, renderPhotoCard, type PhotoCardNews } from "@/lib/photo-card";
export type { PhotoCardNews } from "@/lib/photo-card";

export function PhotoCardButton({ news, size = "sm" }: { news: PhotoCardNews; size?: "sm" | "default" }) {
  const [open, setOpen] = useState(false);
  if (news.status !== "PUBLISHED") return null;
  return <>
    <Button variant="outline" size={size} className="min-h-11" onClick={() => setOpen(true)} aria-label={`ফটোকার্ড: ${news.title}`}>
      <ImageIcon /> ফটোকার্ড
    </Button>
    {open ? <PhotoCardDialog news={news} onClose={() => setOpen(false)} /> : null}
  </>;
}

function PhotoCardDialog({ news, onClose }: { news: PhotoCardNews; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [generation, setGeneration] = useState(0);
  const [busy, setBusy] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    let url = "";
    setBusy(true); setError(""); setBlob(null); setPreview("");
    void (async () => {
      const settings = await fetchSettings();
      if (!settings) throw new Error("ওয়েবসাইটের লোগো ও তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।");
      const result = await renderPhotoCard(news, settings);
      if (!active) return;
      url = URL.createObjectURL(result);
      setBlob(result); setPreview(url);
    })().catch((e) => { if (active) setError(e instanceof Error ? e.message : "ফটোকার্ড তৈরি করা যায়নি।"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [news, generation]);

  const download = () => {
    if (blob) downloadPhotoCard(photoCardFile(news, blob));
  };
  const share = async () => {
    if (!blob) return;
    const file = photoCardFile(news, blob);
    const url = new URL(`/news/${encodeURIComponent(news.slug)}`, window.location.origin).href;
    setSharing(true);
    try {
      if (navigator.canShare?.({ files: [file] })) {
        // Invoke directly from the touch/click to preserve the browser's sharing permission.
        await navigator.share({ files: [file], title: news.title, text: `${news.title}\n${url}` });
      } else {
        downloadPhotoCard(file);
        if (navigator.share) await navigator.share({ title: news.title, text: news.title, url });
        else {
          try { await navigator.clipboard.writeText(url); toast.success("ফটোকার্ড ডাউনলোড হয়েছে, সংবাদ লিংক কপি হয়েছে।"); }
          catch { toast.success("ফটোকার্ড ডাউনলোড হয়েছে।"); }
        }
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) toast.error("শেয়ার করা যায়নি। PNG ডাউনলোড করে শেয়ার করুন।");
    } finally { if (mounted.current) setSharing(false); }
  };

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-3 overflow-y-auto p-3 sm:p-5">
      <DialogHeader className="shrink-0 pr-7 text-left">
        <DialogTitle>ফটোকার্ড</DialogTitle>
        <DialogDescription className="break-words">{news.title}</DialogDescription>
      </DialogHeader>
      <div className="relative mx-auto aspect-square w-full max-w-[min(100%,58dvh)] shrink-0 overflow-hidden border border-border bg-muted" aria-busy={busy}>
        {preview ? <img src={preview} alt={`ফটোকার্ড — ${news.title}`} className="h-full w-full object-contain" /> :
          <div role={error ? "alert" : "status"} className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-sm text-muted-foreground">
            {busy ? <LoaderCircle className="h-7 w-7 animate-spin motion-reduce:animate-none" /> : <ImageIcon className="h-7 w-7" />}
            <p>{error || "ফটোকার্ড তৈরি হচ্ছে…"}</p>
          </div>}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
        <Button className="min-h-11" onClick={download} disabled={!blob || busy}><Download /> PNG ডাউনলোড</Button>
        <Button className="min-h-11" variant="outline" onClick={() => void share()} disabled={!blob || busy || sharing}><Share2 /> শেয়ার</Button>
        <Button className="col-span-2 min-h-11 sm:col-span-1" variant="outline" onClick={() => setGeneration((n) => n + 1)} disabled={busy || sharing}><RefreshCw /> আবার তৈরি</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
