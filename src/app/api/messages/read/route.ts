import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// POST /api/messages/read { conversationId } — clear the caller's unread flag.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = ["admin", "super_admin"].includes(profile?.role ?? "");

  try {
    const { conversationId } = await req.json();
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    const admin = createAdminClient();
    const { data: c } = await admin.from("conversations").select("student_id").eq("id", conversationId).single();
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isAdmin && c.student_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await admin.from("conversations")
      .update(isAdmin ? { admin_unread: false } : { student_unread: false })
      .eq("id", conversationId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
