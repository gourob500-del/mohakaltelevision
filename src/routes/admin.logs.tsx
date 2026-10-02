import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { ACTION_BN, fetchActivityLogs } from "@/lib/admin";
import { formatBnDate } from "@/lib/mtv";

export const Route = createFileRoute("/admin/logs")({ head: () => ({ meta: [{ title: "অ্যাক্টিভিটি লগ — MOHAKAL TELEVISION" }, { name: "description", content: "অ্যাডমিন ও প্রতিনিধিদের গুরুত্বপূর্ণ কার্যক্রম।" }, { property: "og:title", content: "অ্যাক্টিভিটি লগ" }, { property: "og:description", content: "সিস্টেম কার্যক্রমের তালিকা।" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: LogsPage });

function LogsPage() {
  const enabled = useAdminReady();
  const [term, setTerm] = useState("");
  const [action, setAction] = useState("ALL");
  const [date, setDate] = useState("");
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["activity-logs"], enabled, queryFn: () => fetchActivityLogs(300) });
  const actions = [...new Set(rows.map((row) => row.action))];
  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${row.actor_name ?? ""} ${row.details ?? ""} ${row.entity_type ?? ""}`.toLowerCase();
    return (!term || text.includes(term.toLowerCase())) && (action === "ALL" || row.action === action) && (!date || row.created_at.slice(0, 10) === date);
  }), [rows, term, action, date]);
  return <AdminShell title="অ্যাক্টিভিটি লগ"><div className="mb-4 grid gap-2 sm:grid-cols-3"><Input placeholder="ব্যবহারকারী বা বিবরণ খুঁজুন" value={term} onChange={(e) => setTerm(e.target.value)} /><select className="h-9 rounded border border-input bg-background px-3 text-sm" value={action} onChange={(e) => setAction(e.target.value)}><option value="ALL">সব কার্যক্রম</option>{actions.map((item) => <option key={item} value={item}>{ACTION_BN[item] ?? item}</option>)}</select><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="rounded border border-border bg-card p-4">{isLoading ? <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p> : filtered.length === 0 ? <EmptyState text="কোনো কার্যক্রম পাওয়া যায়নি" /> : <ul className="divide-y divide-border">{filtered.map((row) => <li key={row.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold">{ACTION_BN[row.action] ?? row.action}</p><time className="text-xs text-muted-foreground">{formatBnDate(row.created_at)}</time></div><p className="mt-1 text-xs text-muted-foreground">{row.actor_name || "সিস্টেম"}{row.entity_type ? ` · ${row.entity_type}` : ""}{row.details ? ` · ${row.details}` : ""}</p></li>)}</ul>}</div></AdminShell>;
}