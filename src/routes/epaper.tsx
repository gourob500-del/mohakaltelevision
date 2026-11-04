import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_PAGES, DEFAULT_TEMPLATE, type EpaperItem, type EpaperPageData, type TemplateConfig } from "@/lib/epaper-layout";
import {
  addDaysLocal,
  ensureEpaperFont,
  fetchIssue,
  fetchRecentIssues,
  PAPER_SIZES,
  todayDhaka,
  toBn,
  type PaperSize,
} from "@/lib/epaper-viewer";
import { formatBnDate } from "@/lib/mtv";

const LOGICAL_WIDTH = 820; // px a page is laid out at on screen
const MM_PER_PX = 3.7795; // CSS mm unit

export const Route = createFileRoute("/epaper")({ staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>) => ({
    date: typeof s["date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["date"]) ? (s["date"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ই-পেপার — দৈনিক মহাকাল" },
      {
        name: "description",
        content: "দৈনিক মহাকালের ই-পেপার: প্রতিদিনের প্রকাশিত সংবাদ সংবাদপত্রের মতো সর্বোচ্চ ৪ পৃষ্ঠায়। PDF ডাউনলোড ও প্রিন্ট করুন।",
      },
      { property: "og:title", content: "ই-পেপার — দৈনিক মহাকাল" },
      { property: "og:description", content: "প্রতিদিনের প্রকাশিত সংবাদ সংবাদপত্রের মতো ৪ পৃষ্ঠায় পড়ুন, প্রিন্ট বা PDF নিন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EpaperPage,
});

/** Falls back to defaults so a malformed stored template can never break the viewer. */
function safeTemplate(raw: unknown): TemplateConfig & { logo_url?: string | null } {
  const tpl: TemplateConfig & { logo_url?: string | null } = { ...DEFAULT_TEMPLATE, logo_url: null };
  if (raw && typeof raw === "object") {
    const r = raw as Partial<TemplateConfig> & { logo_url?: string | null };
    if (r.columns && typeof r.columns === "object") tpl.columns = { ...tpl.columns, ...r.columns };
    if (r.capacity && typeof r.capacity === "object") tpl.capacity = { ...tpl.capacity, ...r.capacity };
    if (typeof r.headlineSize === "number" && r.headlineSize > 0) tpl.headlineSize = r.headlineSize;
    if (typeof r.bodySize === "number" && r.bodySize > 0) tpl.bodySize = r.bodySize;
    if (typeof r.accent === "string") tpl.accent = r.accent;
    if (typeof r.ink === "string") tpl.ink = r.ink;
    if (typeof r.paper === "string") tpl.paper = r.paper;
    if (typeof r.margin === "number" && r.margin >= 0) tpl.margin = r.margin;
    if (typeof r.logo_url === "string") tpl.logo_url = r.logo_url;
  }
  return tpl;
}

const KIND_COLUMN_KEY: Record<EpaperPageData["kind"], string> = { front: "1", general: "2", local: "3", ads: "4" };

const BN_FONT = '"SolaimanLipi", "Noto Sans Bengali", sans-serif';

function ItemBlock({ item, tpl, zoom, lead }: { item: EpaperItem; tpl: TemplateConfig; zoom: number; lead: boolean }) {
  const headlinePx = (lead ? tpl.headlineSize : Math.round(tpl.headlineSize * 0.55)) * zoom;
  const bodyPx = tpl.bodySize * zoom * (lead ? 1.05 : 0.92);
  const imageHeight = item.image ? (lead ? 250 : 150) * zoom : 0;
  return (
    <article className="break-inside-avoid" style={lead ? { columnSpan: "all" } : undefined}>
      <h3 className="font-bold leading-snug" style={{ fontSize: `${headlinePx}px`, fontFamily: BN_FONT }}>
        <Link to="/news/$slug" params={{ slug: item.slug }} className="hover:underline">
          {item.title}
        </Link>
      </h3>
      {item.byline ? <p className="mt-0.5 text-[0.72em] italic opacity-75">{item.byline}</p> : null}
      {item.image ? (
        <figure className="mt-1">
          <img
            src={item.image}
            alt={item.caption || item.title}
            loading="lazy"
            className="w-full border border-border/40 object-cover"
            style={{ height: `${imageHeight}px` }}
          />
          {item.caption ? <figcaption className="mt-0.5 text-[0.68em] opacity-70">{item.caption}</figcaption> : null}
        </figure>
      ) : null}
      {item.excerpt ? (
        <p className="mt-1 leading-relaxed" style={{ fontSize: `${bodyPx}px`, textAlign: "justify" }}>
          {item.excerpt}
          {item.truncated ? (
            <>
              {" "}
              <Link to="/news/$slug" params={{ slug: item.slug }} className="font-semibold underline">
                বিস্তারিত…
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}

function AdBlock({ ad, zoom, wide }: { ad: EpaperPageData["ads"][number]; zoom: number; wide: boolean }) {
  const h = (ad.size === "small" ? 70 : ad.size === "medium" ? 110 : 160) * zoom;
  const floatStyle: CSSProperties | undefined = wide
    ? undefined
    : {
        float: ad.position === "right" ? "right" : "left",
        width: `${ad.size === "small" ? 30 : ad.size === "medium" ? 42 : 50}%`,
        margin: "0.35em 0.6em",
      };
  return (
    <figure className="break-inside-avoid border border-dashed border-primary/50 bg-muted/30 p-1" style={floatStyle}>
      <a href={ad.link_url || "#"} target={ad.link_url ? "_blank" : undefined} rel="noopener noreferrer">
        <img src={ad.image_url} alt={ad.title} loading="lazy" className="w-full object-contain" style={{ height: `${h}px` }} />
      </a>
      <figcaption className="text-center text-[0.6em] opacity-60">
        বিজ্ঞাপন{ad.organization ? ` · ${ad.organization}` : ""}
      </figcaption>
    </figure>
  );
}

/** One newspaper page. Used both on screen and inside the print container. */
function PageCanvas({
  page,
  tpl,
  issueDate,
  zoom,
}: {
  page: EpaperPageData;
  tpl: TemplateConfig & { logo_url?: string | null };
  issueDate: string;
  zoom: number;
}) {
  const cols = tpl.columns[KIND_COLUMN_KEY[page.kind]] ?? 3;
  const margin = tpl.margin * zoom;
  const fullAd = page.ads.find((a) => a.position === "full");
  const topAds = page.ads.filter((a) => a.position === "top" || a.position === "middle");
  const bottomAds = page.ads.filter((a) => a.position === "bottom");
  const floatAds = page.ads.filter((a) => a.position === "left" || a.position === "right");

  return (
    <div
      className="epaper-page relative mx-auto border border-border/50 shadow-sm"
      style={{
        background: tpl.paper,
        color: tpl.ink,
        padding: `${margin}px`,
        width: zoom >= 1 ? "100%" : `${Math.round(LOGICAL_WIDTH * zoom)}px`,
        maxWidth: "100%",
      }}
      data-page={page.number}
    >
      <header className="mb-2 flex flex-wrap items-end justify-between gap-1 border-b-2 pb-1" style={{ borderColor: tpl.accent }}>
        <div className="flex items-center gap-2">
          {tpl.logo_url ? (
            <img src={tpl.logo_url} alt="মহাকাল টেলিভিশন" className="h-9 w-auto object-contain sm:h-12" />
          ) : (
            <span className="text-xl font-black tracking-wide sm:text-2xl" style={{ color: tpl.accent, fontFamily: BN_FONT }}>
              দৈনিক মহাকাল
            </span>
          )}
        </div>
        <div className="text-right text-[0.7em] leading-tight opacity-80" style={{ fontFamily: BN_FONT }}>
          <p>{formatBnDate(`${issueDate}T06:00:00Z`, false)}</p>
          <p>
            {page.title} · {toBn(page.number)} পৃষ্ঠা
          </p>
        </div>
      </header>

      {fullAd ? (
        <a href={fullAd.link_url || "#"} target={fullAd.link_url ? "_blank" : undefined} rel="noopener noreferrer">
          <img src={fullAd.image_url} alt={fullAd.title} className="w-full object-contain" />
        </a>
      ) : (
        <>
          {topAds.map((ad) => (
            <AdBlock key={ad.id} ad={ad} zoom={zoom} wide />
          ))}
          <div
            className="epaper-columns"
            style={{
              columnCount: cols,
              columnGap: `${Math.max(12, margin * 0.8)}px`,
              columnRule: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
            }}
          >
            {floatAds.map((ad) => (
              <AdBlock key={ad.id} ad={ad} zoom={zoom} wide={false} />
            ))}
            {page.items.map((item, i) => (
              <ItemBlock key={item.newsId} item={item} tpl={tpl} zoom={zoom} lead={i === 0 && page.number === 1} />
            ))}
          </div>
          {bottomAds.map((ad) => (
            <AdBlock key={ad.id} ad={ad} zoom={zoom} wide />
          ))}
        </>
      )}
      <footer
        className="mt-2 border-t pt-1 text-center text-[0.65em] opacity-70"
        style={{ borderColor: tpl.accent, fontFamily: BN_FONT }}
      >
        মহাকাল টেলিভিশন · mohakaltelevision.lovable.app
      </footer>
    </div>
  );
}

function EpaperPage() {
  const { date: param } = Route.useSearch();
  const date = param ?? todayDhaka();
  const navigate = useNavigate();
  const [fontReady, setFontReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [paper, setPaper] = useState<PaperSize>("A4");

  useEffect(() => {
    ensureEpaperFont()
      .then(() => setFontReady(true))
      .catch(() => setFontReady(true)); // fallback Bengali font still renders
  }, []);

  useEffect(() => setPageIndex(0), [date]);

  const issueQ = useQuery({ queryKey: ["epaper-issue", date], queryFn: () => fetchIssue(date) });
  const archiveQ = useQuery({ queryKey: ["epaper-archive"], queryFn: () => fetchRecentIssues(), staleTime: 5 * 60 * 1000 });

  const issue = issueQ.data ?? null;
  const tpl = useMemo(() => safeTemplate(issue?.template), [issue?.template]);
  const pages = issue?.pages ?? [];
  const page = pages[Math.min(pageIndex, Math.max(pages.length - 1, 0))] ?? null;

  const navigateDate = (d: string) =>
    void navigate({ to: "/epaper", search: { date: d === todayDhaka() ? undefined : d } });

  const Paper = PAPER_SIZES[paper];

  return (
    <PublicLayout>
      <style>{`@media print { @page { size: ${Paper.width}mm ${Paper.height}mm; margin: 0; } }`}</style>

      <div className="no-print mx-auto max-w-5xl px-3 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-black sm:text-2xl">ই-পেপার</h1>
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))} aria-label="ছোট করুন">
            <ZoomOut /> ছোট
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))} aria-label="বড় করুন">
            <ZoomIn /> বড়
          </Button>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={paper}
            onChange={(e) => setPaper(e.target.value as PaperSize)}
            aria-label="পেপার সাইজ"
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
          </select>
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> প্রিন্ট / PDF
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate(addDaysLocal(date, -1))} aria-label="আগের দিন">
            <ChevronLeft /> আগের দিন
          </Button>
          <Input
            type="date"
            className="h-9 w-auto text-sm"
            value={date}
            max={todayDhaka()}
            onChange={(e) => e.target.value && navigateDate(e.target.value)}
            aria-label="তারিখ"
          />
          <Button variant="outline" size="sm" onClick={() => navigateDate(addDaysLocal(date, 1))} aria-label="পরের দিন">
            পরের দিন <ChevronRight />
          </Button>
          <p className="text-sm text-muted-foreground">
            <CalendarDays className="mr-1 inline h-4 w-4" />
            {formatBnDate(`${date}T06:00:00Z`, false)}
            {issue ? ` · ${toBn(issue.news_count)} সংবাদ · ${toBn(issue.page_count)} পৃষ্ঠা` : ""}
          </p>
        </div>

        {issueQ.isLoading || !fontReady ? (
          <p className="py-12 text-center text-muted-foreground">ই-পেপার লোড হচ্ছে…</p>
        ) : !issue || pages.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">এই তারিখের ই-পেপার পাওয়া যায়নি।</p>
            {(archiveQ.data ?? []).length > 0 ? (
              <div className="mx-auto mt-4 max-w-sm">
                <p className="mb-2 text-sm font-semibold">সাম্প্রতিক সংখ্যা</p>
                <ul className="grid gap-1">
                  {(archiveQ.data ?? []).slice(0, 10).map((row) => (
                    <li key={row.issue_date}>
                      <button
                        className="w-full rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => navigateDate(row.issue_date)}
                      >
                        {formatBnDate(`${row.issue_date}T06:00:00Z`, false)} · {toBn(row.page_count)} পৃষ্ঠা
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* screen reading view */}
            <div className="mt-4 print:hidden">
              {page ? <PageCanvas page={page} tpl={tpl} issueDate={date} zoom={zoom} /> : null}
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={pageIndex <= 0} onClick={() => setPageIndex((i) => i - 1)}>
                  <ChevronLeft /> আগের পৃষ্ঠা
                </Button>
                <span className="text-sm text-muted-foreground">
                  {toBn(pageIndex + 1)} / {toBn(pages.length)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((i) => i + 1)}
                >
                  পরের পৃষ্ঠা <ChevronRight />
                </Button>
              </div>
              {/* thumbnails */}
              <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
                {pages.map((p, i) => (
                  <button
                    key={p.number}
                    className={`shrink-0 overflow-hidden rounded border-2 ${i === pageIndex ? "border-primary" : "border-border"}`}
                    onClick={() => setPageIndex(i)}
                    aria-label={`${toBn(p.number)} পৃষ্ঠা`}
                  >
                    <div className="pointer-events-none bg-white" style={{ zoom: 0.22 } as CSSProperties}>
                      <PageCanvas page={p} tpl={tpl} issueDate={date} zoom={1} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* print / PDF view: every page, exact paper size, hard cap of 4 pages */}
            <div className="hidden print:block">
              {pages.slice(0, MAX_PAGES).map((p) => (
                <div key={p.number} style={{ breakAfter: "page", width: `${Paper.width}mm` }}>
                  <div style={{ zoom: (Paper.width * MM_PER_PX) / LOGICAL_WIDTH } as CSSProperties}>
                    <PageCanvas page={p} tpl={tpl} issueDate={date} zoom={1} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
