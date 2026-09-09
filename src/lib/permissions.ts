import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PERMISSION_MODULES = [
  { key: "news", label: "সংবাদ ব্যবস্থাপনা" },
  { key: "representatives", label: "প্রতিনিধি" },
  { key: "ads", label: "বিজ্ঞাপন" },
  { key: "epaper", label: "ই-পেপার" },
  { key: "categories", label: "বিভাগ (ক্যাটাগরি)" },
  { key: "locations", label: "জেলা ও উপজেলা" },
  { key: "settings", label: "ওয়েবসাইট সেটিংস" },
  { key: "users", label: "ব্যবহারকারী ও অনুমতি" },
  { key: "logs", label: "অ্যাক্টিভিটি লগ" },
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number]["key"];

export async function fetchPermissions(userId: string) {
  const { data, error } = await supabase
    .from("user_permissions")
    .select("user_id, module")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.module);
}

export async function fetchAllPermissions() {
  const { data, error } = await supabase.from("user_permissions").select("user_id, module");
  if (error) throw error;
  return data ?? [];
}

export async function setPermissions(userId: string, modules: string[]) {
  const { error: delError } = await supabase.from("user_permissions").delete().eq("user_id", userId);
  if (delError) throw delError;
  if (!modules.length) return;
  const { error } = await supabase
    .from("user_permissions")
    .insert(modules.map((module) => ({ user_id: userId, module })));
  if (error) throw error;
}

/**
 * Effective permissions for the signed-in user.
 * Super admins get everything; an admin without explicit rows keeps full access.
 */
export function usePermissions() {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-permissions", user?.id],
    enabled: !!user?.id && isAdmin,
    queryFn: () => fetchPermissions(user!.id),
  });

  const granted = data ?? [];
  const all = isSuperAdmin || (isAdmin && granted.length === 0);

  return {
    loading: loading || isLoading,
    modules: all ? PERMISSION_MODULES.map((m) => m.key as string) : granted,
    can: (module: PermissionModule) => all || granted.includes(module),
  };
}
