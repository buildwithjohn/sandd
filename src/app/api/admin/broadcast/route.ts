import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { brandedEmail, escapeHtml } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM = "S&D Prophetic School <noreply@sandd.abiodunsule.uk>";
const BATCH = 45; // Resend allows up to 50 recipients/call; BCC for privacy

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(profile?.role ?? "")) return { error: "Forbidden", status: 403 as const };
  return { error: null, email: user.email! };
}

// GET — recipient count + cohort list (for the composer)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = createAdminClient();
  const cohortId = new URL(req.url).searchParams.get("cohortId");
  let q = admin.from("profiles").select("email").eq("role", "student");
  if (cohortId && cohortId !== "all") q = q.eq("cohort_id", cohortId);
  const { data } = await q;
  const count = new Set((data ?? []).map(s => (s.email || "").trim().toLowerCase()).filter(Boolean)).size;
  const { data: cohorts } = await admin.from("cohorts").select("id, name").order("name");
  return NextResponse.json({ count, cohorts: cohorts ?? [] });
}

// POST { subject, message } — email every student (BCC batches), copy to sender
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email is not configured." }, { status: 500 });

  try {
    const { subject, message, cohortId } = await req.json();
    if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });

    const admin = createAdminClient();
    let sq = admin.from("profiles").select("email").eq("role", "student");
    if (cohortId && cohortId !== "all") sq = sq.eq("cohort_id", cohortId);
    const { data: students } = await sq;
    const emails = Array.from(new Set((students ?? []).map(s => (s.email || "").trim().toLowerCase()).filter(Boolean)));
    if (emails.length === 0) return NextResponse.json({ error: "No student emails found." }, { status: 400 });

    const html = brandedEmail({
      heading: subject.trim(),
      bodyHtml: escapeHtml(message.trim()).replace(/\n/g, "<br/>"),
      ctaText: "Open the Student Portal",
      ctaHref: "https://sandd.abiodunsule.uk/auth/login",
    });

    let sent = 0;
    const errors: string[] = [];
    for (let i = 0; i < emails.length; i += BATCH) {
      const chunk = emails.slice(i, i + BATCH);
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM, to: [auth.email], bcc: chunk, subject: subject.trim(), html }),
        });
        if (res.status === 429) { await new Promise(r => setTimeout(r, (attempt + 1) * 1500)); continue; }
        if (res.ok) { sent += chunk.length; }
        else { const e = await res.json().catch(() => ({})); errors.push(e?.message || `HTTP ${res.status}`); }
        break;
      }
      if (i + BATCH < emails.length) await new Promise(r => setTimeout(r, 600));
    }

    return NextResponse.json({ total: emails.length, sent, failed: emails.length - sent, errors: Array.from(new Set(errors)).slice(0, 3) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
