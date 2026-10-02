import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/admin/stats — dashboard figures via the service role, so counts are
// correct regardless of RLS (the profiles table has no client-side admin read
// policy, which otherwise zeroes the student count for admins/super_admins).
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const head = { count: "exact" as const, head: true };
    const [
      students, videos, pendingApps, apps, settings, wl, cohorts,
    ] = await Promise.all([
      admin.from("profiles").select("*", head).eq("role", "student"),
      admin.from("lessons").select("*", head).eq("is_published", true),
      admin.from("applications").select("*", head).eq("status", "pending"),
      admin.from("applications").select("*").order("applied_at", { ascending: false }).limit(5),
      admin.from("school_settings").select("value").eq("key", "registration_open").maybeSingle(),
      admin.from("waitlist").select("*").order("created_at", { ascending: false }).limit(10),
      admin.from("cohorts").select("*", head).in("status", ["active", "registration"]),
    ]);

    return NextResponse.json({
      students: students.count ?? 0,
      videos: videos.count ?? 0,
      pendingApplications: pendingApps.count ?? 0,
      activeCohorts: cohorts.count ?? 0,
      recentApps: apps.data ?? [],
      waitlist: wl.data ?? [],
      registrationOpen: (settings.data as any)?.value === "true",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
