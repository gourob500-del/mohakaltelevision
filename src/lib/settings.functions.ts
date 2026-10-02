import { createServerFn } from "@tanstack/react-start";

export type PublicWebsiteSettings = {
  id: number;
  site_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  contact_number: string;
  contact_email: string | null;
  about_text: string;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  website_url: string;
  editor_name: string;
  news_editor_name: string;
  executive_editor_name: string;
  publisher_name: string;
  office_address: string;
};

/** Returns only fields intentionally displayed on the public website. */
export const getPublicWebsiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("website_settings")
    .select(
      "id, site_name, tagline, logo_url, favicon_url, contact_number, contact_email, about_text, facebook_url, youtube_url, twitter_url, instagram_url, website_url, editor_name, news_editor_name, executive_editor_name, publisher_name, office_address",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PublicWebsiteSettings | null;
});