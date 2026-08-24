import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/queries";

const LINK_CLASS =
  "shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold hover:text-primary";
const ACTIVE = { className: "text-primary border-primary" };

/** Horizontally scrollable category bar shown on every breakpoint. */
export function CategoryNav() {
  const { data: categories } = useQuery({
    queryKey: ["categories", "nav"],
    queryFn: () => fetchCategories(true),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div
      className="no-scrollbar mx-auto flex max-w-6xl items-stretch gap-1 overflow-x-auto px-3"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
    >
      <Link to="/" activeOptions={{ exact: true }} activeProps={ACTIVE} className={LINK_CLASS}>
        প্রচ্ছদ
      </Link>
      <Link to="/latest" activeProps={ACTIVE} className={LINK_CLASS}>
        সর্বশেষ
      </Link>
      {(categories ?? []).map((c) => (
        <Link
          key={c.id}
          to="/category/$slug"
          params={{ slug: c.slug }}
          activeProps={ACTIVE}
          className={LINK_CLASS}
        >
          {c.name}
        </Link>
      ))}
      <Link to="/district" activeProps={ACTIVE} className={LINK_CLASS}>
        জেলা
      </Link>
    </div>
  );
}
