import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, useAdminReady } from "@/components/AdminShell";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteNews, fetchNewsById, setNewsStatus, updateNews } from "@/lib/admin";
import { fetchCategories, fetchDistricts, fetchDivisions, fetchUpazilas } from "@/lib/queries";
import { STATUS_BN, STATUS_CLASS, formatBnDate, toBn, type NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/admin/news/$id")({
  head: () => ({
    meta: [
      { title: "সংবাদ পর্যালোচনা — MOHAKAL TELEVISION" },
      { name: "description", content: "প্রতিনিধির পাঠানো সংবাদ পর্যালোচনা, সম্পাদনা ও প্রকাশ করুন।" },
      { property: "og:title", content: "সংবাদ পর্যালোচনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "সংবাদ পর্যালোচনা, সম্পাদনা ও প্রকাশ।" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNewsReview,
});

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function AdminNewsReview() {
  const { id } = Route.useParams();
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ is_top: false, is_breaking: false });

  const { data: news, isLoading } = useQuery({
    queryKey: ["admin-news-item", id],
    enabled,
    queryFn: () => fetchNewsById(id),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all-admin"],
    queryFn: () => fetchCategories(false),
  });
  const { data: divisions = [] } = useQuery({ queryKey: ["divisions"], queryFn: fetchDivisions });
  const { data: districts = [] } = useQuery({
    queryKey: ["districts", form['division_id']],
    queryFn: () => fetchDistricts(form['division_id'] || null),
  });
  const { data: upazilas = [] } = useQuery({
    queryKey: ["upazilas", form['district_id']],
    queryFn: () => fetchUpazilas(form['district_id'] || null),
    enabled: !!form['district_id'],
  });

  useEffect(() => {
    if (!news) return;
    setForm({
      title: news.title,
      summary: news.summary ?? "",
      content: news.content ?? "",
      featured_image: news.featured_image ?? "",
      caption: news.caption ?? "",
      video_url: news.video_url ?? "",
      source: news.source ?? "",
      reporter_name: news.reporter_name ?? "",
      location: news.location ?? "",
      category_id: news.category_id ?? "",
      division_id: news.division_id ?? "",
      district_id: news.district_id ?? "",
      upazila_id: news.upazila_id ?? "",
    });
    setFlags({ is_top: news.is_top, is_breaking: news.is_breaking });
    setNote(news.review_note ?? "");
  }, [news]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-news"] });
    void qc.invalidateQueries({ queryKey: ["admin-news-item", id] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const save = useMutation({
    mutationFn: async () =>
      updateNews(id, {
        title: form['title']?.trim(),
        summary: form['summary'] || null,
        content: form['content'] ?? "",
        featured_image: form['featured_image'] || null,
        caption: form['caption'] || null,
        video_url: form['video_url'] || null,
        source: form['source'] || null,
        reporter_name: form['reporter_name'] || null,
        location: form['location'] || null,
        category_id: form['category_id'] || null,
        division_id: form['division_id'] || null,
        district_id: form['district_id'] || null,
        upazila_id: form['upazila_id'] || null,
        is_top: flags.is_top,
        is_breaking: flags.is_breaking,
      }),
    onSuccess: () => {
      toast.success("সংবাদ সংরক্ষিত হয়েছে");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ"),
  });

  const change = useMutation({
    mutationFn: (next: NewsStatus) => setNewsStatus(id, next, note),
    onSuccess: () => {
      toast.success("অবস্থা হালনাগাদ হয়েছে");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const remove = useMutation({
    mutationFn: () => deleteNews(id),
    onSuccess: () => {
      toast.success("সংবাদ মুছে ফেলা হয়েছে");
      invalidate();
      void navigate({ to: "/admin/news", search: { status: "ALL" } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  return (
    <AdminShell title="সংবাদ পর্যালোচনা">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      ) : !news ? (
        <p className="text-sm text-muted-foreground">কোনো নিউজ পাওয়া যায়নি</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[news.status] ?? ""}`}
              >
                {STATUS_BN[news.status] ?? news.status}
              </span>
              <span className="text-xs text-muted-foreground">
                জমা: {formatBnDate(news.created_at)} • পাঠক {toBn(news.views)}
              </span>
              <Link to="/admin/news" search={{ status: "ALL" }} className="ml-auto text-sm text-primary">
                তালিকায় ফিরুন
              </Link>
            </div>

            <div className="grid gap-3">
              <div>
                <Label htmlFor="title">শিরোনাম</Label>
                <Input id="title" value={form['title'] ?? ""} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="summary">সারসংক্ষেপ</Label>
                <Textarea
                  id="summary"
                  rows={2}
                  value={form['summary'] ?? ""}
                  onChange={(e) => set("summary", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="content">বিস্তারিত</Label>
                <Textarea
                  id="content"
                  rows={12}
                  value={form['content'] ?? ""}
                  onChange={(e) => set("content", e.target.value)}
                />
              </div>
              <div>
                <Label>ফিচার ছবি</Label>
                <ImageUpload
                  value={form['featured_image'] || null}
                  onChange={(url) => set("featured_image", url ?? "")}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="caption">ছবির ক্যাপশন</Label>
                  <Input id="caption" value={form['caption'] ?? ""} onChange={(e) => set("caption", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="video">ভিডিও লিংক</Label>
                  <Input id="video" value={form['video_url'] ?? ""} onChange={(e) => set("video_url", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="reporter">প্রতিবেদক</Label>
                  <Input
                    id="reporter"
                    value={form['reporter_name'] ?? ""}
                    onChange={(e) => set("reporter_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="source">সূত্র</Label>
                  <Input id="source" value={form['source'] ?? ""} onChange={(e) => set("source", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="location">অবস্থান</Label>
                  <Input
                    id="location"
                    value={form['location'] ?? ""}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">বিভাগ</Label>
                  <select
                    id="category"
                    className={selectClass}
                    value={form['category_id'] ?? ""}
                    onChange={(e) => set("category_id", e.target.value)}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="division">বিভাগ (অঞ্চল)</Label>
                  <select
                    id="division"
                    className={selectClass}
                    value={form['division_id'] ?? ""}
                    onChange={(e) => {
                      set("division_id", e.target.value);
                      set("district_id", "");
                      set("upazila_id", "");
                    }}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="district">জেলা</Label>
                  <select
                    id="district"
                    className={selectClass}
                    value={form['district_id'] ?? ""}
                    onChange={(e) => {
                      set("district_id", e.target.value);
                      set("upazila_id", "");
                    }}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="upazila">উপজেলা</Label>
                  <select
                    id="upazila"
                    className={selectClass}
                    value={form['upazila_id'] ?? ""}
                    onChange={(e) => set("upazila_id", e.target.value)}
                  >
                    <option value="">নির্বাচন করুন</option>
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={flags.is_top}
                    onChange={(e) => setFlags((f) => ({ ...f, is_top: e.target.checked }))}
                  />
                  শীর্ষ সংবাদ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={flags.is_breaking}
                    onChange={(e) => setFlags((f) => ({ ...f, is_breaking: e.target.checked }))}
                  />
                  ব্রেকিং নিউজ
                </label>
              </div>

              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "সংরক্ষণ হচ্ছে..." : "সম্পাদনা সংরক্ষণ করুন"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 shadow-card">
              <h2 className="text-sm font-bold">পর্যালোচনা</h2>
              <Label htmlFor="note" className="mt-3 block">
                মন্তব্য / সংশোধনের নির্দেশনা
              </Label>
              <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-3 grid gap-2">
                <Button disabled={change.isPending} onClick={() => change.mutate("APPROVED")}>
                  অনুমোদন করুন
                </Button>
                <Button
                  variant="outline"
                  disabled={change.isPending}
                  onClick={() => change.mutate("CORRECTION_REQUIRED")}
                >
                  সংশোধনের অনুরোধ
                </Button>
                <Button variant="outline" disabled={change.isPending} onClick={() => change.mutate("REJECTED")}>
                  বাতিল করুন
                </Button>
                {news.status === "PUBLISHED" ? (
                  <Button variant="outline" disabled={change.isPending} onClick={() => change.mutate("DRAFT")}>
                    প্রকাশ প্রত্যাহার
                  </Button>
                ) : (
                  <Button disabled={change.isPending} onClick={() => change.mutate("PUBLISHED")}>
                    প্রকাশ করুন
                  </Button>
                )}
                <Button
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm("এই সংবাদটি মুছে ফেলবেন?")) remove.mutate();
                  }}
                >
                  মুছে ফেলুন
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-sm shadow-card">
              <h2 className="mb-2 text-sm font-bold">তথ্য</h2>
              <p>বিভাগ: {news.category?.name ?? "—"}</p>
              <p>অঞ্চল: {news.division?.name ?? "—"}</p>
              <p>জেলা: {news.district?.name ?? "—"}</p>
              <p>উপজেলা: {news.upazila?.name ?? "—"}</p>
              <p>প্রতিবেদক: {news.reporter_name ?? "—"}</p>
              <p>প্রকাশ: {news.published_at ? formatBnDate(news.published_at) : "—"}</p>
              {news.status === "PUBLISHED" ? (
                <Link to="/news/$slug" params={{ slug: news.slug }} className="mt-2 block text-primary">
                  ওয়েবসাইটে দেখুন
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
