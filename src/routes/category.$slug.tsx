import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, type NewsRow } from "@/lib/queries";

export const Route = createFileRoute("/category/$slug")({
  staticData: { sitemap: true },
  loader: async ({ params }) => {
    try {
      const { data } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("slug", params.slug)
        .maybeSingle();
      return { category: data ?? null };
    } catch {
      return { category: null };
    }
  },
  head: ({ params, loaderData }) => {
    const cat = loaderData?.category;
    const title = cat ? `${cat.name} — মহাকাল টেলিভিশন` : "বিভাগ — মহাকাল টেলিভিশন";
    const description = cat
      ? `মহাকাল টেলিভিশনের ${cat.name} বিভাগের সর্বশেষ সংবাদ পড়ুন।`
      : "মহাকাল টেলিভিশনের বিভাগভিত্তিক সংবাদ।";
    const url = `https://mohakaltelevision.lovable.app/category/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        ...(cat ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
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
      <SectionTitle as="h1">{category?.name ?? "বিভাগ"}</SectionTitle>
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
