import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, useAdminReady } from "@/components/AdminShell";
import { NewsForm } from "@/components/NewsForm";
import { useAuth } from "@/hooks/useAuth";
import { saveNews } from "@/lib/news";
import type { NewsFormValues } from "@/lib/news";
import type { NewsStatus } from "@/lib/mtv";

export const Route = createFileRoute("/admin/news/new")({
  head: () => ({
    meta: [
      { title: "নতুন সংবাদ যোগ করুন — MOHAKAL TELEVISION" },
      { name: "description", content: "অ্যাডমিন হিসেবে নতুন সংবাদ লিখুন, ছবি যোগ করুন এবং সরাসরি প্রকাশ করুন।" },
      { property: "og:title", content: "নতুন সংবাদ যোগ করুন — MOHAKAL TELEVISION" },
      { property: "og:description", content: "অ্যাডমিন হিসেবে নতুন সংবাদ লিখুন ও প্রকাশ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNewNewsPage,
});

function AdminNewNewsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, profile } = useAuth();
  const ready = useAdminReady();

  const save = useMutation({
    mutationFn: ({ values, status }: { values: NewsFormValues; status: NewsStatus }) =>
      saveNews({
        values,
        status,
        authorId: session!.user.id,
        isAdmin: true,
        ...(profile?.full_name ? { authorName: profile.full_name } : {}),
      }),
    onSuccess: (_id, vars) => {
      toast.success(
        vars.status === "DRAFT"
          ? "খসড়া সংরক্ষিত হয়েছে"
          : vars.status === "PUBLISHED"
            ? "সংবাদ প্রকাশিত হয়েছে"
            : "সংবাদ সংরক্ষিত হয়েছে",
      );
      void qc.invalidateQueries({ queryKey: ["admin-news"] });
      void qc.invalidateQueries({ queryKey: ["admin-stats"] });
      void navigate({ to: "/admin/news", search: { status: "ALL" } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে"),
  });

  return (
    <AdminShell title="নতুন সংবাদ যোগ করুন">
      {ready ? (
        <NewsForm
          canPublish
          submitting={save.isPending}
          onSave={(values, status) => save.mutate({ values, status })}
        />
      ) : null}
    </AdminShell>
  );
}
