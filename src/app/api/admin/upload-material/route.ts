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

    const form = await req.formData();
    const courseId = form.get("courseId") as string;
    const file     = form.get("file") as File;

    if (!courseId || !file) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const admin = createAdminClient();
    const ext   = file.name.split(".").pop();
    const path  = `materials/course-${courseId}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: upErr } = await admin.storage.from("materials")
      .upload(path, bytes, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;

    const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);

    // Save to courses table
    const { error: dbErr } = await admin.from("courses")
      .update({ notes_url: urlData.publicUrl }).eq("id", courseId);
    if (dbErr) throw dbErr;

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
