import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { runComms } from "@/lib/comms";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEYS = ["auto_welcome", "auto_exam", "auto_year2", "auto_inactivity"] as const;

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.role ?? "")) return { error: "Forbidden", status: 403 as const };
  return { error: null };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = createAdminClient();
  const { data } = await admin.from("school_settings").select("key,value").in("key", KEYS as unknown as string[]);
  const switches = Object.fromEntries(KEYS.map(k => [k, (data ?? []).find((s: any) => s.key === k)?.value === "true"]));
  return NextResponse.json({ switches });
}

// POST { action: 'toggle', key, value } | { action: 'dryrun' } | { action: 'run' }
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { action, key, value } = await req.json();
    const admin = createAdminClient();

    if (action === "toggle") {
      if (!KEYS.includes(key)) return NextResponse.json({ error: "Unknown automation" }, { status: 400 });
      await admin.from("school_settings").upsert(
        { key, value: value ? "true" : "false", updated_at: new Date().toISOString() }, { onConflict: "key" });
      return NextResponse.json({ ok: true });
    }
    if (action === "dryrun") return NextResponse.json({ report: await runComms({ dryRun: true }) });
    if (action === "run")    return NextResponse.json({ report: await runComms({ dryRun: false }) });
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
