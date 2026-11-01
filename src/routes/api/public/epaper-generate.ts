import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { dhakaDate } from "@/lib/epaper-layout";

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

/** Constant-time token comparison; length mismatches still take the same branch shape. */
function sameToken(a: string, b: string): boolean {
  const ha = sha256(a);
  const hb = sha256(b);
  return ha.length === hb.length && timingSafeEqual(Buffer.from(ha), Buffer.from(hb));
}

function sha256(value: string): string {
  return createHashHex(value);
}

function createHashHex(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

// dhakaDate re-exported indirectly through the engine; keep the import used.
void dhakaDate;
