import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, fetchNewsBySlug, type NewsRow } from "@/lib/queries";
import { formatBnDate, toBn } from "@/lib/mtv";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => ({ news: await fetchNewsBySlug(params.slug) }),
  head: ({ loaderData }) => {
    const n = loaderData?.news;
    const title = n ? `${n.title} — মহাকাল টেলিভিশন` : "সংবাদ — মহাকাল টেলিভিশন";
    const description = (n?.summary || n?.title || "মহাকাল টেলিভিশনের সর্বশেষ সংবাদ।").slice(0, 155);
    const image = n?.featured_image?.startsWith("https://") ? n.featured_image : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        ...(n ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  errorComponent: () => (
    <PublicLayout>
      <p className="py-20 text-center text-muted-foreground">সংবাদটি লোড করা যায়নি।</p>
    </PublicLayout>
  ),
  notFoundComponent: () => (
    <PublicLayout>
      <p className="py-20 text-center text-muted-foreground">সংবাদটি পাওয়া যায়নি।</p>
    </PublicLayout>
  ),
  component: NewsDetail,
});

function NewsDetail() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: () => fetchNewsBySlug(slug),
    initialData: initial?.news ?? undefined,
  });

  // Live view count: refreshed after our own hit and every 20s while reading.
  const { data: liveViews } = useQuery({
    queryKey: ["news-views", slug],
    enabled: !!news?.id,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("views")
        .eq("slug", slug)
        .eq("status", "PUBLISHED")
        .maybeSingle();
      if (error) throw error;
      return (data?.views ?? 0) as number;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related", news?.category?.id, news?.id],
    enabled: !!news?.id,
    queryFn: async () => {
      let q = supabase
        .from("news")
        .select(NEWS_SELECT)
        .eq("status", "PUBLISHED")
        .neq("id", news!.id)
        .order("published_at", { ascending: false })
        .limit(4);
      if (news?.category?.id) q = q.eq("category_id", news.category.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as NewsRow[];
    },
  });

  useEffect(() => {
    if (!news?.slug) return;
    if (typeof window === "undefined") return;
    const key = `mtv-view-${news.slug}`;
    const last = window.sessionStorage.getItem(key);
    if (last && Date.now() - Number(last) < 6 * 60 * 60 * 1000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
    void supabase
      .rpc("increment_news_views", { _slug: news.slug })
      .then(() => queryClient.invalidateQueries({ queryKey: ["news-views", news.slug] }));
  }, [news?.slug, queryClient]);

  if (isLoading && !news) {
    return (
      <PublicLayout>
        <p className="py-20 text-center text-muted-foreground">লোড হচ্ছে...</p>
      </PublicLayout>
    );
  }

  if (!news) {
    return (
      <PublicLayout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">সংবাদটি পাওয়া যায়নি</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            এটি মুছে ফেলা হয়েছে অথবা এখনো প্রকাশিত হয়নি।
          </p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            প্রচ্ছদে ফিরে যান
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const place = [news.location, news.upazila?.name, news.district?.name]
    .filter(Boolean)
    .join(", ");
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(news.content);
  const gallery = Array.isArray(news.images) ? news.images.filter(Boolean) : [];
  const views = liveViews ?? news.views;

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl">
        {news.category ? (
          <Link
            to="/category/$slug"
            params={{ slug: news.category.slug }}
            className="inline-block rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground"
          >
            {news.category.name}
          </Link>
        ) : null}

        <h1 className="mt-3 text-2xl font-black leading-snug sm:text-3xl">{news.title}</h1>

        {news.summary ? (
          <p className="mt-3 border-l-4 border-primary bg-muted/50 p-3 text-base text-muted-foreground">
            {news.summary}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-sm text-muted-foreground">
          {news.reporter_name ? (
            <span className="font-semibold text-foreground">
              {news.reporter_name}
              {news.reporter_designation ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {news.reporter_designation}
                </span>
              ) : null}
            </span>
          ) : null}
          {place ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {place}
            </span>
          ) : null}
          <span>প্রকাশ: {formatBnDate(news.published_at)}</span>
          {news.updated_at && news.updated_at !== news.published_at ? (
            <span>সর্বশেষ আপডেট: {formatBnDate(news.updated_at)}</span>
          ) : null}
          <span className="inline-flex items-center gap-1" aria-live="polite">
            <Eye className="h-3.5 w-3.5" /> {toBn(views)} বার পঠিত
          </span>
        </div>

        {news.featured_image ? (
          <figure className="mt-4">
            <img
              src={news.featured_image}
              alt={news.caption || news.title}
              loading="lazy"
              className="w-full rounded-lg border border-border object-cover"
            />
            {news.caption ? (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                {news.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {isHtml ? (
          <div
            className="news-body mt-5"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        ) : (
          <div className="news-body news-body-plain mt-5">{news.content}</div>
        )}

        {gallery.length ? (
          <section className="mt-6">
            <SectionTitle>ছবি</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLightbox(src)}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={src}
                    alt={`${news.title} — ছবি ${toBn(i + 1)}`}
                    loading="lazy"
                    className="h-32 w-full object-cover transition-transform hover:scale-105 sm:h-36"
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {news.video_url ? (
          <p className="mt-5">
            <a
              href={news.video_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              ভিডিও দেখুন
            </a>
          </p>
        ) : null}

        {news.source ? (
          <p className="mt-5 text-sm text-muted-foreground">সূত্র: {news.source}</p>
        ) : null}
      </article>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-label="ছবি"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt={news.title} className="max-h-full max-w-full rounded-lg" />
        </div>
      ) : null}

      {related?.length ? (
        <section className="mx-auto mt-10 max-w-5xl">
          <SectionTitle>সম্পর্কিত সংবাদ</SectionTitle>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((n) => (
              <NewsCard key={n.id} news={n} />
            ))}
          </div>
        </section>
      ) : null}
    </PublicLayout>
  );
}
