import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { NewsCard } from "@/components/NewsCard";
import { NEWS_SELECT, fetchDistricts, type NewsRow } from "@/lib/queries";

const schema = z.object({ d: z.string().uuid().optional() });

export const Route = createFileRoute("/district")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "জেলার সংবাদ — MOHAKAL TELEVISION" },
      { name: "description", content: "বাংলাদেশের ৬৪ জেলার সর্বশেষ সংবাদ MOHAKAL TELEVISION-এ।" },
      { property: "og:title", content: "জেলার সংবাদ — MOHAKAL TELEVISION" },
      {
        property: "og:description",
        content: "বাংলাদেশের ৬৪ জেলার সর্বশেষ সংবাদ MOHAKAL TELEVISION-এ।",
      },
    ],
  }),
  component: DistrictPage,
});

function DistrictPage() {
  const { d } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: districts } = useQuery({ queryKey: ["districts"], queryFn: () => fetchDistricts() });

  const { data, isLoading } = useQuery({
    queryKey: ["district-news-page", d ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("news")
        .select(NEWS_SELECT)
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false })
        .limit(40);
      q = d ? q.eq("district_id", d) : q.not("district_id", "is", null);
      const { data: rows, error } = await q;
      if (error) throw error;
      return (rows ?? []) as unknown as NewsRow[];
    },
  });

  return (
    <PublicLayout>
      <SectionTitle
        action={
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={d ?? ""}
            onChange={(e) =>
              void navigate({ search: e.target.value ? { d: e.target.value } : {} })
            }
          >
            <option value="">সব জেলা</option>
            {(districts ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        }
      >
        জেলার সংবাদ
      </SectionTitle>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে...</p>
      ) : !data?.length ? (
        <p className="py-16 text-center text-muted-foreground">এই জেলায় এখনো কোনো সংবাদ নেই।</p>
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
