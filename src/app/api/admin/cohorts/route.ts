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
  return { error: null };
}

// GET — list cohorts with roster counts, the waitlist count, and registration state.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const admin = createAdminClient();
    const [{ data: cohorts }, { count: waitlistCount }, { data: reg }] = await Promise.all([
      admin.from("cohorts").select("*").order("created_at", { ascending: false }),
      admin.from("waitlist").select("*", { count: "exact", head: true }),
      admin.from("school_settings").select("value").eq("key", "registration_open").maybeSingle(),
    ]);

    // roster count per cohort
    const withCounts = await Promise.all((cohorts ?? []).map(async (c: any) => {
      const { count } = await admin.from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("cohort_id", c.id).eq("role", "student");
      return { ...c, student_count: count ?? 0 };
    }));

    return NextResponse.json({
      cohorts: withCounts,
      waitlistCount: waitlistCount ?? 0,
      registrationOpen: reg?.value === "true",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create a cohort.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { name, registration_opens_at, registration_closes_at, starts_at, ends_at } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Cohort name is required" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin.from("cohorts").insert({
      name: name.trim(),
      status: "draft",
      registration_opens_at: registration_opens_at || null,
      registration_closes_at: registration_closes_at || null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ cohort: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — act on a cohort: set_current | open_registration | close_registration | set_status | update
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { id, action, status, dates } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing cohort id" }, { status: 400 });
    const admin = createAdminClient();

    const setRegistration = async (open: boolean) =>
      admin.from("school_settings").upsert(
        { key: "registration_open", value: open ? "true" : "false", updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    const makeCurrent = async () => {
      await admin.from("cohorts").update({ is_current: false }).eq("is_current", true);
      await admin.from("cohorts").update({ is_current: true }).eq("id", id);
    };

    if (action === "set_current") {
      await makeCurrent();
    } else if (action === "open_registration") {
      await makeCurrent();
      await admin.from("cohorts").update({ status: "registration" }).eq("id", id);
      await setRegistration(true);
    } else if (action === "close_registration") {
      await admin.from("cohorts").update({ status: "active" }).eq("id", id);
      await setRegistration(false);
    } else if (action === "set_status" && status) {
      await admin.from("cohorts").update({ status }).eq("id", id);
    } else if (action === "update" && dates) {
      await admin.from("cohorts").update(dates).eq("id", id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { data } = await admin.from("cohorts").select("*").eq("id", id).single();
    return NextResponse.json({ cohort: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
