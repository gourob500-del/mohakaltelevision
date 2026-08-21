import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, fetchNewsBySlug, type NewsRow } from "@/lib/queries";
import { formatBnDate, toBn } from "@/lib/mtv";

export const Route = createFileRoute("/news/$slug")({
  component: NewsDetail,
});

function NewsDetail() {
  const { slug } = Route.useParams();

  const { data: news, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: () => fetchNewsBySlug(slug),
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
    const key = `mtv-view-${news.slug}`;
    if (typeof window === "undefined") return;
    const last = window.sessionStorage.getItem(key);
    if (last && Date.now() - Number(last) < 6 * 60 * 60 * 1000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
    void supabase.rpc("increment_news_views", { _slug: news.slug });
  }, [news?.slug]);

  if (isLoading) {
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
            <span className="font-semibold text-foreground">{news.reporter_name}</span>
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
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {toBn(news.views)} বার পঠিত
          </span>
        </div>

        {news.featured_image ? (
          <figure className="mt-4">
            <img
              src={news.featured_image}
              alt={news.caption || news.title}
              className="w-full rounded-lg border border-border object-cover"
            />
            {news.caption ? (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                {news.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="news-body mt-5">{news.content}</div>

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
