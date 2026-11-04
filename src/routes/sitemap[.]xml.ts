import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import {
  isSitemapRouteIncluded,
  sitemapPathForLocation,
  sitemapStaticPaths,
  sitemapXML,
  type SitemapEntry,
} from "@/lib/sitemap";

const BASE_URL = "https://mohakaltelevision.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        // Dynamic content: published news articles and public categories.
        if (isSitemapRouteIncluded(router.routesById["/news/$slug"])) {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              // Opaque sb_ keys are not JWTs; send apikey without the default bearer.
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            } },
          });

          const pageSize = 1000;
          for (let offset = 0; ; ) {
            const { data, error } = await supabase
              .from("news")
              .select("slug, published_at")
              .eq("status", "PUBLISHED")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            if (!data?.length) break;
            for (const row of data) {
              const location = router.buildLocation({
                to: "/news/$slug",
                params: { slug: row.slug },
                search: () => ({}),
                hash: "",
              });
              const path = sitemapPathForLocation(router, location, "/news/$slug");
              if (path) entries.push({ path, lastmod: row.published_at ?? undefined });
            }
            offset += data.length;
          }
        }

        if (isSitemapRouteIncluded(router.routesById["/category/$slug"])) {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            } },
          });

          const pageSize = 1000;
          for (let offset = 0; ; ) {
            const { data, error } = await supabase
              .from("categories")
              .select("slug")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            if (!data?.length) break;
            for (const row of data) {
              const location = router.buildLocation({
                to: "/category/$slug",
                params: { slug: row.slug },
                search: () => ({}),
                hash: "",
              });
              const path = sitemapPathForLocation(router, location, "/category/$slug");
              if (path) entries.push({ path });
            }
            offset += data.length;
          }
        }

        if (entries.length === 0) {
          return new Response(
            'No pages are included in this sitemap. Check route decisions and ancestor exclusions. Setting "exclude-subtree" on the root excludes the entire site.',
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
