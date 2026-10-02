import { NextResponse } from "next/server";
import { isAuthorizedCron, touchDatabase } from "@/lib/cron";

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

  // 2) Cohort lifecycle   — added in Phase 2
  // 3) Scheduled comms     — added in Phase 2

  return NextResponse.json({ ran: new Date().toISOString(), steps });
}
