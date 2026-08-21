import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, Shield, UserRound, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NAV_LINKS } from "@/lib/mtv";
import { fetchSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setSearchOpen(false);
    setOpen(false);
    void navigate({ to: "/search", search: { q: term.trim() } });
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary text-sm font-black text-primary-foreground">
              MTV
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black leading-tight tracking-tight sm:text-xl">
                {settings?.site_name ?? "MOHAKAL TELEVISION"}
              </span>
              <span className="block truncate text-[11px] text-ink-foreground/70">
                {settings?.tagline ?? "আপনার আয়োজন, আমাদের সংবাদ"}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="অনুসন্ধান"
              className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link
              to="/representative/login"
              className="hidden items-center gap-1 rounded border border-white/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 md:inline-flex"
            >
              <UserRound className="h-4 w-4" /> প্রতিনিধি লগইন
            </Link>
            <Link
              to="/admin/login"
              className="hidden items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-brand-dark md:inline-flex"
            >
              <Shield className="h-4 w-4" /> অ্যাডমিন লগইন
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="মেনু"
              className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground lg:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {searchOpen ? (
          <form onSubmit={submit} className="mx-auto max-w-6xl px-3 pb-3">
            <div className="flex gap-2">
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="সংবাদ খুঁজুন..."
                className="bg-background text-foreground"
              />
              <Button type="submit">খুঁজুন</Button>
            </div>
          </form>
        ) : null}
      </div>

      <nav className="border-b border-border bg-card shadow-card">
        <div className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-3 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-primary border-primary" }}
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {open ? (
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-px bg-border">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="bg-card px-3 py-2.5 text-sm font-semibold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border bg-card p-3">
              <Link to="/representative/login" onClick={() => setOpen(false)} className="flex-1">
                <Button variant="outline" className="w-full">
                  প্রতিনিধি লগইন
                </Button>
              </Link>
              <Link to="/admin/login" onClick={() => setOpen(false)} className="flex-1">
                <Button className="w-full">অ্যাডমিন লগইন</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
