import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Accept ONLY metadata (URLs already uploaded client-side direct to Supabase)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      courseId, title, description, orderIndex, contentType,
      isPublished, scheduledAt,
      youtubeId, audioUrl, slidesUrl, slidesType,
      attachmentUrl, attachmentName,
    } = body;

    if (!courseId || !title || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();
    const lessonRow: any = {
      course_id: courseId,
      title: title.trim(),
      description: description?.trim() || null,
      order_index: parseInt(orderIndex) || 1,
      is_published: isPublished,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    if (contentType === "video") {
      if (!youtubeId) return NextResponse.json({ error: "YouTube ID required" }, { status: 400 });
      lessonRow.youtube_video_id = youtubeId;
      lessonRow.video_url = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else if (contentType === "audio") {
      if (!audioUrl) return NextResponse.json({ error: "Audio URL required" }, { status: 400 });
      lessonRow.audio_url = audioUrl;
    } else if (contentType === "slides") {
      if (!slidesUrl) return NextResponse.json({ error: "Slides URL required" }, { status: 400 });
      lessonRow.slides_url = slidesUrl;
      lessonRow.slides_type = slidesType || "pdf";
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    if (attachmentUrl) {
      lessonRow.attachment_url = attachmentUrl;
      lessonRow.attachment_name = attachmentName || null;
    }

    const { data: lesson, error: dbErr } = await admin.from("lessons").insert(lessonRow).select().single();
    if (dbErr) throw dbErr;
    return NextResponse.json({ lesson });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
