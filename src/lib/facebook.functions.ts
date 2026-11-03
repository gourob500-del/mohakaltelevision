import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildFacebookCaption, buildFacebookComment, newsLink } from "@/lib/facebook";

const GRAPH = "https://graph.facebook.com/v21.0";

type AuthContext = { userId: string; supabase: import("@supabase/supabase-js").SupabaseClient };

async function assertAdmin(context: AuthContext) {
  const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!isAdmin) throw new Error("Forbidden");
}

type FacebookSettingsRow = { page_id: string; access_token: string; auto_enabled: boolean };

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  reporter_name: string | null;
  reporter_designation: string | null;
  published_at: string | null;
  featured_image: string | null;
  status: string;
};

async function readSettings(): Promise<FacebookSettingsRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("facebook_settings").select("page_id, access_token, auto_enabled").eq("id", 1).maybeSingle();
  return (data as FacebookSettingsRow | null) ?? { page_id: "", access_token: "", auto_enabled: false };
}

async function readNews(supabaseAdmin: import("@supabase/supabase-js").SupabaseClient, newsId: string): Promise<NewsRow | null> {
  const { data } = await supabaseAdmin
    .from("news")
    .select("id, slug, title, summary, reporter_name, reporter_designation, published_at, featured_image, status")
    .eq("id", newsId)
    .maybeSingle();
  return (data as NewsRow | null) ?? null;
}

type PostOutcome = { ok: true; postId: string; commentId: string | null } | { ok: false; error: string };

/** Posts the news photo to the configured Facebook page, then drops the article link as the first comment. */
async function postNewsToPage(newsId: string): Promise<PostOutcome> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const news = await readNews(supabaseAdmin, newsId);
  if (!news) return { ok: false, error: "সংবাদটি পাওয়া যায়নি।" };
  if (news.status !== "PUBLISHED" || !news.published_at) return { ok: false, error: "শুধু প্রকাশিত সংবাদ পোস্ট করা যাবে।" };
  if (!news.featured_image) return { ok: false, error: "সংবাদে প্রধান ছবি নেই।" };

  const settings = await readSettings();
  if (!settings.page_id || !settings.access_token) {
    return { ok: false, error: "ফেসবুক পেজ আইডি ও অ্যাক্সেস টোকেন সেটিংসে দিন।" };
  }

  const { data: site } = await supabaseAdmin.from("website_settings").select("site_name, website_url").eq("id", 1).maybeSingle();
  const caption = buildFacebookCaption(news, { site_name: site?.site_name, website_url: site?.website_url });

  // Featured images may be stored as absolute URLs or site-relative paths.
  let imageUrl = news.featured_image;
  if (imageUrl.startsWith("/")) {
    const base = site?.website_url && /^https?:\/\//.test(site.website_url) ? site.website_url : "https://mohakaltelevision.lovable.app";
    imageUrl = new URL(imageUrl, base).href;
  }

  const postRes = await fetch(`${GRAPH}/${encodeURIComponent(settings.page_id)}/photos`, {
    method: "POST",
    body: new URLSearchParams({ url: imageUrl, caption, access_token: settings.access_token }),
  });
  const postBody = (await postRes.json().catch(() => null)) as { id?: string; post_id?: string; error?: { message?: string } } | null;
  if (!postRes.ok || !postBody || postBody.error) {
    const error = postBody?.error?.message ?? `ফেসবুক পোস্ট ব্যর্থ (HTTP ${postRes.status})`;
    await logPost(newsId, "FAILED", null, null, error);
    return { ok: false, error };
  }
  const postId = postBody.post_id ?? postBody.id ?? "";

  let commentId: string | null = null;
  if (postId) {
    const commentRes = await fetch(`${GRAPH}/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: new URLSearchParams({
        message: buildFacebookComment(newsLink({ slug: news.slug }, site?.website_url)),
        access_token: settings.access_token,
      }),
    });
    const commentBody = (await commentRes.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null;
    commentId = commentBody?.id ?? null;
    if (!commentRes.ok || !commentBody || commentBody.error) {
      const error = commentBody?.error?.message ?? `কমেন্ট পোস্ট ব্যর্থ (HTTP ${commentRes.status})`;
      await logPost(newsId, "PARTIAL", postId, null, error);
      return { ok: false, error: `পোস্ট হয়েছে কিন্তু কমেন্ট হয়নি: ${error}` };
    }
  }

  await logPost(newsId, "SUCCESS", postId, commentId, null);
  return { ok: true, postId, commentId };
}

async function logPost(newsId: string, status: string, postId: string | null, commentId: string | null, error: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("facebook_posts").insert({ news_id: newsId, status, fb_post_id: postId, fb_comment_id: commentId, error });
}

/** Reads page/token configuration for the admin UI; the token itself never leaves the server. */
export const getFacebookSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const settings = await readSettings();
    return { page_id: settings.page_id, auto_enabled: settings.auto_enabled, has_token: settings.access_token.length > 0 };
  });

const settingsInput = (input: unknown) => {
  const data = input as { page_id?: string; access_token?: string; clear_token?: boolean; auto_enabled?: boolean };
  return {
    page_id: (data.page_id ?? "").trim().slice(0, 120),
    access_token: typeof data.access_token === "string" && data.access_token.trim() ? data.access_token.trim() : null,
    clear_token: data.clear_token === true,
    auto_enabled: data.auto_enabled === true,
  };
};

/** Saves Facebook page settings; an empty token keeps the stored one. */
export const saveFacebookSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(settingsInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = {
      page_id: data.page_id,
      auto_enabled: data.auto_enabled,
      updated_at: new Date().toISOString(),
    };
    if (data.clear_token) patch["access_token"] = "";
    else if (data.access_token) patch["access_token"] = data.access_token;
    const { error } = await context.supabase.from("facebook_settings").update(patch as never).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Manually posts one published news to the Facebook page. */
export const postNewsToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => (input as { newsId: string }).newsId as string)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const outcome = await postNewsToPage(data);
    if (!outcome.ok) throw new Error(outcome.error);
    return outcome;
  });

/** Lists recent Facebook posting attempts for the admin panel. */
export const listFacebookPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("facebook_posts")
      .select("id, news_id, fb_post_id, fb_comment_id, status, error, created_at, news:news_id(title, slug)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Auto-posting hook, called right after a news is published.
 * Never blocks or fails the publish flow; returns skipped when disabled or already posted.
 */
export const maybeAutoPostToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => (input as { newsId: string }).newsId as string)
  .handler(async ({ data }) => {
    try {
      const settings = await readSettings();
      if (!settings.auto_enabled) return { skipped: true as const };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: existing } = await supabaseAdmin
        .from("facebook_posts")
        .select("id")
        .eq("news_id", data)
        .eq("status", "SUCCESS")
        .maybeSingle();
      if (existing) return { skipped: true as const };
      const outcome = await postNewsToPage(data);
      return outcome.ok ? { ok: true as const } : { ok: false as const, error: outcome.error };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "অজানা ত্রুটি" };
    }
  });
