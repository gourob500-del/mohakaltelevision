import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/lib/queries";

export type NavItem = { label: string; to: string; icon: LucideIcon; exact?: boolean };

export function DashboardShell({
  title,
  items,
  children,
  accent = "প্রতিনিধি প্যানেল",
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    await logActivity("LOGOUT");
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact ?? false }}
          activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      <button
        onClick={handleSignOut}
        className="mt-2 flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent"
      >
        <LogOut className="h-4 w-4" /> লগআউট
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-3 lg:flex">
        <Link to="/" className="mb-4 block px-2">
          <span className="text-lg font-black text-sidebar-foreground">MOHAKAL TV</span>
          <span className="block text-xs text-sidebar-foreground/60">{accent}</span>
        </Link>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card px-3 py-3 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="মেনু"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
          <span className="max-w-24 truncate text-right text-xs text-muted-foreground sm:max-w-48 sm:text-sm">
            {profile?.full_name || ""}
          </span>
        </header>

        {open ? <div className="max-h-[calc(100dvh-3.75rem)] overflow-y-auto bg-sidebar p-3 lg:hidden">{nav}</div> : null}

        <div className="min-w-0 flex-1 p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-lg border border-border p-4 shadow-card ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-card"}`}
    >
      <p
        className={`text-xs ${tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
