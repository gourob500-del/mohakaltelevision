import { supabase } from "@/integrations/supabase/client";

export const AD_PLACEMENTS = [
  { key: "header", label: "হেডার (উপরে)" },
  { key: "sidebar", label: "সাইডবার" },
  { key: "in-article", label: "সংবাদের ভেতরে" },
] as const;

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

export async function fetchActiveAds(placement: string) {
  const { data, error } = await supabase
    .from("ads")
    .select("id, title, image_url, link_url, placement, is_active, starts_at, ends_at, sort_order")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  const now = Date.now();
  return (data ?? []).filter(
    (a) => (!a.starts_at || Date.parse(a.starts_at) <= now) && (!a.ends_at || Date.parse(a.ends_at) >= now),
  ) as Ad[];
}

export async function fetchAllAds() {
  const { data, error } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ad[];
}

export async function saveAd(ad: Partial<Ad> & { title: string; image_url: string }) {
  const { data: u } = await supabase.auth.getUser();
  const { id: _id, ...rest } = ad;
  void _id;
  const payload = ad.id ? rest : { ...rest, created_by: u.user?.id ?? null };
  const { error } = ad.id
    ? await supabase.from("ads").update(payload).eq("id", ad.id)
    : await supabase.from("ads").insert(payload);
  if (error) throw error;
}

export async function deleteAd(id: string) {
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) throw error;
}
