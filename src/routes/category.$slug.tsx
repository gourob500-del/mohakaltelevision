import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, type NewsRow } from "@/lib/queries";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["category-news", slug],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("news")
        .select(`${NEWS_SELECT}, categories!inner(slug)`)
        .eq("status", "PUBLISHED")
        .eq("categories.slug", slug)
        .order("published_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (rows ?? []) as unknown as NewsRow[];
    },
  });

  return (
    <PublicLayout>
      <SectionTitle>{category?.name ?? "বিভাগ"}</SectionTitle>
      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : !data?.length ? (
        <p className="py-16 text-center text-muted-foreground">এই বিভাগে এখনো কোনো সংবাদ নেই।</p>
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
