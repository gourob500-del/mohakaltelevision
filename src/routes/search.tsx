import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, type NewsRow } from "@/lib/queries";

const searchSchema = z.object({ q: z.string().trim().max(100).optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "সংবাদ খুঁজুন — MOHAKAL TELEVISION" },
      { name: "description", content: "MOHAKAL TELEVISION-এ প্রকাশিত সংবাদ খুঁজে দেখুন।" },
      { property: "og:title", content: "সংবাদ খুঁজুন — MOHAKAL TELEVISION" },
      { property: "og:description", content: "MOHAKAL TELEVISION-এ প্রকাশিত সংবাদ খুঁজে দেখুন।" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const term = (q ?? "").trim();

  const { data, isLoading } = useQuery({
    queryKey: ["search", term],
    enabled: term.length > 1,
    queryFn: async () => {
      const safe = term.replace(/[%,()]/g, " ");
      const { data: rows, error } = await supabase
        .from("news")
        .select(NEWS_SELECT)
        .eq("status", "PUBLISHED")
        .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,content.ilike.%${safe}%`)
        .order("published_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (rows ?? []) as unknown as NewsRow[];
    },
  });

  return (
    <PublicLayout>
      <SectionTitle>অনুসন্ধান{term ? `: ${term}` : ""}</SectionTitle>
      {term.length < 2 ? (
        <p className="py-16 text-center text-muted-foreground">
          অনুসন্ধানের জন্য কমপক্ষে ২ অক্ষর লিখুন।
        </p>
      ) : isLoading ? (
        <p className="py-16 text-center text-muted-foreground">খোঁজা হচ্ছে...</p>
      ) : !data?.length ? (
        <p className="py-16 text-center text-muted-foreground">কোনো ফলাফল পাওয়া যায়নি।</p>
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
