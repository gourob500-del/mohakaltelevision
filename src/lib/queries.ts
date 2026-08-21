import { supabase } from "@/integrations/supabase/client";

export const NEWS_SELECT = `
  id, slug, title, summary, featured_image, caption, video_url, source,
  reporter_name, location, status, views, published_at, created_at, updated_at,
  review_note, author_id, is_top, is_breaking, content,
  category:categories(id, name, slug),
  division:divisions(id, name, slug),
  district:districts(id, name, slug),
  upazila:upazilas(id, name, slug)
`;

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  featured_image: string | null;
  caption: string | null;
  video_url: string | null;
  source: string | null;
  reporter_name: string | null;
  location: string | null;
  status: string;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  review_note: string | null;
  author_id: string;
  is_top: boolean;
  is_breaking: boolean;
  content: string;
  category: { id: string; name: string; slug: string } | null;
  division: { id: string; name: string; slug: string } | null;
  district: { id: string; name: string; slug: string } | null;
  upazila: { id: string; name: string; slug: string } | null;
};

function published() {
  return supabase
    .from("news")
    .select(NEWS_SELECT)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });
}

export async function fetchLatestNews(limit = 12) {
  const { data, error } = await published().limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchBreakingNews(limit = 8) {
  const { data, error } = await published().eq("is_breaking", true).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchTopNews(limit = 5) {
  const { data, error } = await published().eq("is_top", true).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchPopularNews(limit = 6) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_SELECT)
    .eq("status", "PUBLISHED")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchNewsByCategory(slug: string, limit = 6) {
  const { data, error } = await published().eq("categories.slug", slug).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchDistrictNews(limit = 8) {
  const { data, error } = await published().not("district_id", "is", null).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export async function fetchNewsBySlug(slug: string) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_SELECT)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as NewsRow | null;
}

export async function fetchCategories(activeOnly = true) {
  let q = supabase.from("categories").select("*").order("sort_order");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDivisions() {
  const { data, error } = await supabase.from("divisions").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchDistricts(divisionId?: string | null) {
  let q = supabase.from("districts").select("*").order("name");
  if (divisionId) q = q.eq("division_id", divisionId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchUpazilas(districtId?: string | null) {
  let q = supabase.from("upazilas").select("*").order("name");
  if (districtId) q = q.eq("district_id", districtId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings() {
  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  await supabase.from("activity_logs").insert({
    user_id: auth.user.id,
    actor_name: profile?.full_name || auth.user.email || "",
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}
