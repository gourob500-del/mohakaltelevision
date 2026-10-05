import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchEpaperNews } from "@/lib/queries";
import { formatBnDate } from "@/lib/mtv";

function dhakaToday() {
  return new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
}

export const Route = createFileRoute("/epaper")({
  validateSearch: (s: Record<string, unknown>) => ({
    date: typeof s["date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["date"]) ? (s["date"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ই-পেপার — মহাকাল টেলিভিশন" },
      { name: "description", content: "মহাকাল টেলিভিশনের দৈনিক ই-পেপার: দিনের সব প্রকাশিত সংবাদ এক পাতায়।" },
      { property: "og:title", content: "ই-পেপার — মহাকাল টেলিভিশন" },
      { property: "og:description", content: "দিনের সব প্রকাশিত সংবাদ সংবাদপত্রের মতো এক পাতায় পড়ুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EpaperPage,
});

function strip(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function EpaperPage() {
  const { date: param } = Route.useSearch();
  const date = param ?? dhakaToday();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({ queryKey: ["epaper", date], queryFn: () => fetchEpaperNews(date) });
  const [lead, ...rest] = data;

  return (
    <PublicLayout>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-black">ই-পেপার</h1>
        <Input type="date" className="w-auto" value={date} max={dhakaToday()} onChange={(e) => void navigate({ to: "/epaper", search: { date: e.target.value || undefined } })} />
        <Button variant="outline" onClick={() => window.print()}><Printer /> প্রিন্ট / PDF</Button>
      </div>
      <div className="rounded-lg border-2 border-foreground bg-card p-3 sm:p-6">
        <header className="border-b-4 border-double border-foreground pb-3 text-center">
          <p className="text-3xl font-black tracking-wide text-primary sm:text-5xl">MOHAKAL TELEVISION</p>
          <p className="mt-1 text-sm text-muted-foreground">দৈনিক ই-পেপার · {formatBnDate(`${date}T06:00:00Z`)}</p>
        </header>
        {isLoading ? <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে...</p> : !lead ? (
          <p className="py-10 text-center text-muted-foreground">এই তারিখে কোনো প্রকাশিত সংবাদ নেই।</p>
        ) : (
          <>
            <article className="border-b border-border py-4">
              <Link to="/news/$slug" params={{ slug: lead.slug }}>
                <h2 className="text-2xl font-black leading-snug sm:text-4xl">{lead.title}</h2>
              </Link>
              <Byline n={lead} />
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {lead.featured_image ? <img src={lead.featured_image} alt={lead.title} className="w-full rounded border border-border object-cover" /> : null}
                <p className="text-justify text-sm leading-relaxed">{strip(lead.content).slice(0, 900)}…</p>
              </div>
            </article>
            <AdSlot placement="in-article" className="my-4" />
            <div className="mt-4 gap-6 sm:columns-2 lg:columns-3">
              {rest.map((n) => (
                <article key={n.id} className="mb-5 break-inside-avoid border-b border-border pb-4">
                  <Link to="/news/$slug" params={{ slug: n.slug }}>
                    <h3 className="text-lg font-bold leading-snug">{n.title}</h3>
                  </Link>
                  <Byline n={n} />
                  {n.featured_image ? <img src={n.featured_image} alt={n.title} loading="lazy" className="mt-2 w-full rounded border border-border object-cover" /> : null}
                  <p className="mt-2 text-justify text-sm leading-relaxed">{strip(n.content).slice(0, 350)}…</p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}

function Byline({ n }: { n: { reporter_name: string | null; reporter_designation: string | null; district: { name: string } | null } }) {
  const t = [n.reporter_name, n.reporter_designation, n.district?.name].filter(Boolean).join(" · ");
  return t ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{t}</p> : null;
}
