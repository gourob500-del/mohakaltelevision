import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { logActivity } from "@/lib/queries";
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, profile, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin || profile?.status !== "ACTIVE") {
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [loading, session, isAdmin, profile?.status, navigate]);

  const enabled = !!session && isAdmin;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-news"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, slug, status, views, created_at, published_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "PUBLISHED" | "REJECTED" }) => {
      const payload: Record<string, unknown> = { status };
      if (status === "PUBLISHED") payload.published_at = new Date().toISOString();
      const { error } = await supabase.from("news").update(payload).eq("id", id);
      if (error) throw error;
      await logActivity(status === "PUBLISHED" ? "PUBLISH" : "REJECT", "NEWS", id);
    },
    onSuccess: () => {
      toast.success("সংবাদের অবস্থা হালনাগাদ হয়েছে");
      void qc.invalidateQueries({ queryKey: ["admin-news"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "হালনাগাদ ব্যর্থ হয়েছে"),
  });

  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const pending = rows.filter((r) => r.status === "PENDING" || r.status === "APPROVED");

  return (
    <DashboardShell
      title="অ্যাডমিন ড্যাশবোর্ড"
      accent="অ্যাডমিন প্যানেল"
      items={[{ label: "ড্যাশবোর্ড", to: "/admin", icon: LayoutDashboard, exact: true }]}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="মোট সংবাদ" value={toBn(rows.length)} tone="primary" />
        <StatCard label="প্রকাশিত" value={toBn(count("PUBLISHED"))} />
        <StatCard label="অপেক্ষমাণ" value={toBn(count("PENDING"))} />
        <StatCard label="খসড়া" value={toBn(count("DRAFT"))} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card">
        <h2 className="text-base font-bold">অনুমোদনের অপেক্ষায়</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">অপেক্ষমাণ কোনো সংবাদ নেই।</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status as NewsStatus] ?? ""}`}
                >
                  {STATUS_BN[r.status as NewsStatus] ?? r.status}
                </span>
                <span className="text-xs text-muted-foreground">{formatBnDate(r.created_at)}</span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: r.id, status: "PUBLISHED" })}
                  >
                    প্রকাশ করুন
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: r.id, status: "REJECTED" })}
                  >
                    বাতিল
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
