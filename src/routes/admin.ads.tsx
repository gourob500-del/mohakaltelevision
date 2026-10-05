import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, useAdminReady } from "@/components/AdminShell";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AD_PLACEMENTS, deleteAd, fetchAllAds, saveAd, type Ad } from "@/lib/ads";

export const Route = createFileRoute("/admin/ads")({
  head: () => ({
    meta: [
      { title: "বিজ্ঞাপন ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { name: "description", content: "ওয়েবসাইটের বিজ্ঞাপন তৈরি ও পরিচালনা।" },
      { property: "og:title", content: "বিজ্ঞাপন ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "ওয়েবসাইটের বিজ্ঞাপন তৈরি ও পরিচালনা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdsPage,
});

type Form = Partial<Ad>;
const EMPTY: Form = { title: "", image_url: "", link_url: "", placement: "sidebar", is_active: true, starts_at: null, ends_at: null, sort_order: 0 };

function AdsPage() {
  const ready = useAdminReady();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const { data: ads = [], isLoading } = useQuery({ queryKey: ["admin-ads"], enabled: ready, queryFn: fetchAllAds });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-ads"] });
    void qc.invalidateQueries({ queryKey: ["ads"] });
  };
  const save = useMutation({
    mutationFn: () => {
      if (!form.title?.trim() || !form.image_url) throw new Error("শিরোনাম ও ছবি দিন");
      return saveAd({ ...form, title: form.title.trim(), image_url: form.image_url, link_url: form.link_url || null });
    },
    onSuccess: () => { toast.success("বিজ্ঞাপন সংরক্ষিত হয়েছে"); setForm(EMPTY); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ"),
  });
  const remove = useMutation({
    mutationFn: deleteAd,
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "মুছা যায়নি"),
  });
  const dt = (v: string | null | undefined) => (v ? v.slice(0, 16) : "");

  return (
    <AdminShell title="বিজ্ঞাপন">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-bold">{form.id ? "বিজ্ঞাপন সম্পাদনা" : "নতুন বিজ্ঞাপন"}</h2>
          <Input placeholder="শিরোনাম" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <ImageUpload value={form.image_url || null} onChange={(u) => setForm({ ...form, image_url: u ?? "" })} folder="ads" label="বিজ্ঞাপনের ছবি" />
          <Input placeholder="লিংক (https://...)" value={form.link_url ?? ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            {AD_PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <label className="block text-xs text-muted-foreground">শুরু
            <Input type="datetime-local" value={dt(form.starts_at)} onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </label>
          <label className="block text-xs text-muted-foreground">শেষ
            <Input type="datetime-local" value={dt(form.ends_at)} onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> সক্রিয়
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}</Button>
            {form.id ? <Button variant="outline" onClick={() => setForm(EMPTY)}>বাতিল</Button> : null}
          </div>
        </div>
        <div className="min-w-0">
          {isLoading ? <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p> : ads.length === 0 ? (
            <p className="text-sm text-muted-foreground">এখনো কোনো বিজ্ঞাপন নেই।</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {ads.map((ad) => (
                <li key={ad.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
                  <img src={ad.image_url} alt={ad.title} className="h-28 w-full rounded object-cover" />
                  <p className="mt-2 truncate font-semibold">{ad.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {AD_PLACEMENTS.find((p) => p.key === ad.placement)?.label ?? ad.placement} · {ad.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setForm(ad)}>সম্পাদনা</Button>
                    <Button size="sm" variant="destructive" onClick={() => confirm("মুছে ফেলবেন?") && remove.mutate(ad.id)}>মুছুন</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
