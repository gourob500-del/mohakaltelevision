import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type AuthContext = { userId: string; supabase: import("@supabase/supabase-js").SupabaseClient };

/** Admin with the "epaper" permission only. */
async function assertEpaperAdmin(context: AuthContext) {
  const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!isAdmin) throw new Error("Forbidden");
  const { data: allowed } = await context.supabase.rpc("has_permission", {
    _user_id: context.userId,
    _module: "epaper",
  });
  if (!allowed) throw new Error("Forbidden");
}

/** Generates / regenerates an e-paper issue now. */
export const runEpaperGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ issueDate: z.string().regex(DATE_RE).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertEpaperAdmin(context);
    const { generateIssue } = await import("@/lib/epaper-generate");
    const outcome = await generateIssue({
      trigger: "MANUAL",
      ...(data.issueDate ? { issueDate: data.issueDate } : {}),
    });
    if (!outcome.ok) throw new Error(outcome.error);
    return outcome;
  });

const settingsSchema = z.object({
  automation_enabled: z.boolean().optional(),
  logo_url: z.string().trim().max(2048).nullable().optional(),
  page_categories: z.record(z.string(), z.array(z.string().max(120))).optional(),
});

/** Updates e-paper settings (automation toggle, masthead logo, page/category mapping). */
export const saveEpaperSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEpaperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      updated_at: string;
      automation_enabled?: boolean;
      logo_url?: string | null;
      page_categories?: Record<string, string[]>;
    } = { updated_at: new Date().toISOString() };
    if (data.automation_enabled !== undefined) patch["automation_enabled"] = data.automation_enabled;
    if (data.logo_url !== undefined) patch["logo_url"] = data.logo_url || null;
    if (data.page_categories !== undefined) patch["page_categories"] = data.page_categories;
    const { error } = await supabaseAdmin.from("epaper_settings").update(patch).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  config: z.record(z.string(), z.any()),
});

/** Creates or updates an e-paper page template. */
export const saveEpaperTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => templateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEpaperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("epaper_templates")
        .update({ name: data.name, config: data.config, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("epaper_templates")
      .insert({ name: data.name, config: data.config })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

/** Activates one template; only one can be active at a time. */
export const activateEpaperTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEpaperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: offError } = await supabaseAdmin
      .from("epaper_templates")
      .update({ is_active: false })
      .eq("is_active", true)
      .neq("id", data.id);
    if (offError) throw new Error(offError.message);
    const { error: onError } = await supabaseAdmin
      .from("epaper_templates")
      .update({ is_active: true })
      .eq("id", data.id);
    if (onError) throw new Error(onError.message);
    return { ok: true };
  });

/** Deletes a template; the active template cannot be deleted. */
export const deleteEpaperTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEpaperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("epaper_templates")
      .select("is_active")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.is_active) throw new Error("সক্রিয় টেমপ্লেট মুছে ফেলা যাবে না — আগে অন্য একটি সক্রিয় করুন।");
    const { error } = await supabaseAdmin.from("epaper_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
