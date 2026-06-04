import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const courseId = form.get("courseId") as string;
    const title    = form.get("title") as string;
    const category = form.get("category") as string;
    const file     = form.get("file") as File;

    if (!courseId || !title || !category || !file) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 50MB" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ext  = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `resources/${courseId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: upErr } = await admin.storage.from("materials")
      .upload(path, bytes, { upsert: false, contentType: file.type });
    if (upErr) throw upErr;

    const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);

    const { data: resource, error: dbErr } = await admin.from("course_resources").insert({
      course_id: courseId,
      title: title.trim(),
      category: category,
      file_url: urlData.publicUrl,
      file_name: file.name,
    }).select().single();

    if (dbErr) throw dbErr;
    return NextResponse.json({ resource });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
