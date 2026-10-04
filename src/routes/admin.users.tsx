import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { createAdminUser } from "@/lib/admin-users.functions";
import { fetchAdminAccounts, setUserRole } from "@/lib/admin-users";
import { PERMISSION_MODULES, setPermissions } from "@/lib/permissions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "অ্যাডমিন ও অনুমতি — MOHAKAL TELEVISION" }, { name: "description", content: "অ্যাডমিন অ্যাকাউন্ট ও অনুমতি ব্যবস্থাপনা।" }, { property: "og:title", content: "অ্যাডমিন ও অনুমতি" }, { property: "og:description", content: "অ্যাডমিন অ্যাকাউন্ট ও অনুমতি ব্যবস্থাপনা।" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

const blank = { full_name: "", email: "", password: "", mobile: "", designation: "", role: "ADMIN" as "ADMIN" | "SUPER_ADMIN", modules: [] as string[] };

function ModuleChecks({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{PERMISSION_MODULES.map((module) => <label key={module.key} className="flex min-w-0 items-center gap-2 rounded border border-border p-2 text-sm"><Checkbox className="shrink-0" checked={value.includes(module.key)} onCheckedChange={(checked) => onChange(checked ? [...value, module.key] : value.filter((item) => item !== module.key))} /><span className="min-w-0 break-words">{module.label}</span></label>)}</div>;
}

function AdminUsers() {
  const enabled = useAdminReady();
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const create = useServerFn(createAdminUser);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["admin-accounts"], enabled: enabled && isSuperAdmin, queryFn: fetchAdminAccounts });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-accounts"] });
  const add = useMutation({ mutationFn: () => create({ data: form }), onSuccess: () => { toast.success("নতুন অ্যাডমিন তৈরি হয়েছে"); setForm(blank); setShow(false); refresh(); }, onError: (e) => toast.error(e instanceof Error ? e.message : "তৈরি করা যায়নি") });
  const save = useMutation({ mutationFn: async (userId: string) => { await setUserRole(userId, role); await setPermissions(userId, modules); }, onSuccess: () => { toast.success("অনুমতি সংরক্ষিত হয়েছে"); setEditing(null); refresh(); }, onError: (e) => toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ") });

  return <AdminShell title="অ্যাডমিন ও অনুমতি">
    {!isSuperAdmin ? <EmptyState text="শুধু সুপার অ্যাডমিন এই অংশ ব্যবহার করতে পারবেন" /> : <>
      <div className="mb-3 flex justify-end"><Button onClick={() => setShow((value) => !value)}>{show ? "বাতিল" : "নতুন অ্যাডমিন"}</Button></div>
      {show ? <div className="mb-4 grid gap-3 rounded border border-border bg-card p-4 sm:grid-cols-2">
        <div><Label>পূর্ণ নাম</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>ই-মেইল</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>পাসওয়ার্ড</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div><Label>মোবাইল</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
        <div><Label>পদবি</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
        <div><Label>ভূমিকা</Label><select className="h-10 w-full rounded border border-input bg-background px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "SUPER_ADMIN" })}><option value="ADMIN">অ্যাডমিন</option><option value="SUPER_ADMIN">সুপার অ্যাডমিন</option></select></div>
        {form.role === "ADMIN" ? <div className="sm:col-span-2"><Label className="mb-2 block">অনুমতি</Label><ModuleChecks value={form.modules} onChange={(value) => setForm({ ...form, modules: value })} /></div> : null}
        <div className="sm:col-span-2"><Button disabled={add.isPending} onClick={() => add.mutate()}>{add.isPending ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}</Button></div>
      </div> : null}
      <div className="min-w-0 rounded border border-border bg-card p-3 sm:p-4">{isLoading ? <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p> : rows.length === 0 ? <EmptyState text="কোনো অ্যাডমিন পাওয়া যায়নি" /> : <ul className="divide-y divide-border">{rows.map((account) => <li key={account.id} className="min-w-0 py-3"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><div className="min-w-0"><p className="truncate font-semibold">{account.full_name}</p><p className="break-all text-xs text-muted-foreground">{account.email} · {account.roles.join(", ")}</p></div><Button className="shrink-0" size="sm" variant="outline" onClick={() => { setEditing(editing === account.id ? null : account.id); setModules(account.modules); setRole(account.roles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : "ADMIN"); }}>সম্পাদনা</Button></div>{editing === account.id ? <div className="mt-3 min-w-0 space-y-3 rounded border border-border p-3"><select className="h-10 w-full max-w-xs rounded border border-input bg-background px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "SUPER_ADMIN")}><option value="ADMIN">অ্যাডমিন</option><option value="SUPER_ADMIN">সুপার অ্যাডমিন</option></select>{role === "ADMIN" ? <ModuleChecks value={modules} onChange={setModules} /> : null}<Button size="sm" disabled={save.isPending} onClick={() => save.mutate(account.id)}>সংরক্ষণ</Button></div> : null}</li>)}</ul>}</div>
    </>}
  </AdminShell>;
}