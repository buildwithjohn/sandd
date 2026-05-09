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
    if (!["admin","super_admin"].includes(profile?.role ?? ""))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { lessonId, action, isPublished } = await req.json();
    const admin = createAdminClient();

    if (action === "delete") {
      const { error } = await admin.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
    } else if (action === "toggle") {
      const { error } = await admin.from("lessons").update({ is_published: !isPublished }).eq("id", lessonId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
