import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data } = await admin.from("profiles")
      .select("id, full_name, email, phone, church, role, created_at")
      .in("role", ["admin", "super_admin"])
      .order("created_at", { ascending: false });

    return NextResponse.json({ admins: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
