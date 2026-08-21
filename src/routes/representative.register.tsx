import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchDistricts, fetchUpazilas } from "@/lib/queries";

export const Route = createFileRoute("/representative/register")({
  head: () => ({
    meta: [
      { title: "প্রতিনিধি নিবন্ধন — MOHAKAL TELEVISION" },
      {
        name: "description",
        content: "MOHAKAL TELEVISION-এর জেলা ও উপজেলা প্রতিনিধি হিসেবে যুক্ত হতে আবেদন করুন।",
      },
      { property: "og:title", content: "প্রতিনিধি নিবন্ধন — MOHAKAL TELEVISION" },
      { property: "og:description", content: "প্রতিনিধি হিসেবে যুক্ত হতে আবেদন করুন।" },
    ],
  }),
  component: RepRegister,
});

const schema = z.object({
  full_name: z.string().trim().min(3, "পূর্ণ নাম লিখুন").max(100),
  email: z.string().trim().email("সঠিক ই-মেইল দিন").max(255),
  mobile: z.string().trim().regex(/^01[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর").max(72),
  designation: z.string().trim().max(100).optional().or(z.literal("")),
  district_id: z.string().uuid("জেলা নির্বাচন করুন"),
  upazila_id: z.string().uuid().optional().or(z.literal("")),
});

function RepRegister() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile: "",
    password: "",
    designation: "",
    district_id: "",
    upazila_id: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { data: districts } = useQuery({ queryKey: ["districts"], queryFn: () => fetchDistricts() });
  const { data: upazilas } = useQuery({
    queryKey: ["upazilas", form.district_id],
    enabled: !!form.district_id,
    queryFn: () => fetchUpazilas(form.district_id),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/representative/login`,
          data: {
            full_name: parsed.data.full_name,
            mobile: parsed.data.mobile,
            designation: parsed.data.designation || null,
            district_id: parsed.data.district_id,
            upazila_id: parsed.data.upazila_id || null,
            requested_role: "REPRESENTATIVE",
          },
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "নিবন্ধন ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-card">
          <h1 className="text-xl font-black">আবেদন জমা হয়েছে</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            আপনার ই-মেইলে পাঠানো নিশ্চিতকরণ লিংকে ক্লিক করুন। এরপর অ্যাডমিন আপনার অ্যাকাউন্ট
            অনুমোদন করলে আপনি প্রতিনিধি প্যানেলে প্রবেশ করতে পারবেন।
          </p>
          <Link
            to="/representative/login"
            className="mt-4 inline-block font-semibold text-primary hover:underline"
          >
            লগইন পৃষ্ঠায় যান
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 shadow-card">
        <h1 className="text-xl font-black">প্রতিনিধি নিবন্ধন</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          আবেদন অনুমোদনের পর আপনি সংবাদ পাঠাতে পারবেন।
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="full_name">পূর্ণ নাম *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">ই-মেইল *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">মোবাইল *</Label>
            <Input
              id="mobile"
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">পাসওয়ার্ড *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="designation">পদবি</Label>
            <Input
              id="designation"
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="যেমন: উপজেলা প্রতিনিধি"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">জেলা *</Label>
            <select
              id="district"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.district_id}
              onChange={(e) => {
                set("district_id", e.target.value);
                set("upazila_id", "");
              }}
              required
            >
              <option value="">নির্বাচন করুন</option>
              {(districts ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="upazila">উপজেলা</Label>
            <select
              id="upazila"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.upazila_id}
              onChange={(e) => set("upazila_id", e.target.value)}
              disabled={!form.district_id}
            >
              <option value="">নির্বাচন করুন</option>
              {(upazilas ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
            </Button>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}
