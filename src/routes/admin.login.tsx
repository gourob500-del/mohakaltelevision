import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount, useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/queries";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন লগইন — MOHAKAL TELEVISION" },
      { name: "description", content: "MOHAKAL TELEVISION অ্যাডমিন প্যানেলে প্রবেশ করুন।" },
      { property: "og:title", content: "অ্যাডমিন লগইন — MOHAKAL TELEVISION" },
      { property: "og:description", content: "MOHAKAL TELEVISION অ্যাডমিন প্যানেলে প্রবেশ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

const schema = z.object({
  email: z.string().trim().email({ message: "সঠিক ই-মেইল দিন" }).max(255),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }).max(72),
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading || !session) return;
    if (isAdmin) void navigate({ to: "/admin", replace: true });
  }, [loading, session, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      const account = await loadAccount(data.user.id);
      const admin = account.roles.includes("ADMIN") || account.roles.includes("SUPER_ADMIN");
      if (!admin || account.profile?.status !== "ACTIVE") {
        await supabase.auth.signOut();
        toast.error("এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।");
        return;
      }
      await logActivity("LOGIN", "PANEL", undefined, "অ্যাডমিন প্যানেল");
      toast.success("সফলভাবে লগইন হয়েছে");
      void navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "লগইন ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
        <h1 className="text-xl font-black">অ্যাডমিন লগইন</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          শুধুমাত্র অনুমোদিত অ্যাডমিন ও সুপার অ্যাডমিনের জন্য।
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">ই-মেইল</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">পাসওয়ার্ড</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "প্রবেশ করা হচ্ছে..." : "লগইন করুন"}
          </Button>
        </form>
      </div>
    </PublicLayout>
  );
}
