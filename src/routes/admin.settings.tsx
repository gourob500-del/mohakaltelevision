import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, useAdminReady } from "@/components/AdminShell";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAdminSettings, updateSettings } from "@/lib/admin";
import { clearWatermarkCache, WATERMARK_POSITIONS } from "@/lib/watermark";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "ওয়েবসাইট সেটিংস — MOHAKAL TELEVISION" },
      { name: "description", content: "সাইটের নাম, লোগো, যোগাযোগ ও সোশ্যাল লিংক হালনাগাদ করুন।" },
      { property: "og:title", content: "ওয়েবসাইট সেটিংস — MOHAKAL TELEVISION" },
      { property: "og:description", content: "সাইট সেটিংস হালনাগাদ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

const FIELDS: { key: string; label: string }[] = [
  { key: "site_name", label: "ওয়েবসাইটের নাম" },
  { key: "tagline", label: "ট্যাগলাইন" },
  { key: "editor_name", label: "সম্পাদক" },
  { key: "news_editor_name", label: "বার্তা সম্পাদক" },
  { key: "executive_editor_name", label: "নির্বাহী সম্পাদক" },
  { key: "publisher_name", label: "প্রকাশক" },
  { key: "office_address", label: "অফিসের ঠিকানা" },
  { key: "contact_number", label: "মোবাইল" },
  { key: "contact_email", label: "ই-মেইল" },
  { key: "facebook_url", label: "ফেসবুক লিংক" },
  { key: "youtube_url", label: "ইউটিউব লিংক" },
  { key: "twitter_url", label: "টুইটার (X) লিংক" },
  { key: "instagram_url", label: "ইনস্টাগ্রাম লিংক" },
  { key: "website_url", label: "ওয়েবসাইট ঠিকানা" },
];

function AdminSettings() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.6);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    enabled,
    queryFn: fetchAdminSettings,
  });

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = (settings as Record<string, unknown>)[f.key] as string ?? "";
    next['about_text'] = settings.about_text ?? "";
    next['logo_url'] = settings.logo_url ?? "";
    next['favicon_url'] = settings.favicon_url ?? "";
    setForm(next);
    setWatermarkEnabled(settings.watermark_enabled ?? true);
    setWatermarkPosition(settings.watermark_position ?? "bottom-right");
    setWatermarkOpacity(Number(settings.watermark_opacity ?? 0.6));
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const patch: Record<string, unknown> = {};
      for (const f of FIELDS) patch[f.key] = form[f.key] ?? "";
      patch['contact_email'] = form['contact_email'] || null;
      patch['facebook_url'] = form['facebook_url'] || null;
      patch['youtube_url'] = form['youtube_url'] || null;
      patch['twitter_url'] = form['twitter_url'] || null;
      patch['instagram_url'] = form['instagram_url'] || null;
      patch['about_text'] = form['about_text'] ?? "";
      patch['logo_url'] = form['logo_url'] || null;
      patch['favicon_url'] = form['favicon_url'] || null;
      patch['watermark_enabled'] = watermarkEnabled;
      patch['watermark_position'] = watermarkPosition;
      patch['watermark_opacity'] = watermarkOpacity;
      await updateSettings(patch);
    },
    onSuccess: () => {
      toast.success("সেটিংস সংরক্ষিত হয়েছে");
      clearWatermarkCache();
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ"),
  });

  return (
    <AdminShell title="ওয়েবসাইট সেটিংস">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      ) : (
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label htmlFor="about">আমাদের সম্পর্কে</Label>
            <Textarea
              id="about"
              rows={6}
              value={form['about_text'] ?? ""}
              onChange={(e) => setForm({ ...form, about_text: e.target.value })}
            />
          </div>
          <div>
            <Label>লোগো</Label>
            <ImageUpload
              value={form['logo_url'] || null}
              folder="branding"
              onChange={(url) => setForm({ ...form, logo_url: url ?? "" })}
            />
          </div>
          <div>
            <Label>ফেভিকন</Label>
            <ImageUpload
              value={form['favicon_url'] || null}
              folder="branding"
              onChange={(url) => setForm({ ...form, favicon_url: url ?? "" })}
            />
          </div>
          <div className="sm:col-span-2 rounded border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-bold">নিউজ ছবিতে ওয়াটারমার্ক</p><p className="text-xs text-muted-foreground">আপলোডের সময় ছবি ও গ্যালারিতে স্থায়ীভাবে যুক্ত হবে</p></div>
              <Button type="button" variant={watermarkEnabled ? "default" : "outline"} size="sm" onClick={() => setWatermarkEnabled((value) => !value)}>{watermarkEnabled ? "চালু" : "বন্ধ"}</Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="watermark-position">অবস্থান</Label><select id="watermark-position" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={watermarkPosition} onChange={(e) => setWatermarkPosition(e.target.value)}>{WATERMARK_POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}</select></div>
              <div><Label htmlFor="watermark-opacity">স্বচ্ছতা: {Math.round(watermarkOpacity * 100)}%</Label><input id="watermark-opacity" type="range" min="0.1" max="1" step="0.05" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="mt-3 w-full accent-primary" /></div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
