import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount, useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/queries";

export const Route = createFileRoute("/representative/login")({
  head: () => ({
    meta: [
      { title: "প্রতিনিধি লগইন — MOHAKAL TELEVISION" },
      {
        name: "description",
        content: "MOHAKAL TELEVISION প্রতিনিধিদের জন্য সংবাদ পাঠানোর প্যানেলে প্রবেশ করুন।",
      },
      { property: "og:title", content: "প্রতিনিধি লগইন — MOHAKAL TELEVISION" },
      { property: "og:description", content: "প্রতিনিধি প্যানেলে প্রবেশ করুন।" },
    ],
  }),
  component: RepLogin,
});

const schema = z.object({
  email: z.string().trim().email({ message: "সঠিক ই-মেইল দিন" }).max(255),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }).max(72),
});

function RepLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, isRepresentative, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading || !session) return;
    if (isRepresentative) void navigate({ to: "/representative", replace: true });
    else if (isAdmin) void navigate({ to: "/admin", replace: true });
  }, [loading, session, isRepresentative, isAdmin, navigate]);

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
      if (account.profile?.status !== "ACTIVE") {
        await supabase.auth.signOut();
        toast.error("আপনার অ্যাকাউন্ট এখনো অনুমোদিত হয়নি বা স্থগিত আছে।");
        return;
      }
      if (!account.roles.includes("REPRESENTATIVE")) {
        await supabase.auth.signOut();
        toast.error("এই অ্যাকাউন্টটি প্রতিনিধি হিসেবে নিবন্ধিত নয়।");
        return;
      }
      await logActivity("LOGIN", "PANEL", undefined, "প্রতিনিধি প্যানেল");
      toast.success("সফলভাবে লগইন হয়েছে");
      void navigate({ to: "/representative", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "লগইন ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
        <h1 className="text-xl font-black">প্রতিনিধি লগইন</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          সংবাদ পাঠাতে আপনার প্রতিনিধি অ্যাকাউন্টে প্রবেশ করুন।
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">ই-মেইল</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "প্রবেশ করা হচ্ছে..." : "লগইন করুন"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          অ্যাকাউন্ট নেই?{" "}
          <Link to="/representative/register" className="font-semibold text-primary hover:underline">
            প্রতিনিধি হিসেবে আবেদন করুন
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}
