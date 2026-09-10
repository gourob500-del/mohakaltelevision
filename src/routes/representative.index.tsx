import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PenSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { REP_NAV } from "@/lib/rep-nav";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { STATUS_BN, STATUS_CLASS, formatBnDate, toBn, type NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/representative/")({
  head: () => ({
    meta: [
      { title: "প্রতিনিধি ড্যাশবোর্ড — MOHAKAL TELEVISION" },
      { name: "description", content: "আপনার পাঠানো সংবাদের অবস্থা ও পরিসংখ্যান দেখুন।" },
      { property: "og:title", content: "প্রতিনিধি ড্যাশবোর্ড — MOHAKAL TELEVISION" },
      { property: "og:description", content: "আপনার পাঠানো সংবাদের অবস্থা ও পরিসংখ্যান দেখুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RepDashboard,
});

function RepDashboard() {
  const navigate = useNavigate();
  const { session, profile, loading, isRepresentative } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !isRepresentative || profile?.status !== "ACTIVE") {
      void navigate({ to: "/representative/login", replace: true });
    }
  }, [loading, session, isRepresentative, profile?.status, navigate]);

  const userId = session?.user?.id;
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["rep-news", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, status, views, created_at, published_at")
        .eq("author_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const views = rows.reduce((sum, r) => sum + (r.views ?? 0), 0);

  return (
    <DashboardShell
      title="প্রতিনিধি ড্যাশবোর্ড"
      accent="প্রতিনিধি প্যানেল"
      items={[{ label: "ড্যাশবোর্ড", to: "/representative", icon: LayoutDashboard, exact: true }]}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="মোট সংবাদ" value={toBn(rows.length)} tone="primary" />
        <StatCard label="প্রকাশিত" value={toBn(count("PUBLISHED"))} />
        <StatCard label="অপেক্ষমাণ" value={toBn(count("PENDING"))} />
        <StatCard label="মোট পাঠক" value={toBn(views)} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card">
        <h2 className="text-base font-bold">আমার সংবাদ</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো সংবাদ পাঠানো হয়নি।</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status as NewsStatus] ?? ""}`}
                >
                  {STATUS_BN[r.status as NewsStatus] ?? r.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatBnDate(r.published_at ?? r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
