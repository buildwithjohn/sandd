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
    const courseId    = form.get("courseId") as string;
    const title       = form.get("title") as string;
    const orderIndex  = parseInt((form.get("orderIndex") as string) || "1");
    const contentType = form.get("contentType") as string; // video | audio | slides
    const isPublished = (form.get("isPublished") as string) === "true";
    const scheduledAt = form.get("scheduledAt") as string | null;
    const youtubeId   = form.get("youtubeId") as string | null;
    const audioFile   = form.get("audio") as File | null;
    const slidesFile  = form.get("slides") as File | null;
    const attachFile  = form.get("attachment") as File | null;

    if (!courseId || !title || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();
    const lessonRow: any = {
      course_id: courseId,
      title: title.trim(),
      order_index: orderIndex,
      is_published: isPublished,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    // Handle content type
    if (contentType === "video") {
      if (!youtubeId) return NextResponse.json({ error: "YouTube ID required" }, { status: 400 });
      lessonRow.youtube_video_id = youtubeId;
      lessonRow.video_url = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else if (contentType === "audio") {
      if (!audioFile) return NextResponse.json({ error: "Audio file required" }, { status: 400 });
      if (audioFile.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: "Audio must be under 100MB" }, { status: 400 });
      }
      const ext = audioFile.name.split(".").pop()?.toLowerCase() || "mp3";
      const path = `audio/${courseId}-${Date.now()}.${ext}`;
      const bytes = await audioFile.arrayBuffer();
      const { error: upErr } = await admin.storage.from("materials")
        .upload(path, bytes, { upsert: false, contentType: audioFile.type || "audio/mpeg" });
      if (upErr) throw upErr;
      const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);
      lessonRow.audio_url = urlData.publicUrl;
    } else if (contentType === "slides") {
      if (!slidesFile) return NextResponse.json({ error: "Slides file required" }, { status: 400 });
      if (slidesFile.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "Slides must be under 50MB" }, { status: 400 });
      }
      const ext = slidesFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `slides/${courseId}-${Date.now()}.${ext}`;
      const bytes = await slidesFile.arrayBuffer();
      const { error: upErr } = await admin.storage.from("materials")
        .upload(path, bytes, { upsert: false, contentType: slidesFile.type });
      if (upErr) throw upErr;
      const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);
      lessonRow.slides_url = urlData.publicUrl;
      lessonRow.slides_type = ext;
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    // Optional attachment
    if (attachFile && attachFile.size > 0) {
      if (attachFile.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "Attachment must be under 50MB" }, { status: 400 });
      }
      const ext = attachFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `attachments/${courseId}-${Date.now()}.${ext}`;
      const bytes = await attachFile.arrayBuffer();
      const { error: upErr } = await admin.storage.from("materials")
        .upload(path, bytes, { upsert: false, contentType: attachFile.type });
      if (upErr) throw upErr;
      const { data: urlData } = admin.storage.from("materials").getPublicUrl(path);
      lessonRow.attachment_url = urlData.publicUrl;
      lessonRow.attachment_name = attachFile.name;
    }

    const { data: lesson, error: dbErr } = await admin.from("lessons").insert(lessonRow).select().single();
    if (dbErr) throw dbErr;
    return NextResponse.json({ lesson });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
