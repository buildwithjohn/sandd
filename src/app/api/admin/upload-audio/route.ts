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
    if (!["admin","super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    const courseId = form.get("courseId") as string;
    const title = form.get("title") as string;
    const orderIndex = parseInt((form.get("orderIndex") as string) || "1");
    const isPublished = (form.get("isPublished") as string) === "true";
    const scheduledAt = form.get("scheduledAt") as string | null;

    if (!file || !courseId || !title) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 100MB" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ext  = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const path = `audio/${courseId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: upErr } = await admin.storage.from("materials")
      .upload(path, bytes, { upsert: false, contentType: file.type || "audio/mpeg" });
    if (upErr) throw upErr;

    const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);

    const { data: lesson, error: dbErr } = await admin.from("lessons").insert({
      course_id: courseId,
      title: title.trim(),
      audio_url: urlData.publicUrl,
      order_index: orderIndex,
      is_published: isPublished,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }).select().single();

    if (dbErr) throw dbErr;
    return NextResponse.json({ lesson, url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
