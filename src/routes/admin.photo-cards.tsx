import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings } from "@/lib/queries";
import { PHOTO_CARD_FIELDS, renderPhotoCard, type PhotoCardNews, type PhotoCardTemplate, type TemplateElement } from "@/lib/photo-card";

export const Route = createFileRoute("/admin/photo-cards")({
  head: () => ({
    meta: [
      { title: "ফটোকার্ড টেমপ্লেট — MOHAKAL TELEVISION" },
      { name: "description", content: "ফটোকার্ড টেমপ্লেট যোগ, সম্পাদনা ও সক্রিয় করুন।" },
      { property: "og:title", content: "ফটোকার্ড টেমপ্লেট — MOHAKAL TELEVISION" },
      { property: "og:description", content: "ফটোকার্ড টেমপ্লেট লাইব্রেরি।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TemplatesPage,
});

const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a: object) => any };

async function fetchTemplates() {
  const { data, error } = await db.from("photo_card_templates").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data as PhotoCardTemplate[];
}

async function fetchSampleNews(): Promise<PhotoCardNews | null> {
  const { data } = await supabase.from("news")
    .select("id, slug, title, status, featured_image, reporter_name, reporter_designation, published_at, summary, content")
    .eq("status", "PUBLISHED").not("featured_image", "is", null).order("published_at", { ascending: false }).limit(1).maybeSingle();
  return (data as PhotoCardNews | null) ?? null;
}

function usePreview(tpl: PhotoCardTemplate | null, news: PhotoCardNews | null | undefined) {
  const [url, setUrl] = useState(""); const [err, setErr] = useState("");
  const key = tpl ? JSON.stringify(tpl) : "";
  useEffect(() => {
    if (!tpl || !news) return;
    let active = true, made = "";
    const t = window.setTimeout(() => {
      void (async () => {
        const s = await fetchSettings();
        if (!s) throw new Error("সেটিংস পাওয়া যায়নি");
        const b = await renderPhotoCard(news, s, tpl);
        if (!active) return;
        made = URL.createObjectURL(b); setUrl(made); setErr("");
      })().catch((e) => active && setErr(e instanceof Error ? e.message : "প্রিভিউ তৈরি হয়নি"));
    }, 400);
    return () => { active = false; window.clearTimeout(t); if (made) URL.revokeObjectURL(made); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, news]);
  return { url, err };
}

function Preview({ tpl, news }: { tpl: PhotoCardTemplate | null; news: PhotoCardNews | null | undefined }) {
  const { url, err } = usePreview(tpl, news);
  return <div className="aspect-square w-full overflow-hidden border border-border bg-muted">
    {news === null ? <p className="p-4 text-xs text-muted-foreground">প্রিভিউর জন্য ছবিসহ একটি প্রকাশিত সংবাদ দরকার।</p>
      : err ? <p className="p-4 text-xs text-destructive">{err}</p>
      : url ? <img src={url} alt={`${tpl?.name} প্রিভিউ`} className="h-full w-full object-contain" />
      : <p className="p-4 text-xs text-muted-foreground">প্রিভিউ তৈরি হচ্ছে…</p>}
  </div>;
}

function TemplatesPage() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["photo-templates"], enabled, queryFn: fetchTemplates });
  const { data: sample } = useQuery({ queryKey: ["photo-sample"], enabled, queryFn: fetchSampleNews });
  const [editing, setEditing] = useState<PhotoCardTemplate | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["photo-templates"] });
  const onErr = (e: unknown) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে");

  const activate = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.rpc("activate_photo_card_template", { _id: id }); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success("টেমপ্লেট সক্রিয় হয়েছে"); refresh(); }, onError: onErr,
  });
  const deactivate = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("photo_card_templates").update({ is_active: false }).eq("id", id); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success("টেমপ্লেট নিষ্ক্রিয় হয়েছে"); refresh(); }, onError: onErr,
  });
  const duplicate = useMutation({
    mutationFn: async (t: PhotoCardTemplate) => {
      const { id: _i, created_at: _c, is_active: _a, is_builtin: _b, ...rest } = t as PhotoCardTemplate & { updated_at?: string; created_by?: string };
      const { updated_at: _u, created_by: _cb, ...clean } = rest as typeof rest & { updated_at?: string; created_by?: string };
      const { error } = await db.from("photo_card_templates").insert({ ...clean, name: `${t.name} (কপি)` });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("কপি তৈরি হয়েছে"); refresh(); }, onError: onErr,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("photo_card_templates").delete().eq("id", id); if (error) throw new Error(error.message); },
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); refresh(); }, onError: onErr,
  });

  const blank: PhotoCardTemplate = {
    id: "", name: "নতুন টেমপ্লেট", width: 1200, height: 1200, background_color: "#ffffff", background_url: null,
    elements: [
      { type: "field", field: "news_image", x: 0, y: 0, w: 1200, h: 700, fit: "cover" },
      { type: "field", field: "headline", x: 40, y: 740, w: 1120, h: 240, size: 60, bold: true, color: "#101010" },
      { type: "field", field: "date", x: 40, y: 1120, w: 600, h: 40, size: 28, color: "#d71920" },
    ],
    ad_image_url: null, ad_text: null, is_active: false, is_builtin: false,
  };

  return <AdminShell title="ফটোকার্ড টেমপ্লেট">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">একসাথে একটি টেমপ্লেট সক্রিয় থাকে; নতুন তৈরি সব ফটোকার্ডে সেটি ব্যবহার হয়।</p>
      <Button className="min-h-11" onClick={() => setEditing(blank)}><Plus /> নতুন টেমপ্লেট</Button>
    </div>
    {isLoading ? <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p> : rows.length === 0 ? <EmptyState text="কোনো টেমপ্লেট নেই" /> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => <div key={t.id} className="rounded-lg border border-border bg-card p-3 shadow-card">
          <Preview tpl={t} news={sample} />
          <div className="mt-2 flex items-start justify-between gap-2">
            <p className="font-bold break-words">{t.name}</p>
            <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${t.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {t.is_active
              ? <Button variant="outline" className="min-h-11" onClick={() => deactivate.mutate(t.id)}><Power /> নিষ্ক্রিয়</Button>
              : <Button className="min-h-11" onClick={() => activate.mutate(t.id)}><Power /> সক্রিয় করুন</Button>}
            <Button variant="outline" className="min-h-11" onClick={() => setEditing(t)}><Pencil /> সম্পাদনা</Button>
            <Button variant="outline" className="min-h-11" onClick={() => duplicate.mutate(t)}><Copy /> কপি</Button>
            <Button variant="destructive" className="min-h-11" disabled={t.is_active}
              onClick={() => { if (confirm("টেমপ্লেটটি মুছে ফেলবেন?")) remove.mutate(t.id); }}><Trash2 /> মুছুন</Button>
          </div>
        </div>)}
      </div>}
    {editing ? <Editor initial={editing} sample={sample} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} /> : null}
  </AdminShell>;
}

const num = (v: string) => (v === "" ? 0 : Number(v));

function Editor({ initial, sample, onClose, onSaved }: { initial: PhotoCardTemplate; sample: PhotoCardNews | null | undefined; onClose: () => void; onSaved: () => void }) {
  const [t, setT] = useState<PhotoCardTemplate>(() => structuredClone(initial));
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PhotoCardTemplate>(k: K, v: PhotoCardTemplate[K]) => setT((p) => ({ ...p, [k]: v }));
  const setEl = (i: number, patch: Partial<TemplateElement>) => setT((p) => ({ ...p, elements: p.elements.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  const move = (i: number, d: number) => setT((p) => { const a = [...p.elements]; const j = i + d; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j]!, a[i]!]; return { ...p, elements: a }; });
  const add = (el: TemplateElement) => setT((p) => ({ ...p, elements: [...p.elements, el] }));

  const save = async () => {
    if (!t.name.trim()) { toast.error("টেমপ্লেটের নাম দিন"); return; }
    setBusy(true);
    const payload = { name: t.name.trim(), width: t.width, height: t.height, background_color: t.background_color, background_url: t.background_url, elements: t.elements, ad_image_url: t.ad_image_url, ad_text: t.ad_text };
    const { error } = t.id ? await db.from("photo_card_templates").update(payload).eq("id", t.id) : await db.from("photo_card_templates").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("টেমপ্লেট সংরক্ষিত হয়েছে"); onSaved();
  };

  return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto p-3 sm:p-5">
      <DialogHeader className="pr-7 text-left">
        <DialogTitle>{t.id ? "টেমপ্লেট সম্পাদনা" : "নতুন টেমপ্লেট"}</DialogTitle>
        <DialogDescription>ডিজাইন ছবি আপলোড করুন, তারপর ঘরগুলোর অবস্থান (১২০০×১২০০ পিক্সেলে) ঠিক করুন।</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-3 md:sticky md:top-0 md:self-start">
          <Preview tpl={t} news={sample} />
          <Button className="min-h-11 w-full" onClick={() => void save()} disabled={busy}>{busy ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}</Button>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-bold">টেমপ্লেটের নাম<Input className="mt-1" value={t.name} onChange={(e) => set("name", e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-bold">পটভূমির রং<Input type="color" className="mt-1 h-11" value={t.background_color} onChange={(e) => set("background_color", e.target.value)} /></label>
            <label className="text-sm font-bold">বিজ্ঞাপনের লেখা<Input className="mt-1" value={t.ad_text ?? ""} onChange={(e) => set("ad_text", e.target.value || null)} /></label>
          </div>
          <div><p className="mb-1 text-sm font-bold">টেমপ্লেট ডিজাইন ছবি (পটভূমি, ঐচ্ছিক)</p>
            <ImageUpload value={t.background_url} onChange={(u) => set("background_url", u)} folder="photo-templates" /></div>
          <div><p className="mb-1 text-sm font-bold">বিজ্ঞাপনের ছবি (ঐচ্ছিক)</p>
            <ImageUpload value={t.ad_image_url} onChange={(u) => set("ad_image_url", u)} folder="photo-templates" /></div>

          <div>
            <p className="text-sm font-bold">ঘর ও ডায়নামিক তথ্য</p>
            <p className="mb-2 text-xs text-muted-foreground">লেখার ঘরে {"{{headline}}"}, {"{{date}}"} ইত্যাদি লিখেও তথ্য বসাতে পারেন।</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => add({ type: "field", field: "headline", x: 40, y: 40, w: 600, h: 120, size: 40, color: "#101010" })}><Plus /> তথ্য</Button>
              <Button size="sm" variant="outline" onClick={() => add({ type: "text", text: "লেখা", x: 40, y: 40, w: 400, h: 60, size: 32, color: "#101010" })}><Plus /> লেখা</Button>
              <Button size="sm" variant="outline" onClick={() => add({ type: "rect", x: 0, y: 0, w: 1200, h: 10, color: "#d71920" })}><Plus /> রঙিন বক্স</Button>
            </div>
            <div className="space-y-2">
              {t.elements.map((el, i) => <div key={i} className="rounded border border-border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold">{i + 1}. {el.type === "rect" ? "রঙিন বক্স" : el.type === "text" ? "লেখা" : "তথ্য"}</span>
                  {el.type === "field" ? <select className="h-9 rounded border border-input bg-background px-2 text-sm" value={el.field} onChange={(e) => setEl(i, { field: e.target.value as TemplateElement["field"] })}>
                    {PHOTO_CARD_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label} — {`{{${f.key}}}`}</option>)}
                  </select> : null}
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)} aria-label="উপরে">↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)} aria-label="নিচে">↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => setT((p) => ({ ...p, elements: p.elements.filter((_, j) => j !== i) }))} aria-label="মুছুন"><Trash2 /></Button>
                  </div>
                </div>
                {el.type === "text" ? <Input className="mt-2" value={el.text ?? ""} onChange={(e) => setEl(i, { text: e.target.value })} /> : null}
                <div className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-8">
                  {(["x", "y", "w", "h"] as const).map((k) => <label key={k} className="text-[11px]">{k.toUpperCase()}<Input type="number" className="h-9 px-1" value={el[k]} onChange={(e) => setEl(i, { [k]: num(e.target.value) })} /></label>)}
                  {el.type !== "rect" ? <label className="text-[11px]">ফন্ট<Input type="number" className="h-9 px-1" value={el.size ?? 32} onChange={(e) => setEl(i, { size: num(e.target.value) })} /></label> : null}
                  <label className="text-[11px]">রং<Input type="color" className="h-9 px-1" value={el.color ?? "#101010"} onChange={(e) => setEl(i, { color: e.target.value })} /></label>
                  <label className="text-[11px]">স্বচ্ছতা<Input type="number" step="0.1" min="0" max="1" className="h-9 px-1" value={el.opacity ?? 1} onChange={(e) => setEl(i, { opacity: Number(e.target.value) })} /></label>
                  {el.type !== "rect" ? <label className="flex items-end gap-1 text-[11px]"><input type="checkbox" className="h-5 w-5" checked={!!el.bold} onChange={(e) => setEl(i, { bold: e.target.checked })} />বোল্ড</label> : null}
                </div>
                {el.type !== "rect" ? <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <select className="h-9 rounded border border-input bg-background px-2" value={el.align ?? "left"} onChange={(e) => setEl(i, { align: e.target.value as TemplateElement["align"] })}>
                    <option value="left">বামে</option><option value="center">মাঝে</option><option value="right">ডানে</option></select>
                  <select className="h-9 rounded border border-input bg-background px-2" value={el.fit ?? "contain"} onChange={(e) => setEl(i, { fit: e.target.value as TemplateElement["fit"] })}>
                    <option value="contain">ছবি পুরোটা</option><option value="cover">ছবি ভরাট</option></select>
                  <label className="flex items-center gap-1"><input type="checkbox" className="h-5 w-5" checked={!!el.border} onChange={(e) => setEl(i, { border: e.target.checked ? "#d8d8d8" : undefined })} />বর্ডার</label>
                </div> : null}
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
