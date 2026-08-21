import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
};

export function ImageUpload({ value, onChange, folder = "news", label = "ছবি" }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("ছবি আপলোড হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে");
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
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          <img src={value} alt={label} className="max-h-56 w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => onChange(null)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 py-8 text-sm text-muted-foreground hover:border-primary/50"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {busy ? "আপলোড হচ্ছে..." : `${label} আপলোড করুন (সর্বোচ্চ ৫ MB)`}
        </button>
      )}
      {value ? (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          পরিবর্তন করুন
        </Button>
      ) : null}
    </div>
  );
}
