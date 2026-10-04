import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.role ?? "")) return { error: "Forbidden", status: 403 as const };
  return { ok: true as const };
}

// GET — cohorts + their full course track with live status
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const [{ data: cohorts }, { data: rows }] = await Promise.all([
    admin.from("cohorts").select("id, name, is_current, status, scheduled_start_at").order("name"),
    admin.from("cohort_courses")
      .select("id, cohort_id, course_id, position, status, opens_at, closes_at, duration_days, courses(title, year)")
      .order("position"),
  ]);

  const track: Record<string, any[]> = {};
  (rows ?? []).forEach((r: any) => {
    (track[r.cohort_id] ??= []).push({
      id: r.id, course_id: r.course_id, position: r.position, status: r.status,
      opens_at: r.opens_at, closes_at: r.closes_at, duration_days: r.duration_days,
      title: r.courses?.title ?? "—", year: r.courses?.year ?? 1,
    });
  });

  return NextResponse.json({ cohorts: cohorts ?? [], track });
}

// POST — actions: advance | open | close | reopen | lock | extend
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const body = await req.json();
  const { action } = body;

  async function openRow(id: string) {
    const { data: row } = await admin.from("cohort_courses").select("duration_days").eq("id", id).single();
    const days = row?.duration_days ?? 14;
    const opens = new Date();
    const closes = new Date(opens.getTime() + days * 86_400_000);
    await admin.from("cohort_courses").update({ status: "open", opens_at: opens.toISOString(), closes_at: closes.toISOString() }).eq("id", id);
  }
  async function closeRow(id: string) {
    const { data: row } = await admin.from("cohort_courses").select("course_id").eq("id", id).single();
    await admin.from("cohort_courses").update({ status: "closed" }).eq("id", id);
    if (row?.course_id) await admin.from("assessments").update({ is_published: false }).eq("course_id", row.course_id);
  }

  try {
    if (action === "advance") {
      // Close every open course in the cohort, then open the next locked one.
      const { cohortId } = body;
      const { data: open } = await admin.from("cohort_courses").select("id").eq("cohort_id", cohortId).eq("status", "open");
      for (const r of open ?? []) await closeRow(r.id);
      const { data: next } = await admin.from("cohort_courses")
        .select("id").eq("cohort_id", cohortId).eq("status", "locked").order("position").limit(1);
      if (next && next[0]) { await openRow(next[0].id); return NextResponse.json({ ok: true, opened: next[0].id }); }
      return NextResponse.json({ ok: true, opened: null, message: "No more courses to open — cohort has reached the end." });
    }
    if (action === "setStart") {
      // Schedule (or clear) a cohort's auto-start date. body.startsAt = ISO string | null
      await admin.from("cohorts").update({ scheduled_start_at: body.startsAt || null }).eq("id", body.cohortId);
      return NextResponse.json({ ok: true });
    }
    if (action === "open")   { await openRow(body.id);  return NextResponse.json({ ok: true }); }
    if (action === "reopen") { await openRow(body.id);  return NextResponse.json({ ok: true }); }
    if (action === "close")  { await closeRow(body.id); return NextResponse.json({ ok: true }); }
    if (action === "lock")   { await admin.from("cohort_courses").update({ status: "locked", opens_at: null, closes_at: null }).eq("id", body.id); return NextResponse.json({ ok: true }); }
    if (action === "extend") {
      const days = Number(body.days ?? 7);
      const { data: row } = await admin.from("cohort_courses").select("closes_at").eq("id", body.id).single();
      const base = row?.closes_at ? new Date(row.closes_at) : new Date();
      const closes = new Date(base.getTime() + days * 86_400_000);
      await admin.from("cohort_courses").update({ closes_at: closes.toISOString() }).eq("id", body.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
