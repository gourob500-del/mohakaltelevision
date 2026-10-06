import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PenSquare } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { PhotoCardButton } from "@/components/PhotoCardDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { REP_NAV } from "@/lib/rep-nav";
import { fetchMyNews } from "@/lib/news";
import { STATUS_BN, STATUS_CLASS, formatBnDate, toBn, type NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/representative/news/")({
  head: () => ({
    meta: [
      { title: "আমার সংবাদ — MOHAKAL TELEVISION" },
      { name: "description", content: "আপনার পাঠানো সংবাদের তালিকা ও অবস্থা দেখুন।" },
      { property: "og:title", content: "আমার সংবাদ — MOHAKAL TELEVISION" },
      { property: "og:description", content: "আপনার পাঠানো সংবাদের তালিকা ও অবস্থা দেখুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyNewsPage,
});

const FILTERS: { key: NewsStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "সব" },
  { key: "DRAFT", label: "খসড়া" },
  { key: "PENDING", label: "অপেক্ষমাণ" },
  { key: "CORRECTION_REQUIRED", label: "সংশোধন প্রয়োজন" },
  { key: "PUBLISHED", label: "প্রকাশিত" },
  { key: "REJECTED", label: "বাতিল" },
];

function MyNewsPage() {
  const navigate = useNavigate();
  const { session, profile, loading, isRepresentative, isAdmin } = useAuth();
  const [status, setStatus] = useState<NewsStatus | "ALL">("ALL");

  useEffect(() => {
    if (loading) return;
    if (!session || !(isRepresentative || isAdmin) || profile?.status !== "ACTIVE") {
      void navigate({ to: "/representative/login", replace: true });
    }
  }, [loading, session, isRepresentative, isAdmin, profile?.status, navigate]);

  const userId = session?.user?.id;
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-news", userId, status],
    enabled: !!userId,
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return fetchMyNews(userId, status);
    },
  });

  return (
    <DashboardShell title="আমার সংবাদ" accent="প্রতিনিধি প্যানেল" items={REP_NAV}>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              status === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <Button asChild size="sm" className="ml-auto">
          <Link to="/representative/news/new">
            <PenSquare className="mr-2 h-4 w-4" /> নতুন সংবাদ
          </Link>
        </Button>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-card">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">এখনো কোনো সংবাদ নেই। নতুন সংবাদ পাঠান।</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status] ?? ""}`}
                >
                  {STATUS_BN[r.status] ?? r.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.category?.name ?? "—"} · {formatBnDate(r.published_at ?? r.created_at)} ·{" "}
                  {toBn(r.views)} পাঠক
                </span>
                {r.status === "PUBLISHED" ? (
                  <div className="flex w-full flex-wrap gap-2">
                    <PhotoCardButton news={r} />
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/news/$slug" params={{ slug: r.slug }}>সংবাদ দেখুন</Link>
                    </Button>
                  </div>
                ) : null}
                {r.review_note ? (
                  <p className="w-full text-xs text-destructive">রিভিউ মন্তব্য: {r.review_note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
