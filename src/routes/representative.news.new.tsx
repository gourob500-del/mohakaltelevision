import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { NewsForm } from "@/components/NewsForm";
import { useAuth } from "@/hooks/useAuth";
import { REP_NAV, prefillFromProfile } from "@/lib/rep-nav";
import { saveNews } from "@/lib/news";
import type { NewsFormValues } from "@/lib/news";
import type { NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/representative/news/new")({
  head: () => ({
    meta: [
      { title: "নতুন সংবাদ পাঠান — MOHAKAL TELEVISION" },
      { name: "description", content: "প্রতিনিধি হিসেবে নতুন সংবাদ লিখুন, ছবি যোগ করুন এবং রিভিউয়ের জন্য পাঠান।" },
      { property: "og:title", content: "নতুন সংবাদ পাঠান — MOHAKAL TELEVISION" },
      { property: "og:description", content: "নতুন সংবাদ লিখে রিভিউয়ের জন্য পাঠান।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewNewsPage,
});

function NewNewsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, profile, roles, loading, isRepresentative, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !(isRepresentative || isAdmin) || profile?.status !== "ACTIVE") {
      void navigate({ to: "/representative/login", replace: true });
    }
  }, [loading, session, isRepresentative, isAdmin, profile?.status, navigate, roles]);

  const canPublish = isAdmin || Boolean((profile as { can_publish?: boolean } | null)?.can_publish);

  const save = useMutation({
    mutationFn: ({ values, status }: { values: NewsFormValues; status: NewsStatus }) =>
      saveNews({
        values,
        status,
        authorId: session!.user.id,
        isAdmin,
        ...(profile?.full_name ? { authorName: profile.full_name } : {}),
      }),
    onSuccess: (_id, vars) => {
      void qc.invalidateQueries({ queryKey: ["my-news"] });
      toast.success(
        vars.status === "DRAFT"
          ? "খসড়া সংরক্ষিত হয়েছে"
          : vars.status === "PUBLISHED"
            ? "সংবাদ প্রকাশিত হয়েছে"
            : "সংবাদ রিভিউয়ের জন্য পাঠানো হয়েছে",
      );
      void qc.invalidateQueries({ queryKey: ["rep-news"] });
      void navigate({ to: "/representative/news" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে"),
  });

  return (
    <DashboardShell title="নতুন সংবাদ" accent="প্রতিনিধি প্যানেল" items={REP_NAV}>
      <NewsForm
        key={profile?.id ?? "new"}
        initial={prefillFromProfile(profile)}
        canPublish={canPublish}
        submitting={save.isPending}
        onSave={(values, status) => save.mutate({ values, status })}
      />
    </DashboardShell>
  );
}
