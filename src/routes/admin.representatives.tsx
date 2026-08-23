import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchRepresentatives, setAccountStatus, updateProfile } from "@/lib/admin";
import { createRepresentative } from "@/lib/admin.functions";
import { fetchDistricts, fetchUpazilas } from "@/lib/queries";
import { ACCOUNT_STATUS_BN, ROLE_BN, formatBnDate } from "@/lib/mtv";

export const Route = createFileRoute("/admin/representatives")({
  head: () => ({
    meta: [
      { title: "প্রতিনিধি ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { name: "description", content: "প্রতিনিধি যুক্ত করুন, সম্পাদনা, সক্রিয় ও স্থগিত করুন।" },
      { property: "og:title", content: "প্রতিনিধি ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "প্রতিনিধিদের অ্যাকাউন্ট ব্যবস্থাপনা করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReps,
});

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

const schema = z.object({
  full_name: z.string().trim().min(3, "পূর্ণ নাম লিখুন").max(100),
  email: z.string().trim().email("সঠিক ই-মেইল দিন").max(255),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর").max(72),
  mobile: z.string().trim().max(20),
  designation: z.string().trim().max(100),
  district_id: z.string(),
  upazila_id: z.string(),
});

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  mobile: "",
  designation: "",
  district_id: "",
  upazila_id: "",
};

function AdminReps() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", designation: "", mobile: "" });
  const createRep = useServerFn(createRepresentative);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-reps"],
    enabled,
    queryFn: fetchRepresentatives,
  });
  const { data: districts = [] } = useQuery({ queryKey: ["districts", null], queryFn: () => fetchDistricts() });
  const { data: upazilas = [] } = useQuery({
    queryKey: ["upazilas", form.district_id],
    queryFn: () => fetchUpazilas(form.district_id || null),
    enabled: !!form.district_id,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-reps"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      return createRep({
        data: {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          mobile: form.mobile,
          designation: form.designation,
          district_id: form.district_id || null,
          upazila_id: form.upazila_id || null,
          status: "ACTIVE" as const,
        },
      });
    },
    onSuccess: () => {
      toast.success("প্রতিনিধি যুক্ত হয়েছে");
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "যুক্ত করা যায়নি"),
  });

  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "ACTIVE" | "SUSPENDED" }) =>
      setAccountStatus(id, next),
    onSuccess: () => {
      toast.success("অবস্থা হালনাগাদ হয়েছে");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const saveEdit = useMutation({
    mutationFn: (id: string) =>
      updateProfile(id, {
        full_name: editForm.full_name,
        designation: editForm.designation || null,
        mobile: editForm.mobile || null,
      }),
    onSuccess: () => {
      toast.success("সংরক্ষিত হয়েছে");
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  return (
    <AdminShell title="প্রতিনিধি ব্যবস্থাপনা">
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "বাতিল" : "নতুন প্রতিনিধি যুক্ত করুন"}
        </Button>
      </div>

      {showForm ? (
        <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 shadow-card sm:grid-cols-2">
          <div>
            <Label htmlFor="name">পূর্ণ নাম</Label>
            <Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">ই-মেইল</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="mobile">মোবাইল</Label>
            <Input id="mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="designation">পদবি</Label>
            <Input id="designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="district">জেলা</Label>
            <select
              id="district"
              className={selectClass}
              value={form.district_id}
              onChange={(e) => setForm({ ...form, district_id: e.target.value, upazila_id: "" })}
            >
              <option value="">নির্বাচন করুন</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="upazila">উপজেলা</Label>
            <select
              id="upazila"
              className={selectClass}
              value={form.upazila_id}
              onChange={(e) => setForm({ ...form, upazila_id: e.target.value })}
            >
              <option value="">নির্বাচন করুন</option>
              {upazilas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => add.mutate()} disabled={add.isPending}>
              {add.isPending ? "যুক্ত হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <EmptyState text="কোনো প্রতিনিধি পাওয়া যায়নি" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {p.full_name.slice(0, 1) || "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.full_name || "নামহীন"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.representative_id ?? "—"} • {p.designation ?? "—"} • {p.email ?? "—"} • {p.mobile ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      যোগদান: {formatBnDate(p.joining_date, false)} •{" "}
                      {(p.roles ?? []).map((r) => ROLE_BN[r] ?? r).join(", ")}
                    </p>
                  </div>
                  <span className="rounded border border-border px-2 py-0.5 text-xs font-semibold">
                    {ACCOUNT_STATUS_BN[p.status] ?? p.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" onClick={() => status.mutate({ id: p.id, next: "SUSPENDED" })}>
                      স্থগিত করুন
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => status.mutate({ id: p.id, next: "ACTIVE" })}>
                      সক্রিয় করুন
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(editing === p.id ? null : p.id);
                      setEditForm({
                        full_name: p.full_name,
                        designation: p.designation ?? "",
                        mobile: p.mobile ?? "",
                      });
                    }}
                  >
                    সম্পাদনা
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/news" search={{ status: "ALL" }}>
                      সংবাদ দেখুন
                    </Link>
                  </Button>
                </div>
                {editing === p.id ? (
                  <div className="mt-2 grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="নাম"
                    />
                    <Input
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      placeholder="পদবি"
                    />
                    <Input
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      placeholder="মোবাইল"
                    />
                    <Button size="sm" disabled={saveEdit.isPending} onClick={() => saveEdit.mutate(p.id)}>
                      সংরক্ষণ
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
