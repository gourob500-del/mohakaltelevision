import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createAdminSchema = z.object({
  full_name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  mobile: z.string().trim().max(20).optional().default(""),
  designation: z.string().trim().max(100).optional().default(""),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
  modules: z.array(z.string().max(40)).max(20).default([]),
});

/** Super-admin only: creates a new admin account with module permissions. */
export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "SUPER_ADMIN",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, mobile: data.mobile },
    });
    if (createError || !created.user) throw new Error(createError?.message ?? "User create failed");
    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      mobile: data.mobile || null,
      designation: data.designation || null,
      status: "ACTIVE",
      can_publish: true,
    });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleInsertError) throw new Error(roleInsertError.message);

    if (data.modules.length) {
      await supabaseAdmin
        .from("user_permissions")
        .insert(data.modules.map((module) => ({ user_id: userId, module })));
    }

    await supabaseAdmin.from("activity_logs").insert({
      user_id: context.userId,
      actor_name: "Super Admin",
      action: "ADMIN_CREATE",
      entity_type: "PROFILE",
      entity_id: userId,
      details: `${data.full_name} (${data.role})`,
    });

    return { id: userId };
  });
