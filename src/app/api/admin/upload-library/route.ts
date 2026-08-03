import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { error: null };
}

// Create a Library item (+ its materials). Files are already uploaded
// client-side direct to Supabase Storage; we only store metadata here.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const {
      title, description, category, youtubeId, audioUrl,
      orderIndex, isPublished, materials,
    } = await req.json();

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!youtubeId && !audioUrl && !(materials?.length)) {
      return NextResponse.json({ error: "Add at least a video, audio, or one material." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: item, error: itemErr } = await admin.from("library_items").insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || "Live Class",
      youtube_video_id: youtubeId || null,
      audio_url: audioUrl || null,
      order_index: parseInt(orderIndex) || 0,
      is_published: isPublished ?? true,
    }).select().single();
    if (itemErr) throw itemErr;

    if (Array.isArray(materials) && materials.length > 0) {
      const rows = materials
        .filter((m: any) => m?.fileUrl)
        .map((m: any) => ({
          item_id: item.id,
          title: (m.title?.trim() || m.fileName || "Material"),
          file_url: m.fileUrl,
          file_name: m.fileName || null,
        }));
      if (rows.length > 0) {
        const { error: matErr } = await admin.from("library_materials").insert(rows);
        if (matErr) throw matErr;
      }
    }

    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete a Library item (materials cascade via FK).
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("library_items").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
