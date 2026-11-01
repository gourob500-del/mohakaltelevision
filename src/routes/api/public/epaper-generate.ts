import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

/** Daily automation entry point. Called by pg_cron at 00:10 Asia/Dhaka. */
export const Route = createFileRoute("/api/public/epaper-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
        if (!provided) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        // The cron token lives in a private table readable only server-side.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: keyRow } = await supabaseAdmin
          .from("epaper_cron_key")
          .select("token")
          .eq("id", 1)
          .maybeSingle();
        const stored = keyRow?.token ?? "";
        if (!stored || !sameToken(provided, stored)) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { generateIssue } = await import("@/lib/epaper-generate");
        const outcome = await generateIssue({ trigger: "CRON", respectAutomation: true });
        return Response.json(outcome, { status: outcome.ok ? 200 : 500 });
      },
    },
  },
});

/** Constant-time token comparison. */
function sameToken(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}
