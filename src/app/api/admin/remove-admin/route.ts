import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Demote an admin back to student role (does NOT delete their account or progress)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admin can remove admins" }, { status: 403 });
    }

    const { adminId, action } = await req.json();
    if (!adminId) return NextResponse.json({ error: "adminId required" }, { status: 400 });
    if (adminId === user.id) return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });

    const admin = createAdminClient();

    if (action === "demote") {
      // Demote to regular admin (super_admin -> admin)
      await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);
      return NextResponse.json({ success: true, action: "demoted" });
    }
    if (action === "promote") {
      // Promote admin -> super_admin
      await admin.from("profiles").update({ role: "super_admin" }).eq("id", adminId);
      return NextResponse.json({ success: true, action: "promoted" });
    }
    if (action === "remove") {
      // Strip admin role — they become a regular student
      await admin.from("profiles").update({ role: "student" }).eq("id", adminId);
      return NextResponse.json({ success: true, action: "removed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
