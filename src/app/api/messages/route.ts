import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendEmail, brandedEmail, escapeHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

async function whoami() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, full_name, email").eq("id", user.id).single();
  const isAdmin = ["admin", "super_admin"].includes(profile?.role ?? "");
  return { id: user.id, isAdmin, name: profile?.full_name ?? "", email: profile?.email ?? user.email ?? "" };
}

// GET /api/messages                      -> conversation list (role-scoped)
// GET /api/messages?conversationId=XXX    -> messages in that thread
export async function GET(req: NextRequest) {
  const me = await whoami();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const conversationId = new URL(req.url).searchParams.get("conversationId");

  try {
    if (conversationId) {
      // access check
      const { data: convo } = await admin.from("conversations").select("*").eq("id", conversationId).single();
      if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (!me.isAdmin && convo.student_id !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { data: messages } = await admin.from("messages").select("*").eq("conversation_id", conversationId).order("created_at");
      return NextResponse.json({ conversation: convo, messages: messages ?? [] });
    }

    let q = admin.from("conversations").select("*").order("last_message_at", { ascending: false });
    if (!me.isAdmin) q = q.eq("student_id", me.id);
    const { data: convos } = await q;

    // attach student name/email for admin inbox
    let students: Record<string, { full_name: string; email: string }> = {};
    if (me.isAdmin && convos && convos.length) {
      const ids = Array.from(new Set(convos.map((c: any) => c.student_id)));
      const { data: profs } = await admin.from("profiles").select("id, full_name, email").in("id", ids);
      students = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }]));
    }
    const enriched = (convos ?? []).map((c: any) => ({ ...c, student: students[c.student_id] }));
    return NextResponse.json({ conversations: enriched, isAdmin: me.isAdmin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/messages  { conversationId?, subject?, body }
export async function POST(req: NextRequest) {
  const me = await whoami();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { conversationId, subject, body } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    const admin = createAdminClient();
    const snippet = body.trim().slice(0, 140);
    const role = me.isAdmin ? "admin" : "student";

    let convoId = conversationId as string | undefined;
    let studentId: string;

    if (!convoId) {
      if (me.isAdmin) return NextResponse.json({ error: "Admins reply within an existing conversation." }, { status: 400 });
      const { data: c, error } = await admin.from("conversations").insert({
        student_id: me.id, subject: (subject?.trim() || "Message"),
      }).select().single();
      if (error) throw error;
      convoId = c.id; studentId = me.id;
    } else {
      const { data: c } = await admin.from("conversations").select("*").eq("id", convoId).single();
      if (!c) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      if (!me.isAdmin && c.student_id !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      studentId = c.student_id;
    }

    await admin.from("messages").insert({ conversation_id: convoId, sender_role: role, sender_id: me.id, body: body.trim() });
    await admin.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_snippet: snippet,
      admin_unread: role === "student",
      student_unread: role === "admin",
      status: "open",
    }).eq("id", convoId);

    // Email the student when an admin replies
    if (role === "admin") {
      const { data: student } = await admin.from("profiles").select("email, full_name").eq("id", studentId).single();
      if (student?.email) {
        const html = brandedEmail({
          heading: "New message from the School Office",
          bodyHtml: `<p>Dear ${escapeHtml((student.full_name || "Student").split(" ")[0])},</p>
            <p>You have a new message in your student portal:</p>
            <blockquote style="border-left:3px solid #D4B570;margin:16px 0;padding:4px 0 4px 16px;color:#A89FC0;">${escapeHtml(body.trim())}</blockquote>
            <p>Log in to reply.</p>`,
          ctaText: "Open your messages",
          ctaHref: "https://sandd.abiodunsule.uk/portal/messages",
        });
        sendEmail({ to: student.email, subject: "New message — S&D Prophetic School", html }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, conversationId: convoId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
