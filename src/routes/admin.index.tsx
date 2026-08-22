import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { StatCard } from "@/components/DashboardShell";
import { fetchAdminNews, fetchAdminStats } from "@/lib/admin";
import { STATUS_BN, STATUS_CLASS, formatBnDate, toBn, type NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — MOHAKAL TELEVISION" },
      { name: "description", content: "সংবাদ অনুমোদন, প্রকাশ ও পরিসংখ্যান ব্যবস্থাপনা।" },
      { property: "og:title", content: "অ্যাডমিন ড্যাশবোর্ড — MOHAKAL TELEVISION" },
      { property: "og:description", content: "সংবাদ অনুমোদন, প্রকাশ ও পরিসংখ্যান ব্যবস্থাপনা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const enabled = useAdminReady();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled,
    queryFn: fetchAdminStats,
  });

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["admin-news", "PENDING"],
    enabled,
    queryFn: () => fetchAdminNews("PENDING"),
  });

  return (
    <AdminShell title="অ্যাডমিন ড্যাশবোর্ড">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="মোট সংবাদ" value={toBn(stats?.total ?? 0)} tone="primary" />
        <StatCard label="অপেক্ষমাণ" value={toBn(stats?.pending ?? 0)} />
        <StatCard label="প্রকাশিত" value={toBn(stats?.published ?? 0)} />
        <StatCard label="খসড়া" value={toBn(stats?.draft ?? 0)} />
        <StatCard label="বাতিল" value={toBn(stats?.rejected ?? 0)} />
        <StatCard label="সংশোধন প্রয়োজন" value={toBn(stats?.correction ?? 0)} />
        <StatCard label="মোট প্রতিনিধি" value={toBn(stats?.representatives ?? 0)} />
        <StatCard label="সক্রিয় অ্যাকাউন্ট" value={toBn(stats?.activeAccounts ?? 0)} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">অনুমোদনের অপেক্ষায়</h2>
          <Link to="/admin/news" search={{ status: "PENDING" }} className="text-sm text-primary">
            সব দেখুন
          </Link>
        </div>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : pending.length === 0 ? (
          <div className="mt-3">
            <EmptyState text="কোনো নিউজ পাওয়া যায়নি" />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {pending.slice(0, 10).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <Link
                  to="/admin/news/$id"
                  params={{ id: r.id }}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary"
                >
                  {r.title}
                </Link>
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status as NewsStatus] ?? ""}`}
                >
                  {STATUS_BN[r.status as NewsStatus] ?? r.status}
                </span>
                <span className="text-xs text-muted-foreground">{formatBnDate(r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
