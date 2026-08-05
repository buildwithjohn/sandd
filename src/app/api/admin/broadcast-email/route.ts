import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM = "S&D Prophetic School <noreply@sandd.abiodunsule.uk>";
const BATCH = 45; // Resend allows up to 50 recipients per call; keep headroom

function buildHtml(subject: string, message: string): string {
  // message is plain text from the composer — preserve line breaks safely
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = esc(message).replace(/\n/g, "<br/>");
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#0A0612;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0612;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#14101F;border-radius:16px;overflow:hidden;border:1px solid #2D2548;">
  <tr><td style="background:#2D1B5E;padding:28px 32px;text-align:center;">
    <div style="color:#D4B570;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Sons &amp; Daughters of Prophets</div>
    <div style="color:#ffffff;font-size:20px;margin-top:6px;">Prophetic Training School</div>
  </td></tr>
  <tr><td style="padding:32px;">
    <h1 style="color:#EDE9F5;font-size:22px;margin:0 0 18px;">${esc(subject)}</h1>
    <div style="color:#C9C2DA;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;">${body}</div>
    <div style="margin-top:28px;">
      <a href="https://sandd.abiodunsule.uk/auth/login" style="display:inline-block;background:#D4B570;color:#14101F;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:10px;">Open the Student Portal</a>
    </div>
  </td></tr>
  <tr><td style="background:#0F0B1A;padding:20px 32px;border-top:1px solid #2D2548;">
    <p style="color:#8B84A0;font-size:12px;line-height:1.7;margin:0;font-family:Arial,sans-serif;">
      Sons and Daughters of Prophets Prophetic Training School<br/>
      Treasures in Clay Ministries &mdash; 2026 &middot;
      <a href="https://sandd.abiodunsule.uk" style="color:#D4B570;text-decoration:none;">sandd.abiodunsule.uk</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    // ── Admin auth ──
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email is not configured (RESEND_API_KEY missing)." }, { status: 500 });
    }

    const { subject, message } = await req.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    // ── Recipients: all students with an email ──
    const admin = createAdminClient();
    const { data: students, error: qErr } = await admin
      .from("profiles").select("email").eq("role", "student");
    if (qErr) throw qErr;

    const emails = Array.from(new Set(
      (students ?? []).map(s => (s.email || "").trim().toLowerCase()).filter(Boolean)
    ));
    if (emails.length === 0) {
      return NextResponse.json({ error: "No student emails found." }, { status: 400 });
    }

    const html = buildHtml(subject.trim(), message.trim());
    const adminEmail = user.email!; // sender gets the visible copy; students are BCC'd (private)

    let sent = 0;
    const failures: string[] = [];

    for (let i = 0; i < emails.length; i += BATCH) {
      const chunk = emails.slice(i, i + BATCH);
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM,
            to: [adminEmail],
            bcc: chunk,
            subject: subject.trim(),
            html,
          }),
        });
        if (res.status === 429) { await new Promise(r => setTimeout(r, (attempt + 1) * 1500)); continue; }
        if (res.ok) { ok = true; sent += chunk.length; }
        else {
          const e = await res.json().catch(() => ({}));
          failures.push(e?.message || `HTTP ${res.status}`);
          break;
        }
      }
      // gentle pacing between batches to respect rate limits
      if (i + BATCH < emails.length) await new Promise(r => setTimeout(r, 600));
    }

    return NextResponse.json({
      total: emails.length,
      sent,
      failed: emails.length - sent,
      errors: failures.slice(0, 3),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Recipient count (for the composer preview)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const admin = createAdminClient();
    const { data: students } = await admin.from("profiles").select("email").eq("role", "student");
    const count = new Set((students ?? []).map(s => (s.email || "").trim().toLowerCase()).filter(Boolean)).size;
    return NextResponse.json({ count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
