import { NextResponse } from "next/server";
import { isAuthorizedCron, touchDatabase } from "@/lib/cron";

export const dynamic = "force-dynamic";

// GET /api/cron/keep-alive
// Keeps the free-tier Supabase project from pausing. Called by the daily
// Vercel cron (and reusable for manual verification with ?secret=).
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await touchDatabase();
  return NextResponse.json({ ok: result.ok, ts: new Date().toISOString(), error: result.error });
}
