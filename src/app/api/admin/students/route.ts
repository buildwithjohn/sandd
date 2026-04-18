import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify the requester is an admin
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass RLS
    // Only return properly registered students:
    // - role = 'student' (properly completed signup)
    // - has an email (not a ghost profile)
    // - has a full_name (filled the form)
    const admin = createAdminClient();
    const { data: students, error } = await admin
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .not("email", "is", null)
      .not("full_name", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ students: students ?? [] });

  } catch (err: any) {
    console.error("Admin students API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { studentId, enrollment_status } = await req.json();
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ enrollment_status })
      .eq("id", studentId);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
