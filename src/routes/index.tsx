import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { BreakingTicker } from "@/components/BreakingTicker";
import { AdSlot } from "@/components/AdSlot";
import { fetchHomeFeed, type NewsRow } from "@/lib/queries";

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

function CategoryBlock({
  slug,
  name,
  items,
}: {
  slug: string;
  name: string;
  items: NewsRow[];
}) {
  if (!items.length) return null;

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
        {items.map((n) => (
          <NewsCard key={n.id} news={n} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ["home-feed"],
    queryFn: () => fetchHomeFeed(),
  });

  const breaking = feed?.breaking;
  const latest = feed?.latest;
  const top = feed?.top;
  const popular = feed?.popular;
  const districtNews = feed?.district;
  const categories = feed?.byCategory;

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
            <AdSlot placement="sidebar" className="mb-6" />
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
        <CategoryBlock key={c.id} slug={c.slug} name={c.name} items={c.items} />
      ))}
    </PublicLayout>
  );
}
