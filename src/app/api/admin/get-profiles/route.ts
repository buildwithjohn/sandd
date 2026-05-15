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
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, student_number, church")
      .in("id", ids);

    return NextResponse.json({ profiles: profiles ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
