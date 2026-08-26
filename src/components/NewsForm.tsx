import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { GalleryUpload } from "@/components/GalleryUpload";
import { RichTextEditor } from "@/components/RichTextEditor";
import { fetchCategories, fetchDistricts, fetchDivisions, fetchUpazilas } from "@/lib/queries";
import { EMPTY_NEWS_FORM, validateNews, type NewsFormValues } from "@/lib/news";
import type { NewsStatus } from "@/lib/mtv";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

type Props = {
  initial?: NewsFormValues;
  /** true when the actor may publish immediately (admin or granted representative). */
  canPublish?: boolean;
  submitting?: boolean;
  onSave: (values: NewsFormValues, status: NewsStatus) => void | Promise<unknown>;
};

export function NewsForm({ initial, canPublish = false, submitting = false, onSave }: Props) {
  const [values, setValues] = useState<NewsFormValues>(initial ?? { ...EMPTY_NEWS_FORM });

  const set = <K extends keyof NewsFormValues>(key: K, value: NewsFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-active"],
    queryFn: () => fetchCategories(true),
  });
  const { data: divisions = [] } = useQuery({ queryKey: ["divisions"], queryFn: fetchDivisions });
  const { data: districts = [] } = useQuery({
    queryKey: ["districts", values.division_id],
    queryFn: () => fetchDistricts(values.division_id || null),
  });
  const { data: upazilas = [] } = useQuery({
    queryKey: ["upazilas", values.district_id],
    queryFn: () => fetchUpazilas(values.district_id || null),
    enabled: !!values.district_id,
  });

  const submit = (status: NewsStatus) => {
    const invalid = validateNews(values);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    void onSave(values, status);
  };

  return (
    <form
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit("PENDING");
      }}
    >
      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
        <div>
          <Label htmlFor="title">শিরোনাম *</Label>
          <Input
            id="title"
            maxLength={200}
            required
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="সংবাদের শিরোনাম লিখুন"
          />
        </div>

        <div>
          <Label htmlFor="summary">সারসংক্ষেপ</Label>
          <Textarea
            id="summary"
            rows={2}
            maxLength={500}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="সংক্ষেপে সংবাদের মূল কথা"
          />
        </div>

        <div>
          <Label>বিস্তারিত *</Label>
          <RichTextEditor value={values.content} onChange={(html) => set("content", html)} />
        </div>

        <div>
          <Label>ফিচার ছবি</Label>
          <ImageUpload
            value={values.featured_image || null}
            onChange={(url) => set("featured_image", url ?? "")}
            label="ফিচার ছবি"
          />
        </div>

        <div>
          <Label htmlFor="caption">ছবির ক্যাপশন</Label>
          <Input id="caption" value={values.caption} onChange={(e) => set("caption", e.target.value)} />
        </div>

        <div>
          <Label>অতিরিক্ত ছবি (গ্যালারি)</Label>
          <GalleryUpload value={values.images} onChange={(urls) => set("images", urls)} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">শ্রেণিবিন্যাস</h2>
          <div>
            <Label htmlFor="category">বিভাগ (ক্যাটাগরি) *</Label>
            <select
              id="category"
              className={selectClass}
              value={values.category_id}
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
              value={values.division_id}
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
              value={values.district_id}
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
              value={values.upazila_id}
              onChange={(e) => set("upazila_id", e.target.value)}
              disabled={!values.district_id}
            >
              <option value="">নির্বাচন করুন</option>
              {upazilas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="location">নির্দিষ্ট স্থান</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="যেমন: সদর উপজেলা, বাজার এলাকা"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">প্রতিবেদক ও সূত্র</h2>
          <div>
            <Label htmlFor="reporter">প্রতিবেদকের নাম</Label>
            <Input
              id="reporter"
              value={values.reporter_name}
              onChange={(e) => set("reporter_name", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="designation">পদবি</Label>
            <Input
              id="designation"
              value={values.reporter_designation}
              onChange={(e) => set("reporter_designation", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="video">ভিডিও লিংক</Label>
            <Input
              id="video"
              value={values.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="source">সূত্র</Label>
            <Input id="source" value={values.source} onChange={(e) => set("source", e.target.value)} />
          </div>
        </div>

        {canPublish ? (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-bold">প্রকাশনা</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pdate">তারিখ</Label>
                <Input
                  id="pdate"
                  type="date"
                  value={values.publish_date}
                  onChange={(e) => set("publish_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ptime">সময়</Label>
                <Input
                  id="ptime"
                  type="time"
                  value={values.publish_time}
                  onChange={(e) => set("publish_time", e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.is_top}
                onChange={(e) => set("is_top", e.target.checked)}
              />
              শীর্ষ সংবাদ
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.is_breaking}
                onChange={(e) => set("is_breaking", e.target.checked)}
              />
              ব্রেকিং নিউজ
            </label>
          </div>
        ) : null}

        <div className="grid gap-2 rounded-lg border border-border bg-card p-4 shadow-card">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {canPublish ? "রিভিউয়ের জন্য জমা দিন" : "রিভিউয়ের জন্য পাঠান"}
          </Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => submit("DRAFT")}>
            খসড়া সংরক্ষণ করুন
          </Button>
          {canPublish ? (
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => submit("PUBLISHED")}>
              এখনই প্রকাশ করুন
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              প্রকাশের আগে অ্যাডমিনের অনুমোদন প্রয়োজন।
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
