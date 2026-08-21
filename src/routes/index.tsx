import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { BreakingTicker } from "@/components/BreakingTicker";
import {
  NEWS_SELECT,
  fetchBreakingNews,
  fetchCategories,
  fetchDistrictNews,
  fetchLatestNews,
  fetchPopularNews,
  fetchTopNews,
  type NewsRow,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOHAKAL TELEVISION — আপনার আয়োজন, আমাদের সংবাদ" },
      {
        name: "description",
        content:
          "MOHAKAL TELEVISION-এ পড়ুন বাংলাদেশের সর্বশেষ জাতীয়, আন্তর্জাতিক, রাজনীতি, শিক্ষা, ধর্ম ও জেলার সংবাদ।",
      },
      { property: "og:title", content: "MOHAKAL TELEVISION — আপনার আয়োজন, আমাদের সংবাদ" },
      {
        property: "og:description",
        content: "বাংলাদেশের সর্বশেষ জাতীয়, আন্তর্জাতিক ও জেলার সংবাদ এক ঠিকানায়।",
      },
    ],
  }),
  component: Home,
});

function CategoryBlock({ slug, name }: { slug: string; name: string }) {
  const { data } = useQuery({
    queryKey: ["cat-news", slug],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("news")
        .select(`${NEWS_SELECT}, categories!inner(slug)`)
        .eq("status", "PUBLISHED")
        .eq("categories.slug", slug)
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (rows ?? []) as unknown as NewsRow[];
    },
  });

  if (!data?.length) return null;

  return (
    <section className="mt-8">
      <SectionTitle
        action={
          <Link to="/category/$slug" params={{ slug }} className="text-primary hover:underline">
            সব দেখুন
          </Link>
        }
      >
        {name}
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.map((n) => (
          <NewsCard key={n.id} news={n} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data: breaking } = useQuery({ queryKey: ["breaking"], queryFn: () => fetchBreakingNews() });
  const { data: latest, isLoading } = useQuery({
    queryKey: ["latest", 12],
    queryFn: () => fetchLatestNews(12),
  });
  const { data: top } = useQuery({ queryKey: ["top"], queryFn: () => fetchTopNews(5) });
  const { data: popular } = useQuery({ queryKey: ["popular"], queryFn: () => fetchPopularNews(6) });
  const { data: districtNews } = useQuery({
    queryKey: ["district-news"],
    queryFn: () => fetchDistrictNews(8),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCategories() });

  const lead = latest?.[0];
  const rest = latest?.slice(1, 9) ?? [];

  return (
    <PublicLayout>
      <BreakingTicker items={breaking ?? []} />

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : !latest?.length ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-lg font-bold">এখনো কোনো সংবাদ প্রকাশিত হয়নি</p>
          <p className="mt-2 text-sm text-muted-foreground">
            অ্যাডমিন প্যানেল থেকে সংবাদ প্রকাশ করা হলে তা এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {lead ? <NewsCard news={lead} variant="lead" /> : null}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {rest.map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          </div>

          <aside>
            {top?.length ? (
              <section className="mb-6">
                <SectionTitle>শীর্ষ সংবাদ</SectionTitle>
                <div className="rounded-lg border border-border bg-card px-3">
                  {top.map((n) => (
                    <NewsCard key={n.id} news={n} variant="row" />
                  ))}
                </div>
              </section>
            ) : null}

            {popular?.length ? (
              <section>
                <SectionTitle>জনপ্রিয় সংবাদ</SectionTitle>
                <div className="rounded-lg border border-border bg-card px-3">
                  {popular.map((n) => (
                    <NewsCard key={n.id} news={n} variant="row" />
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      )}

      {districtNews?.length ? (
        <section className="mt-8">
          <SectionTitle
            action={
              <Link to="/district" className="text-primary hover:underline">
                সব দেখুন
              </Link>
            }
          >
            জেলার সংবাদ
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {districtNews.map((n) => (
              <NewsCard key={n.id} news={n} />
            ))}
          </div>
        </section>
      ) : null}

      {(categories ?? []).map((c) => (
        <CategoryBlock key={c.id} slug={c.slug} name={c.name} />
      ))}
    </PublicLayout>
  );
}
