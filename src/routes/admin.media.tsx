import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, EmptyState, useAdminReady } from "@/components/AdminShell";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMedia, fetchMedia } from "@/lib/admin";
import { formatBnDate, toBn } from "@/lib/mtv";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "মিডিয়া লাইব্রেরি — MOHAKAL TELEVISION" },
      { name: "description", content: "ছবি আপলোড, অনুসন্ধান ও ব্যবস্থাপনা করুন।" },
      { property: "og:title", content: "মিডিয়া লাইব্রেরি — MOHAKAL TELEVISION" },
      { property: "og:description", content: "ছবি আপলোড ও ব্যবস্থাপনা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMedia,
});

function AdminMedia() {
  const enabled = useAdminReady();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-media", search],
    enabled,
    queryFn: () => fetchMedia(search),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-media"] });

  const remove = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) => deleteMedia(id, path),
    onSuccess: () => {
      toast.success("ছবি মুছে ফেলা হয়েছে");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "ব্যর্থ হয়েছে"),
  });

  return (
    <AdminShell title="মিডিয়া লাইব্রেরি">
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <p className="mb-2 text-sm font-bold">নতুন ছবি আপলোড (সর্বোচ্চ ৫ মেগাবাইট, JPG/PNG/WEBP/GIF)</p>
        <ImageUpload value={null} onChange={() => refresh()} folder="library" />
      </div>

      <div className="mt-4 max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ফাইলের নাম দিয়ে খুঁজুন"
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3 shadow-card sm:p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <EmptyState text="কোনো ছবি পাওয়া যায়নি" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((m) => (
              <div key={m.id} className="rounded border border-border p-2">
                <img
                  src={m.url}
                  alt={m.file_name}
                  loading="lazy"
                  className="h-32 w-full rounded object-cover"
                />
                <p className="mt-1 truncate text-xs font-medium">{m.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {toBn(Math.round((m.size_bytes ?? 0) / 1024))} কেবি • {formatBnDate(m.created_at, false)}
                </p>
                <div className="mt-1 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(m.url);
                      toast.success("লিংক কপি হয়েছে — সংবাদ ফর্মে ব্যবহার করুন");
                    }}
                  >
                    লিংক কপি
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    onClick={() => {
                      if (confirm("ছবিটি মুছে ফেলবেন?")) remove.mutate({ id: m.id, path: m.path });
                    }}
                  >
                    মুছুন
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
