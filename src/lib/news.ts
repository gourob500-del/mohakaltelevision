import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/queries";
import { makeSlug, type NewsStatus } from "@/lib/mtv";
import { notifyAdmins } from "@/lib/notifications";

export type NewsFormValues = {
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  images: string[];
  caption: string;
  category_id: string;
  division_id: string;
  district_id: string;
  upazila_id: string;
  location: string;
  reporter_name: string;
  reporter_designation: string;
  video_url: string;
  source: string;
  publish_date: string;
  publish_time: string;
  is_breaking: boolean;
  is_top: boolean;
};

export const EMPTY_NEWS_FORM: NewsFormValues = {
  title: "",
  summary: "",
  content: "",
  featured_image: "",
  images: [],
  caption: "",
  category_id: "",
  division_id: "",
  district_id: "",
  upazila_id: "",
  location: "",
  reporter_name: "",
  reporter_designation: "",
  video_url: "",
  source: "",
  publish_date: "",
  publish_time: "",
  is_breaking: false,
  is_top: false,
};

export function validateNews(v: NewsFormValues): string | null {
  if (v.title.trim().length < 5) return "শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।";
  if (v.title.trim().length > 200) return "শিরোনাম ২০০ অক্ষরের বেশি হতে পারবে না।";
  if (v.summary.length > 500) return "সারসংক্ষেপ ৫০০ অক্ষরের বেশি হতে পারবে না।";
  const text = v.content.replace(/<[^>]*>/g, "").trim();
  if (text.length < 20) return "সংবাদের বিস্তারিত অংশ কমপক্ষে ২০ অক্ষরের হতে হবে।";
  if (!v.category_id) return "একটি বিভাগ (ক্যাটাগরি) নির্বাচন করুন।";
  for (const url of [v.video_url, v.featured_image]) {
    if (url && url.length > 500) return "লিংক অনেক বড়।";
  }
  if (v.video_url && !/^https?:\/\//i.test(v.video_url)) return "ভিডিও লিংক সঠিক নয়।";
  return null;
}

/** Builds a URL-safe unique slug for a news title. */
export async function uniqueSlug(title: string, currentId?: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = makeSlug(title);
    let q = supabase.from("news").select("id").eq("slug", slug).limit(1);
    if (currentId) q = q.neq("id", currentId);
    const { data } = await q;
    if (!data || data.length === 0) return slug;
  }
  return `mtv-news-${Date.now().toString(36)}`;
}

function publishedAtFrom(v: NewsFormValues): string {
  if (v.publish_date) {
    const time = v.publish_time || "00:00";
    const d = new Date(`${v.publish_date}T${time}`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function basePayload(v: NewsFormValues) {
  return {
    title: v.title.trim(),
    summary: v.summary.trim() || null,
    content: v.content,
    featured_image: v.featured_image || null,
    images: v.images,
    caption: v.caption.trim() || null,
    category_id: v.category_id || null,
    division_id: v.division_id || null,
    district_id: v.district_id || null,
    upazila_id: v.upazila_id || null,
    location: v.location.trim() || null,
    reporter_name: v.reporter_name.trim() || null,
    reporter_designation: v.reporter_designation.trim() || null,
    video_url: v.video_url.trim() || null,
    source: v.source.trim() || null,
    is_breaking: v.is_breaking,
    is_top: v.is_top,
  };
}

export type SaveArgs = {
  values: NewsFormValues;
  status: NewsStatus;
  authorId: string;
  id?: string;
  /** true when the actor is an admin (used for publisher stamping / notifications). */
  isAdmin?: boolean;
  authorName?: string;
};

/** Creates or updates a news article and stamps real workflow timestamps. */
export async function saveNews({ values, status, authorId, id, isAdmin, authorName }: SaveArgs) {
  const invalid = validateNews(values);
  if (invalid) throw new Error(invalid);

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { ...basePayload(values), status };

  if (status === "PUBLISHED") {
    patch['published_at'] = publishedAtFrom(values);
    patch['published_by'] = authorId;
  }
  if (status === "PENDING") patch['submitted_at'] = now;
  if (status === "DRAFT") patch['published_at'] = null;

  let newsId = id;
  if (id) {
    const { error } = await supabase.from("news").update(patch as never).eq("id", id);
    if (error) throw error;
  } else {
    patch['author_id'] = authorId;
    patch['slug'] = await uniqueSlug(values.title);
    const { data, error } = await supabase
      .from("news")
      .insert(patch as never)
      .select("id, slug")
      .single();
    if (error) throw error;
    newsId = (data as { id: string }).id;
  }

  const action =
    status === "PUBLISHED" ? "NEWS_PUBLISH" : status === "PENDING" ? "NEWS_SUBMIT" : "NEWS_DRAFT";
  await logActivity(action, "NEWS", newsId, values.title.trim());

  if (status === "PENDING" && !isAdmin) {
    await notifyAdmins(
      "নতুন নিউজ রিভিউয়ের জন্য জমা হয়েছে",
      `${authorName ? `${authorName} — ` : ""}${values.title.trim()}`,
      newsId,
    );
  }

  return newsId as string;
}

export type MyNewsRow = {
  id: string;
  title: string;
  slug: string;
  status: NewsStatus;
  views: number;
  created_at: string;
  published_at: string | null;
  review_note: string | null;
  category: { name: string } | null;
  district: { name: string } | null;
};

const MY_NEWS_SELECT =
  "id, title, slug, status, views, created_at, published_at, review_note, category:categories(name), district:districts(name)";

/** Representative-scoped list: RLS plus an explicit author filter. */
export async function fetchMyNews(authorId: string, status?: NewsStatus | "ALL") {
  let q = supabase
    .from("news")
    .select(MY_NEWS_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "ALL") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MyNewsRow[];
}

/** Loads one article the current representative owns. Returns null for anyone else's row. */
export async function fetchMyNewsById(id: string, authorId: string) {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("author_id", authorId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function toFormValues(row: Record<string, unknown> | null | undefined): NewsFormValues {
  if (!row) return { ...EMPTY_NEWS_FORM };
  const str = (k: string) => (row[k] == null ? "" : String(row[k]));
  const published = row['published_at'] ? new Date(String(row['published_at'])) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    title: str("title"),
    summary: str("summary"),
    content: str("content"),
    featured_image: str("featured_image"),
    images: Array.isArray(row['images']) ? (row['images'] as string[]) : [],
    caption: str("caption"),
    category_id: str("category_id"),
    division_id: str("division_id"),
    district_id: str("district_id"),
    upazila_id: str("upazila_id"),
    location: str("location"),
    reporter_name: str("reporter_name"),
    reporter_designation: str("reporter_designation"),
    video_url: str("video_url"),
    source: str("source"),
    publish_date: published
      ? `${published.getFullYear()}-${pad(published.getMonth() + 1)}-${pad(published.getDate())}`
      : "",
    publish_time: published ? `${pad(published.getHours())}:${pad(published.getMinutes())}` : "",
    is_breaking: !!row['is_breaking'],
    is_top: !!row['is_top'],
  };
}
