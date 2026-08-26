import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
};

export function GalleryUpload({ value, onChange, folder = "news", max = 8 }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const room = max - value.length;
    if (room <= 0) {
      toast.error(`সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে।`);
      return;
    }
    setBusy(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, room)) {
        try {
          added.push(await uploadImage(file, folder));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "একটি ছবি আপলোড হয়নি");
        }
      }
      if (added.length) {
        onChange([...value, ...added]);
        toast.success("ছবি যুক্ত হয়েছে");
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
        }}
      />
      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url) => (
            <div key={url} className="relative overflow-hidden rounded-md border border-border">
              <img src={url} alt="সংবাদের ছবি" loading="lazy" className="h-24 w-full object-cover" />
              <button
                type="button"
                aria-label="ছবি সরান"
                className="absolute right-1 top-1 rounded bg-destructive p-1 text-destructive-foreground"
                onClick={() => onChange(value.filter((u) => u !== url))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">এখনো কোনো অতিরিক্ত ছবি যোগ করা হয়নি।</p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || value.length >= max}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
        {busy ? "আপলোড হচ্ছে..." : `ছবি যোগ করুন (${value.length}/${max})`}
      </Button>
    </div>
  );
}
