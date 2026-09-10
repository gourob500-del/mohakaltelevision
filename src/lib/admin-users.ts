import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/queries";
import type { ProfileRow } from "@/lib/admin";

export type AdminAccount = ProfileRow & { roles: string[]; modules: string[] };

/** Lists every ADMIN / SUPER_ADMIN account with its granted permission modules. */
export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const [{ data: roles, error: rErr }, { data: profiles, error: pErr }, { data: perms, error: mErr }] =
    await Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_permissions").select("user_id, module"),
    ]);
  if (rErr) throw rErr;
  if (pErr) throw pErr;
  if (mErr) throw mErr;

  const roleMap = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const list = roleMap.get(r.user_id) ?? [];
    list.push(r.role as string);
    roleMap.set(r.user_id, list);
  }
  const permMap = new Map<string, string[]>();
  for (const p of perms ?? []) {
    const list = permMap.get(p.user_id) ?? [];
    list.push(p.module);
    permMap.set(p.user_id, list);
  }

  return (profiles ?? [])
    .map((p) => ({
      ...(p as ProfileRow),
      roles: roleMap.get(p.id) ?? [],
      modules: permMap.get(p.id) ?? [],
    }))
    .filter((p) => p.roles.includes("ADMIN") || p.roles.includes("SUPER_ADMIN"));
}

/** Super-admin only (enforced by RLS): replaces a user's role. */
export async function setUserRole(userId: string, role: "ADMIN" | "SUPER_ADMIN") {
  const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delError) throw delError;
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as never);
  if (error) throw error;
  await logActivity("ROLE_UPDATE", "PROFILE", userId, role);
}
