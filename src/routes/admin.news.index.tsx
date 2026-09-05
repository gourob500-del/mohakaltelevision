import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteNews, fetchAdminNews, fetchNewsFilterOptions, setNewsStatus } from "@/lib/admin";
import { STATUS_BN, STATUS_CLASS, formatBnDate, toBn, type NewsStatus } from "@/lib/mtv";

type Filter = NewsStatus | "ALL";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "সব সংবাদ" },
  { value: "PENDING", label: "অপেক্ষমাণ" },
  { value: "APPROVED", label: "অনুমোদিত" },
  { value: "PUBLISHED", label: "প্রকাশিত" },
  { value: "DRAFT", label: "খসড়া" },
  { value: "REJECTED", label: "বাতিল" },
  { value: "CORRECTION_REQUIRED", label: "সংশোধন প্রয়োজন" },
];

export const Route = createFileRoute("/admin/news/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: (typeof search['status'] === "string" ? (search['status'] as Filter) : "ALL") as Filter,
  }),
  head: () => ({
    meta: [
      { title: "সংবাদ ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { name: "description", content: "সব সংবাদ দেখুন, অনুমোদন, প্রকাশ ও সম্পাদনা করুন।" },
      { property: "og:title", content: "সংবাদ ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "সব সংবাদ দেখুন, অনুমোদন, প্রকাশ ও সম্পাদনা করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNews,
});

function AdminNews() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [districtId, setDistrictId] = useState("ALL");
  const [authorId, setAuthorId] = useState("ALL");
  const enabled = useAdminReady();
  const qc = useQueryClient();

  const { data: options } = useQuery({
    queryKey: ["admin-news-filter-options"],
    enabled,
    queryFn: fetchNewsFilterOptions,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-news", status, search, categoryId, districtId, authorId],
    enabled,
    queryFn: () =>
      fetchAdminNews(status, search, {
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        districtId: districtId === "ALL" ? undefined : districtId,
        authorId: authorId === "ALL" ? undefined : authorId,
      }),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-news"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const change = useMutation({
    mutationFn: ({ id, next }: { id: string; next: NewsStatus }) => setNewsStatus(id, next),
    onSuccess: () => {
      toast.success("অবস্থা হালনাগাদ হয়েছে");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => {
      toast.success("সংবাদ মুছে ফেলা হয়েছে");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  return (
    <AdminShell title="সংবাদ ব্যবস্থাপনা">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          মোট {toBn(rows.length)}টি সংবাদ দেখানো হচ্ছে
        </p>
        <Button asChild>
          <Link to="/representative/news/new">
            <Plus className="h-4 w-4" /> নতুন সংবাদ লিখুন
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => void navigate({ search: { status: f.value } })}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              status === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="শিরোনাম দিয়ে খুঁজুন"
        />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="ক্যাটাগরি" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব ক্যাটাগরি</SelectItem>
            {(options?.categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={districtId} onValueChange={setDistrictId}>
          <SelectTrigger>
            <SelectValue placeholder="জেলা" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব জেলা</SelectItem>
            {(options?.districts ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={authorId} onValueChange={setAuthorId}>
          <SelectTrigger>
            <SelectValue placeholder="প্রতিবেদক" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সব প্রতিবেদক</SelectItem>
            {(options?.reporters ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <EmptyState text="কোনো নিউজ পাওয়া যায়নি" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/admin/news/$id"
                    params={{ id: r.id }}
                    className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary"
                  >
                    {r.title}
                  </Link>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status] ?? ""}`}
                  >
                    {STATUS_BN[r.status] ?? r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.category?.name ? `${r.category.name} • ` : ""}
                  {r.district?.name ? `${r.district.name} • ` : ""}
                  {formatBnDate(r.created_at)} • পাঠক {toBn(r.views)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/news/$id" params={{ id: r.id }}>
                      দেখুন / সম্পাদনা
                    </Link>
                  </Button>
                  {r.status !== "PUBLISHED" ? (
                    <Button
                      size="sm"
                      disabled={change.isPending}
                      onClick={() => change.mutate({ id: r.id, next: "PUBLISHED" })}
                    >
                      প্রকাশ
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={change.isPending}
                      onClick={() => change.mutate({ id: r.id, next: "DRAFT" })}
                    >
                      প্রকাশ প্রত্যাহার
                    </Button>
                  )}
                  {r.status === "PENDING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={change.isPending}
                      onClick={() => change.mutate({ id: r.id, next: "APPROVED" })}
                    >
                      অনুমোদন
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={change.isPending}
                    onClick={() => change.mutate({ id: r.id, next: "CORRECTION_REQUIRED" })}
                  >
                    সংশোধন চান
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={change.isPending}
                    onClick={() => change.mutate({ id: r.id, next: "REJECTED" })}
                  >
                    বাতিল
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm("এই সংবাদটি মুছে ফেলবেন?")) remove.mutate(r.id);
                    }}
                  >
                    মুছুন
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
