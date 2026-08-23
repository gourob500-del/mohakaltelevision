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
import { updateSettings } from "@/lib/admin";
import { fetchSettings } from "@/lib/queries";

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
  { key: "contact_number", label: "যোগাযোগ নম্বর" },
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    enabled,
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = (settings as Record<string, unknown>)[f.key] as string ?? "";
    next['about_text'] = settings.about_text ?? "";
    next['logo_url'] = settings.logo_url ?? "";
    next['favicon_url'] = settings.favicon_url ?? "";
    setForm(next);
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
      await updateSettings(patch);
    },
    onSuccess: () => {
      toast.success("সেটিংস সংরক্ষিত হয়েছে");
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
