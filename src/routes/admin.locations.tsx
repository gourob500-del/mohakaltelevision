import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDistrict,
  createDivision,
  createUpazila,
  deleteLocation,
  toggleLocation,
} from "@/lib/admin";
import { fetchDistricts, fetchDivisions, fetchUpazilas } from "@/lib/queries";

export const Route = createFileRoute("/admin/locations")({
  head: () => ({
    meta: [
      { title: "জেলা ও উপজেলা ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { name: "description", content: "বিভাগ, জেলা ও উপজেলার তালিকা ব্যবস্থাপনা করুন।" },
      { property: "og:title", content: "জেলা ও উপজেলা ব্যবস্থাপনা — MOHAKAL TELEVISION" },
      { property: "og:description", content: "অবস্থান তালিকা ব্যবস্থাপনা করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLocations,
});

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function slugify(v: string) {
  return (
    v
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || `loc-${Math.random().toString(36).slice(2, 7)}`
  );
}

function AdminLocations() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [divName, setDivName] = useState("");
  const [distName, setDistName] = useState("");
  const [distCode, setDistCode] = useState("");
  const [upName, setUpName] = useState("");

  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions"],
    enabled,
    queryFn: fetchDivisions,
  });
  const { data: districts = [] } = useQuery({
    queryKey: ["districts", divisionId],
    enabled,
    queryFn: () => fetchDistricts(divisionId || null),
  });
  const { data: upazilas = [] } = useQuery({
    queryKey: ["upazilas", districtId],
    enabled: enabled && !!districtId,
    queryFn: () => fetchUpazilas(districtId || null),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["divisions"] });
    void qc.invalidateQueries({ queryKey: ["districts"] });
    void qc.invalidateQueries({ queryKey: ["upazilas"] });
  };

  const run = (fn: () => Promise<void>, success: string) =>
    fn()
      .then(() => {
        toast.success(success);
        refresh();
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"));

  const addDivision = useMutation({
    mutationFn: async () => {
      if (divName.trim().length < 2) throw new Error("বিভাগের নাম লিখুন");
      await createDivision({ name: divName.trim(), slug: slugify(divName) });
    },
    onSuccess: () => {
      toast.success("বিভাগ যুক্ত হয়েছে");
      setDivName("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const addDistrict = useMutation({
    mutationFn: async () => {
      if (!divisionId) throw new Error("প্রথমে বিভাগ নির্বাচন করুন");
      if (distName.trim().length < 2) throw new Error("জেলার নাম লিখুন");
      await createDistrict({
        name: distName.trim(),
        slug: slugify(distName),
        code: (distCode.trim() || slugify(distName).slice(0, 3)).toUpperCase(),
        division_id: divisionId,
      });
    },
    onSuccess: () => {
      toast.success("জেলা যুক্ত হয়েছে");
      setDistName("");
      setDistCode("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const addUpazila = useMutation({
    mutationFn: async () => {
      if (!districtId) throw new Error("প্রথমে জেলা নির্বাচন করুন");
      if (upName.trim().length < 2) throw new Error("উপজেলার নাম লিখুন");
      await createUpazila({ name: upName.trim(), slug: slugify(upName), district_id: districtId });
    },
    onSuccess: () => {
      toast.success("উপজেলা যুক্ত হয়েছে");
      setUpName("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  const list = (
    table: "divisions" | "districts" | "upazilas",
    rows: { id: string; name: string; is_active: boolean }[],
    empty: string,
  ) =>
    rows.length === 0 ? (
      <EmptyState text={empty} />
    ) : (
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
            <span className="text-xs text-muted-foreground">{r.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void run(() => toggleLocation(table, r.id, !r.is_active), "হালনাগাদ হয়েছে")}
            >
              {r.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("মুছে ফেলবেন?")) void run(() => deleteLocation(table, r.id), "মুছে ফেলা হয়েছে");
              }}
            >
              মুছুন
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <AdminShell title="জেলা ও উপজেলা ব্যবস্থাপনা">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">বিভাগ (অঞ্চল)</h2>
          <div className="mt-2 flex gap-2">
            <Input value={divName} onChange={(e) => setDivName(e.target.value)} placeholder="নাম" />
            <Button onClick={() => addDivision.mutate()} disabled={addDivision.isPending}>
              যুক্ত
            </Button>
          </div>
          <div className="mt-3">{list("divisions", divisions, "কোনো বিভাগ পাওয়া যায়নি")}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">জেলা</h2>
          <Label htmlFor="div" className="mt-2 block text-xs">
            বিভাগ নির্বাচন
          </Label>
          <select
            id="div"
            className={selectClass}
            value={divisionId}
            onChange={(e) => {
              setDivisionId(e.target.value);
              setDistrictId("");
            }}
          >
            <option value="">সব বিভাগ</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <Input value={distName} onChange={(e) => setDistName(e.target.value)} placeholder="জেলার নাম" />
            <Input
              className="w-24"
              value={distCode}
              onChange={(e) => setDistCode(e.target.value)}
              placeholder="কোড"
            />
            <Button onClick={() => addDistrict.mutate()} disabled={addDistrict.isPending}>
              যুক্ত
            </Button>
          </div>
          <div className="mt-3 max-h-96 overflow-y-auto">
            {list("districts", districts, "কোনো জেলা পাওয়া যায়নি")}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold">উপজেলা</h2>
          <Label htmlFor="dist" className="mt-2 block text-xs">
            জেলা নির্বাচন
          </Label>
          <select
            id="dist"
            className={selectClass}
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
          >
            <option value="">জেলা নির্বাচন করুন</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="উপজেলার নাম" />
            <Button onClick={() => addUpazila.mutate()} disabled={addUpazila.isPending}>
              যুক্ত
            </Button>
          </div>
          <div className="mt-3 max-h-96 overflow-y-auto">
            {districtId ? (
              list("upazilas", upazilas, "কোনো উপজেলা পাওয়া যায়নি")
            ) : (
              <EmptyState text="জেলা নির্বাচন করুন" />
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
