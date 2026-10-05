import { useQuery } from "@tanstack/react-query";
import { fetchActiveAds } from "@/lib/ads";

export function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const { data } = useQuery({ queryKey: ["ads", placement], queryFn: () => fetchActiveAds(placement) });
  if (!data?.length) return null;
  return (
    <div className={`no-print space-y-3 ${className}`}>
      {data.map((ad) => {
        const img = <img src={ad.image_url} alt={ad.title} loading="lazy" className="w-full rounded-md border border-border object-cover" />;
        return (
          <div key={ad.id}>
            <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">বিজ্ঞাপন</span>
            {ad.link_url ? (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored">{img}</a>
            ) : img}
          </div>
        );
      })}
    </div>
  );
}
