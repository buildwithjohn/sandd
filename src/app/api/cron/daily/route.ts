import { NextResponse } from "next/server";
import { isAuthorizedCron, touchDatabase } from "@/lib/cron";
import { runComms } from "@/lib/comms";
import { runCourseDrip } from "@/lib/courseDrip";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/cron/daily
// Single daily orchestrator (Vercel Hobby allows limited daily crons, so we
// run every scheduled task from one entry point). Steps run in order and are
// isolated — one failing step never blocks the others.
//
// Phase 1: keep-alive.
// Phase 2 will add: cohort lifecycle transitions + scheduled comms.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps: Record<string, unknown> = {};

  // 1) Keep the database awake (free-tier anti-pause)
  steps.keepAlive = await touchDatabase();

  // 2) Course drip — close finished courses, open the next per cohort
  try { steps.courseDrip = await runCourseDrip(); }
  catch (e: any) { steps.courseDrip = { error: e?.message ?? "failed" }; }

  // 3) Scheduled comms (only the automations the admin has switched on)
  try { steps.comms = await runComms({ dryRun: false }); }
  catch (e: any) { steps.comms = { error: e?.message ?? "failed" }; }

  return NextResponse.json({ ran: new Date().toISOString(), steps });
}
