import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendBatch, enrolmentEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function generatePassword(name: string): string {
  const clean = (name || "Student").split(" ")[0].replace(/[^a-zA-Z]/g, "") || "Student";
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `SandD${cap}${nums}!`;
}

/**
 * Resend login details to students who have never signed in (the people who
 * were enrolled but didn't receive their welcome email). Each one gets a fresh
 * temporary password and the branded enrolment email, sent in a single batch.
 *
 * Body (optional): { emails?: string[] } to target specific addresses instead.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(me?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetEmails: string[] | null = Array.isArray(body?.emails) && body.emails.length ? body.emails.map((e: string) => e.toLowerCase()) : null;

    const admin = createAdminClient();

    // All auth users (to read last_sign_in_at). 174+ users fit one page.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;

    // Student profiles (name + number + role)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, student_number, role, email");
    const profById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    // Candidates: never signed in, role = student (or targeted explicitly)
    const candidates = (list?.users ?? []).filter((u: any) => {
      const p = profById.get(u.id);
      if (!p || p.role !== "student") return false;
      if (targetEmails) return targetEmails.includes((u.email ?? "").toLowerCase());
      return !u.last_sign_in_at; // never logged in
    });

    if (candidates.length === 0) {
      return NextResponse.json({ total: 0, emailsSent: 0, recipients: [], message: "No matching students (everyone has already signed in)." });
    }

    // Reset each password in parallel (batches of 10) so we stay well under
    // the function time limit, then collect the emails to send.
    const recipients: any[] = [];
    const messages: { to: string; subject: string; html: string }[] = [];

    for (let i = 0; i < candidates.length; i += 10) {
      const slice = candidates.slice(i, i + 10);
      await Promise.all(slice.map(async (u: any) => {
        const p = profById.get(u.id);
        const name = p?.full_name || (u.email ?? "").split("@")[0];
        const studentNumber = p?.student_number || "SANDD/2026/—";
        const password = generatePassword(name);
        const { error: updErr } = await admin.auth.admin.updateUserById(u.id, { password });
        if (updErr) { recipients.push({ email: u.email, name, ok: false, error: updErr.message }); return; }
        messages.push({
          to: u.email as string,
          subject: "Your S&D Prophetic School login details",
          html: enrolmentEmail(name, u.email as string, password, studentNumber),
        });
        recipients.push({ email: u.email, name, studentNumber, password, ok: false });
      }));
    }

    const batch = await sendBatch(messages);
    const statusByEmail = new Map(batch.results.map((r) => [r.to, r]));
    for (const r of recipients) {
      const s = statusByEmail.get(r.email);
      if (s) { r.ok = s.ok; if (!s.ok) r.error = s.error; }
    }

    return NextResponse.json({ total: candidates.length, emailsSent: batch.sent, recipients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
