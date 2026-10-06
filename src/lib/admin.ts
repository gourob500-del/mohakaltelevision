import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/queries";
import type { NewsStatus } from "@/lib/mtv";

export const ADMIN_NEWS_SELECT = `
  id, slug, title, summary, content, featured_image, caption, video_url, source,
  reporter_name, reporter_designation, location, status, views, published_at, created_at, updated_at,
  review_note, author_id, is_top, is_breaking,
  category_id, division_id, district_id, upazila_id,
  category:categories(id, name), division:divisions(id, name),
  district:districts(id, name), upazila:upazilas(id, name)
`;

export type AdminNewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  featured_image: string | null;
  caption: string | null;
  video_url: string | null;
  source: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  location: string | null;
  status: NewsStatus;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  review_note: string | null;
  author_id: string;
  is_top: boolean;
  is_breaking: boolean;
  category_id: string | null;
  division_id: string | null;
  district_id: string | null;
  upazila_id: string | null;
  category: { id: string; name: string } | null;
  division: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  upazila: { id: string; name: string } | null;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  photo_url: string | null;
  designation: string | null;
  district_id: string | null;
  upazila_id: string | null;
  representative_id: string | null;
  joining_date: string;
  status: string;
  created_at: string;
};

/* ---------------- stats ---------------- */

async function newsCount(status?: NewsStatus) {
  let q = supabase.from("news").select("id", { count: "exact", head: true });
  if (status) q = q.eq("status", status);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAdminStats() {
  const [
    total,
    pending,
    published,
    draft,
    rejected,
    correction,
    approved,
    reps,
    activeReps,
  ] = await Promise.all([
    newsCount(),
    newsCount("PENDING"),
    newsCount("PUBLISHED"),
    newsCount("DRAFT"),
    newsCount("REJECTED"),
    newsCount("CORRECTION_REQUIRED"),
    newsCount("APPROVED"),
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "REPRESENTATIVE"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
  ]);
  if (reps.error) throw reps.error;
  if (activeReps.error) throw activeReps.error;
  return {
    total,
    pending,
    published,
    draft,
    rejected,
    correction,
    approved,
    representatives: reps.count ?? 0,
    activeAccounts: activeReps.count ?? 0,
  };
}

/* ---------------- news ---------------- */

export type AdminNewsFilters = {
  status?: NewsStatus | "ALL";
  search?: string;
  categoryId?: string | undefined;
  districtId?: string | undefined;
  authorId?: string | undefined;
};

export async function fetchAdminNews(
  status?: NewsStatus | "ALL",
  search?: string,
  filters: AdminNewsFilters = {},
) {
  let q = supabase
    .from("news")
    .select(ADMIN_NEWS_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "ALL") q = q.eq("status", status);
  if (search && search.trim()) q = q.ilike("title", `%${search.trim()}%`);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.districtId) q = q.eq("district_id", filters.districtId);
  if (filters.authorId) q = q.eq("author_id", filters.authorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminNewsRow[];
}

export type NewsFilterOptions = {
  categories: { id: string; name: string }[];
  districts: { id: string; name: string }[];
  reporters: { id: string; name: string }[];
};

export async function fetchNewsFilterOptions(): Promise<NewsFilterOptions> {
  const [cats, dists, auths] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("districts").select("id, name").eq("is_active", true).order("name"),
    supabase.from("news").select("author_id").not("author_id", "is", null).limit(500),
  ]);
  if (cats.error) throw cats.error;
  if (dists.error) throw dists.error;
  if (auths.error) throw auths.error;
  const authorIds = [...new Set((auths.data ?? []).map((a) => a.author_id as string))];
  let reporters: { id: string; name: string }[] = [];
  if (authorIds.length) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    if (pErr) throw pErr;
    reporters = (profs ?? []).map((p) => ({ id: p.id, name: p.full_name || "নামহীন" }));
    reporters.sort((a, b) => a.name.localeCompare(b.name, "bn"));
  }
  return { categories: cats.data ?? [], districts: dists.data ?? [], reporters };
}

export async function fetchNewsById(id: string) {
  const { data, error } = await supabase
    .from("news")
    .select(ADMIN_NEWS_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as AdminNewsRow | null;
}

const ACTION_LABEL: Record<string, string> = {
  APPROVED: "NEWS_APPROVE",
  REJECTED: "NEWS_REJECT",
  CORRECTION_REQUIRED: "NEWS_CORRECTION",
  PUBLISHED: "NEWS_PUBLISH",
  DRAFT: "NEWS_UNPUBLISH",
  PENDING: "NEWS_PENDING",
};

export async function setNewsStatus(id: string, status: NewsStatus, note?: string) {
  // Approving a story sends it live right away, so it appears on the homepage.
  const next: NewsStatus = status === "APPROVED" ? "PUBLISHED" : status;
  const patch: Record<string, unknown> = { status: next };
  if (next === "PUBLISHED") patch['published_at'] = new Date().toISOString();
  if (next === "DRAFT") patch['published_at'] = null;
  patch['review_note'] = note?.trim() ? note.trim() : null;
  const { error } = await supabase.from("news").update(patch as never).eq("id", id);
  if (error) throw error;
  await logActivity(ACTION_LABEL[next] ?? "NEWS_UPDATE", "NEWS", id, note ?? undefined);
}

export async function updateNews(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("news").update(patch as never).eq("id", id);
  if (error) throw error;
  await logActivity("NEWS_EDIT", "NEWS", id);
}

export async function deleteNews(id: string) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
  await logActivity("NEWS_DELETE", "NEWS", id);
}

/* ---------------- representatives / users ---------------- */

export async function fetchRepresentatives() {
  const [{ data: roles, error: rErr }, { data: profiles, error: pErr }] = await Promise.all([
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  ]);
  if (rErr) throw rErr;
  if (pErr) throw pErr;
  const roleMap = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const list = roleMap.get(r.user_id) ?? [];
    list.push(r.role as string);
    roleMap.set(r.user_id, list);
  }
  return (profiles ?? []).map((p) => ({
    ...(p as ProfileRow),
    roles: roleMap.get(p.id) ?? [],
  }));
}

export async function setAccountStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING") {
  const { error } = await supabase.from("profiles").update({ status } as never).eq("id", id);
  if (error) throw error;
  await logActivity(status === "ACTIVE" ? "REP_ACTIVATE" : "REP_SUSPEND", "PROFILE", id);
}

export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", id);
  if (error) throw error;
  await logActivity("REP_EDIT", "PROFILE", id);
}

/* ---------------- categories ---------------- */

export async function fetchAllCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: { name: string; slug: string; sort_order: number }) {
  const { error } = await supabase.from("categories").insert(input as never);
  if (error) throw error;
  await logActivity("CATEGORY_CREATE", "CATEGORY", undefined, input.name);
}

export async function updateCategory(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("categories").update(patch as never).eq("id", id);
  if (error) throw error;
  await logActivity("CATEGORY_UPDATE", "CATEGORY", id);
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  await logActivity("CATEGORY_DELETE", "CATEGORY", id);
}

/* ---------------- locations ---------------- */

export async function createDivision(input: { name: string; slug: string }) {
  const { error } = await supabase.from("divisions").insert(input as never);
  if (error) throw error;
  await logActivity("DIVISION_CREATE", "DIVISION", undefined, input.name);
}

export async function createDistrict(input: {
  name: string;
  slug: string;
  code: string;
  division_id: string;
}) {
  const { error } = await supabase.from("districts").insert(input as never);
  if (error) throw error;
  await logActivity("DISTRICT_CREATE", "DISTRICT", undefined, input.name);
}

export async function createUpazila(input: { name: string; slug: string; district_id: string }) {
  const { error } = await supabase.from("upazilas").insert(input as never);
  if (error) throw error;
  await logActivity("UPAZILA_CREATE", "UPAZILA", undefined, input.name);
}

export async function toggleLocation(
  table: "divisions" | "districts" | "upazilas",
  id: string,
  is_active: boolean,
) {
  const { error } = await supabase.from(table).update({ is_active } as never).eq("id", id);
  if (error) throw error;
  await logActivity("LOCATION_UPDATE", table.toUpperCase(), id);
}

export async function deleteLocation(
  table: "divisions" | "districts" | "upazilas",
  id: string,
) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
  await logActivity("LOCATION_DELETE", table.toUpperCase(), id);
}

/* ---------------- media ---------------- */

export async function fetchMedia(search?: string) {
  let q = supabase.from("media").select("*").order("created_at", { ascending: false }).limit(200);
  if (search && search.trim()) q = q.ilike("file_name", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function deleteMedia(id: string, path: string) {
  await supabase.storage.from("media").remove([path]);
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw error;
  await logActivity("MEDIA_DELETE", "MEDIA", id);
}

/* ---------------- settings ---------------- */

export async function updateSettings(patch: Record<string, unknown>) {
  const { error } = await supabase.from("website_settings").update(patch as never).eq("id", 1);
  if (error) throw error;
  await logActivity("SETTINGS_UPDATE", "SETTINGS", "1");
}

export async function fetchAdminSettings() {
  const { data, error } = await supabase.from("website_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- activity logs ---------------- */

export async function fetchActivityLogs(limit = 200) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export const ACTION_BN: Record<string, string> = {
  LOGIN: "লগইন",
  LOGOUT: "লগআউট",
  ADMIN_LOGIN: "অ্যাডমিন লগইন",
  REP_LOGIN: "প্রতিনিধি লগইন",
  NEWS_SUBMIT: "সংবাদ জমা",
  NEWS_DRAFT: "খসড়া সংরক্ষণ",
  NEWS_APPROVE: "সংবাদ অনুমোদন",
  NEWS_REJECT: "সংবাদ বাতিল",
  NEWS_CORRECTION: "সংশোধনের অনুরোধ",
  NEWS_PUBLISH: "সংবাদ প্রকাশ",
  NEWS_UNPUBLISH: "প্রকাশ প্রত্যাহার",
  NEWS_PENDING: "পুনরায় অপেক্ষমাণ",
  NEWS_EDIT: "সংবাদ সম্পাদনা",
  NEWS_DELETE: "সংবাদ মুছে ফেলা",
  REP_CREATE: "প্রতিনিধি যুক্ত",
  REP_EDIT: "প্রতিনিধি সম্পাদনা",
  REP_ACTIVATE: "প্রতিনিধি সক্রিয়",
  REP_SUSPEND: "প্রতিনিধি স্থগিত",
  CATEGORY_CREATE: "বিভাগ যুক্ত",
  CATEGORY_UPDATE: "বিভাগ হালনাগাদ",
  CATEGORY_DELETE: "বিভাগ মুছে ফেলা",
  DIVISION_CREATE: "বিভাগ (অঞ্চল) যুক্ত",
  DISTRICT_CREATE: "জেলা যুক্ত",
  UPAZILA_CREATE: "উপজেলা যুক্ত",
  LOCATION_UPDATE: "অবস্থান হালনাগাদ",
  LOCATION_DELETE: "অবস্থান মুছে ফেলা",
  MEDIA_UPLOAD: "মিডিয়া আপলোড",
  MEDIA_DELETE: "মিডিয়া মুছে ফেলা",
  SETTINGS_UPDATE: "সেটিংস হালনাগাদ",
};
