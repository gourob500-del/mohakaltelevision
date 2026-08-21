import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { fetchLatestNews } from "@/lib/queries";

export const Route = createFileRoute("/latest")({
  head: () => ({
    meta: [
      { title: "সর্বশেষ সংবাদ — MOHAKAL TELEVISION" },
      { name: "description", content: "MOHAKAL TELEVISION-এ প্রকাশিত সর্বশেষ সংবাদসমূহ।" },
      { property: "og:title", content: "সর্বশেষ সংবাদ — MOHAKAL TELEVISION" },
      { property: "og:description", content: "MOHAKAL TELEVISION-এ প্রকাশিত সর্বশেষ সংবাদসমূহ।" },
    ],
  }),
  component: LatestPage,
});

function LatestPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["latest", 40],
    queryFn: () => fetchLatestNews(40),
  });

  return (
    <PublicLayout>
      <SectionTitle>সর্বশেষ সংবাদ</SectionTitle>
      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : !data?.length ? (
        <p className="py-16 text-center text-muted-foreground">এখনো কোনো সংবাদ নেই।</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
        </div>
      )}
    </PublicLayout>
  );
}
