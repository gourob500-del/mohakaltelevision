import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategory,
  deleteCategory,
  fetchAllCategories,
  updateCategory,
} from "@/lib/admin";
import { toBn } from "@/lib/mtv";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "বিভাগ ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { name: "description", content: "সংবাদ বিভাগ যুক্ত, সম্পাদনা ও নিষ্ক্রিয় করুন।" },
      { property: "og:title", content: "বিভাগ ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "সংবাদ বিভাগ ব্যবস্থাপনা করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategories,
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || `cat-${Math.random().toString(36).slice(2, 7)}`
  );
}

function AdminCategories() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    enabled,
    queryFn: fetchAllCategories,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: ["categories"] });
    void qc.invalidateQueries({ queryKey: ["categories-all-admin"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("বিভাগের নাম লিখুন");
      await createCategory({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        sort_order: rows.length + 1,
      });
    },
    onSuccess: () => {
      toast.success("বিভাগ যুক্ত হয়েছে");
      setName("");
      setSlug("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateCategory(id, { is_active }),
    onSuccess: () => {
      toast.success("হালনাগাদ হয়েছে");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const rename = useMutation({
    mutationFn: (id: string) => updateCategory(id, { name: editName.trim() }),
    onSuccess: () => {
      toast.success("সংরক্ষিত হয়েছে");
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "মুছে ফেলা যায়নি"),
  });

  return (
    <AdminShell title="বিভাগ ব্যবস্থাপনা">
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-3">
        <div>
          <Label htmlFor="cname">বিভাগের নাম</Label>
          <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cslug">স্লাগ (ইংরেজি)</Label>
          <Input id="cslug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" />
        </div>
        <div className="flex items-end">
          <Button onClick={() => add.mutate()} disabled={add.isPending}>
            যুক্ত করুন
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <EmptyState text="কোনো বিভাগ পাওয়া যায়নি" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                {editing === c.id ? (
                  <Input
                    className="max-w-xs"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {c.name}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{c.slug} • ক্রম {toBn(c.sort_order)}
                    </span>
                  </span>
                )}
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${c.is_active ? "border-status-published/30 text-status-published" : "border-border text-muted-foreground"}`}
                >
                  {c.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
                {editing === c.id ? (
                  <Button size="sm" disabled={rename.isPending} onClick={() => rename.mutate(c.id)}>
                    সংরক্ষণ
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(c.id);
                      setEditName(c.name);
                    }}
                  >
                    সম্পাদনা
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggle.mutate({ id: c.id, is_active: !c.is_active })}
                >
                  {c.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"} করুন
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("বিভাগটি মুছে ফেলবেন?")) remove.mutate(c.id);
                  }}
                >
                  মুছুন
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
