import { Link } from "@tanstack/react-router";
import type { NewsRow } from "@/lib/queries";

export function BreakingTicker({ items }: { items: NewsRow[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="mb-5 flex items-stretch overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex shrink-0 items-center bg-primary px-3 text-sm font-bold text-primary-foreground">
        ব্রেকিং
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track whitespace-nowrap py-2.5">
          {loop.map((n, i) => (
            <Link
              key={`${n.id}-${i}`}
              to="/news/$slug"
              params={{ slug: n.slug }}
              className="mx-5 text-sm font-medium hover:text-primary"
            >
              • {n.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
