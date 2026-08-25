import { supabase } from "@/integrations/supabase/client";

export type NotificationRow = {
  id: string;
  user_id: string | null;
  for_admins: boolean;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

/** Creates a notification for all admins (used when a representative submits news). */
export async function notifyAdmins(title: string, body: string, entityId?: string) {
  await supabase.from("notifications").insert({
    user_id: null,
    for_admins: true,
    title,
    body,
    entity_type: "NEWS",
    entity_id: entityId ?? null,
  } as never);
}

/** Creates a notification for one user (used for admin decisions on a submission). */
export async function notifyUser(userId: string, title: string, body: string, entityId?: string) {
  if (!userId) return;
  await supabase.from("notifications").insert({
    user_id: userId,
    for_admins: false,
    title,
    body,
    entity_type: "NEWS",
    entity_id: entityId ?? null,
  } as never);
}

export async function fetchNotifications(limit = 30) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true } as never).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase.from("notifications").update({ is_read: true } as never).in("id", ids);
  if (error) throw error;
}

export const STATUS_NOTICE: Record<string, { title: string; body: string }> = {
  APPROVED: {
    title: "আপনার সংবাদ অনুমোদিত হয়েছে",
    body: "সম্পাদক আপনার সংবাদটি অনুমোদন করেছেন।",
  },
  REJECTED: {
    title: "আপনার সংবাদ বাতিল হয়েছে",
    body: "সম্পাদক আপনার সংবাদটি বাতিল করেছেন।",
  },
  CORRECTION_REQUIRED: {
    title: "সংশোধনের অনুরোধ",
    body: "আপনার সংবাদে সংশোধন প্রয়োজন। মন্তব্য দেখে সম্পাদনা করে আবার জমা দিন।",
  },
  PUBLISHED: {
    title: "আপনার সংবাদ প্রকাশিত হয়েছে",
    body: "আপনার সংবাদটি ওয়েবসাইটে প্রকাশ করা হয়েছে।",
  },
};
