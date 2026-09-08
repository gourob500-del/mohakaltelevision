import { Link } from "@tanstack/react-router";
import { Eye, MapPin, User } from "lucide-react";
import type { NewsRow } from "@/lib/queries";
import { formatBnDate, toBn } from "@/lib/mtv";

type Props = { news: NewsRow; variant?: "default" | "lead" | "row" };

export function NewsCard({ news, variant = "default" }: Props) {
  const place = [news.upazila?.name, news.district?.name].filter(Boolean).join(", ");

  if (variant === "row") {
    return (
      <Link
        to="/news/$slug"
        params={{ slug: news.slug }}
        className="group flex gap-3 border-b border-border py-3 last:border-0"
      >
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted">
          {news.featured_image ? (
            <img
              src={news.featured_image}
              alt={news.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">
            {news.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatBnDate(news.published_at, false)}
          </p>
        </div>
      </Link>
    );
  }

  const lead = variant === "lead";

  return (
    <Link
      to="/news/$slug"
      params={{ slug: news.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-colors hover:border-primary/40"
    >
      <div
        className={`relative w-full overflow-hidden bg-muted ${lead ? "aspect-[16/9]" : "aspect-[4/3]"}`}
      >
        {news.featured_image ? (
          <img
            src={news.featured_image}
            alt={news.caption || news.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            MOHAKAL TELEVISION
          </div>
        )}
        {news.category ? (
          <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {news.category.name}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <h3
          className={`line-clamp-3 font-bold group-hover:text-primary ${lead ? "text-xl" : "text-base"}`}
        >
          {news.title}
        </h3>
        {lead && news.summary ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{news.summary}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {place ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {place}
            </span>
          ) : null}
          {news.reporter_name ? (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {news.reporter_name}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {toBn(news.views)}
          </span>
          <span>{formatBnDate(news.published_at, false)}</span>
        </div>
      </div>
    </Link>
  );
}
