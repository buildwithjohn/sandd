import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin","super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId, action } = await req.json();
    const admin = createAdminClient();

    if (action === "close") {
      // Mark course as closed
      const { error } = await admin.from("courses").update({ is_closed: true, closed_at: new Date().toISOString() }).eq("id", courseId);
      if (error) throw error;
      // Unpublish any assessments still open so students cannot take them anymore
      await admin.from("assessments").update({ is_published: false }).eq("course_id", courseId);
      return NextResponse.json({ success: true, action: "closed" });
    }

    if (action === "reopen") {
      const { error } = await admin.from("courses").update({ is_closed: false, closed_at: null }).eq("id", courseId);
      if (error) throw error;
      return NextResponse.json({ success: true, action: "reopened" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
