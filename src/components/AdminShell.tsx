import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  MapPin,
  ScrollText,
  Settings,
  ShieldCheck,
  MessagesSquare,
  Users,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

export const ADMIN_NAV: NavItem[] = [
  { label: "ড্যাশবোর্ড", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "সংবাদ ব্যবস্থাপনা", to: "/admin/news", icon: FileText },
  { label: "প্রতিনিধি", to: "/admin/representatives", icon: Users },
  { label: "বিভাগ (ক্যাটাগরি)", to: "/admin/categories", icon: FolderTree },
  { label: "জেলা ও উপজেলা", to: "/admin/locations", icon: MapPin },
  { label: "মিডিয়া লাইব্রেরি", to: "/admin/media", icon: Image },
  { label: "ওয়েবসাইট সেটিংস", to: "/admin/settings", icon: Settings },
  { label: "অ্যাডমিন ও অনুমতি", to: "/admin/users", icon: ShieldCheck },
  { label: "মন্তব্য ও রিপোর্ট", to: "/admin/moderation", icon: MessagesSquare },
  { label: "অ্যাক্টিভিটি লগ", to: "/admin/logs", icon: ScrollText },
];

/** Guards an admin page and renders the shared admin chrome. */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { session, profile, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin || profile?.status !== "ACTIVE") {
      void navigate({ to: "/admin/login", replace: true });
    }
  }, [loading, session, isAdmin, profile?.status, navigate]);

  const allowed = !!session && isAdmin && profile?.status === "ACTIVE";

  return (
    <DashboardShell title={title} accent="অ্যাডমিন প্যানেল" items={ADMIN_NAV}>
      {loading ? (
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      ) : allowed ? (
        children
      ) : (
        <p className="text-sm text-muted-foreground">প্রবেশাধিকার যাচাই করা হচ্ছে...</p>
      )}
    </DashboardShell>
  );
}

export function useAdminReady() {
  const { session, profile, isAdmin, loading } = useAuth();
  return !loading && !!session && isAdmin && profile?.status === "ACTIVE";
}

export function EmptyState({ text = "কোনো তথ্য পাওয়া যায়নি" }: { text?: string }) {
  return (
    <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
