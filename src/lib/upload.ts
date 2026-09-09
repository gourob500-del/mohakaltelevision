import { supabase } from "@/integrations/supabase/client";
import { applyWatermark, getWatermarkConfig } from "@/lib/watermark";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "শুধুমাত্র JPG, PNG, WEBP বা GIF ছবি আপলোড করা যাবে।";
  }
  if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    return "ফাইলের এক্সটেনশন সঠিক নয়।";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "ছবির সর্বোচ্চ আকার ৫ মেগাবাইট।";
  }
  return null;
}

function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Uploads an image to the media bucket and records it in the media library. */
export async function uploadImage(file: File, folder = "news"): Promise<string> {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);

  const dims = await readDimensions(file);
  if (!dims) throw new Error("ফাইলটি বৈধ ছবি নয়।");
  if (dims.width < 100 || dims.height < 100) {
    throw new Error("ছবির প্রস্থ ও উচ্চতা কমপক্ষে ১০০ পিক্সেল হতে হবে।");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("লগইন প্রয়োজন।");

  // Burn the site watermark into the stored file so downloads keep it too.
  let outFile = file;
  try {
    outFile = await applyWatermark(file, await getWatermarkConfig());
  } catch {
    outFile = file;
  }

  const ext = (outFile.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, outFile, { contentType: outFile.type, upsert: false });
  if (error) throw error;

  const url = `/api/public/media/${path}`;
  await supabase.from("media").insert({
    url,
    path,
    file_name: outFile.name,
    mime_type: outFile.type,
    size_bytes: outFile.size,
    uploaded_by: auth.user.id,
  });

  return url;
}
