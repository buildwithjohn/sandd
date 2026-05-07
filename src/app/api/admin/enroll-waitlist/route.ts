import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function generatePassword(name: string): string {
  const clean = name.split(" ")[0].replace(/[^a-zA-Z]/g, "") || "Student";
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  const nums = Math.floor(1000 + Math.random() * 9000);
  return `SandD${cap}${nums}!`;
}

export async function POST() {
  try {
    // Verify requester is admin
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get all waitlist entries
    const { data: waitlist, error: wlErr } = await admin.from("waitlist").select("*").order("created_at");
    if (wlErr) throw wlErr;
    if (!waitlist || waitlist.length === 0) return NextResponse.json({ enrolled: [], message: "No waitlist entries" });

    // Get Year 1 courses
    const { data: courses } = await admin.from("courses").select("id").eq("year", 1);
    const courseIds = courses?.map((c: any) => c.id) ?? [];

    // Get current max student number
    const { data: maxData } = await admin
      .from("profiles")
      .select("student_number")
      .not("student_number", "is", null)
      .order("student_number", { ascending: false })
      .limit(1);

    let nextNum = 171; // default after 170
    if (maxData && maxData.length > 0 && maxData[0].student_number) {
      const lastNum = parseInt(maxData[0].student_number.split("/").pop() ?? "170");
      nextNum = lastNum + 1;
    }

    const enrolled: any[] = [];
    const failed: any[] = [];

    for (const entry of waitlist) {
      try {
        const password = generatePassword(entry.full_name || entry.email);

        // Create auth account
        const { data: authData, error: authErr } = await admin.auth.admin.createUser({
          email: entry.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: entry.full_name || "" },
        });

        if (authErr) {
          // If user already exists, just update their profile
          if (!authErr.message.includes("already")) throw authErr;
        }

        const userId = authData?.user?.id;
        if (!userId) { failed.push({ email: entry.email, reason: "No user ID" }); continue; }

        const studentNumber = `SANDD/2026/${String(nextNum).padStart(4, "0")}`;
        nextNum++;

        // Upsert profile
        await admin.from("profiles").upsert({
          id: userId,
          email: entry.email,
          full_name: entry.full_name || "",
          role: "student",
          enrollment_status: "active",
          current_year: 1,
          student_number: studentNumber,
        }, { onConflict: "id" });

        // Enroll in Year 1 courses
        if (courseIds.length > 0) {
          const enrollments = courseIds.map((courseId: string) => ({
            student_id: userId,
            course_id: courseId,
          }));
          await admin.from("enrollments").upsert(enrollments, { onConflict: "student_id,course_id" });
        }

        // Send welcome email via Resend
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "S&D Prophetic School <noreply@sandd.abiodunsule.uk>",
            to: [entry.email],
            subject: "You Have Been Enrolled — S&D Prophetic Training School 2026",
            html: buildEmail(entry.full_name || "Student", entry.email, password, studentNumber),
          }),
        });

        // Remove from waitlist
        await admin.from("waitlist").delete().eq("id", entry.id);

        enrolled.push({ name: entry.full_name, email: entry.email, studentNumber, password });

      } catch (err: any) {
        failed.push({ email: entry.email, reason: err.message });
      }
    }

    return NextResponse.json({ enrolled, failed, total: enrolled.length });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildEmail(name: string, email: string, password: string, studentNumber: string): string {
  const firstName = name.split(" ")[0];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:#1A1A2E;padding:32px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="color:white;font-size:18px;font-weight:700;margin:0;font-family:Georgia,serif;">S&amp;D Prophetic Training School</p>
      <p style="color:#D4A85C;font-size:12px;margin:4px 0 0 0;">Treasures in Clay Ministries</p></td>
      <td align="right"><p style="color:#D4A85C;font-size:11px;margin:0;font-family:monospace;">${studentNumber}</p></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(to right,#D4A85C,#F5D4A0,#D4A85C);"></td></tr>

  <!-- Body -->
  <tr><td style="padding:40px;">
    <p style="color:#1A1A2E;font-size:22px;font-weight:700;font-family:Georgia,serif;margin:0 0 8px 0;">You are enrolled.</p>
    <p style="color:#888;font-size:13px;margin:0 0 32px 0;">2026 Cohort — Certificate in Prophetic Ministry</p>

    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 16px 0;">Dear ${firstName},</p>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 24px 0;">
      Grace and peace to you. On behalf of Prophet Abiodun Sule, Founder and Dean, I am pleased to inform you that you have been formally enrolled into the Sons and Daughters of Prophets Prophetic Training School — 2026 Cohort. Welcome.
    </p>

    <!-- Login box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F2;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="color:#8B7355;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px 0;">Your Login Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[["Portal", "sandd.abiodunsule.uk"], ["Email", email], ["Temporary Password", password], ["Student Number", studentNumber]].map(([l,v]) => `
          <tr>
            <td style="padding:6px 0;color:#8B7355;font-size:13px;font-weight:600;width:40%;">${l}</td>
            <td style="padding:6px 0;color:#1A1A2E;font-size:13px;font-family:monospace;">${v}</td>
          </tr>`).join("")}
        </table>
      </td></tr>
    </table>

    <p style="color:#C0392B;font-size:13px;font-weight:600;margin:0 0 24px 0;">
      ⚠️ Please change your password immediately after logging in — go to Profile in your portal sidebar.
    </p>

    <p style="color:#1A1A2E;font-size:14px;font-weight:700;margin:0 0 12px 0;">Next steps:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["1", "Log in to your portal", "Visit sandd.abiodunsule.uk and sign in with the details above."],
        ["2", "Join our Telegram community", "All orientation details, schedules and live session links are shared there: t.me/+zoXkAa9bjCtmZmY8"],
        ["3", "Download your documents", "Your Admission Letter and Academic Calendar are in the Documents section of your portal."],
      ].map(([n, title, desc]) => `
      <tr><td style="padding:8px 0;vertical-align:top;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;height:28px;background:#1A1A2E;border-radius:50%;text-align:center;vertical-align:middle;">
            <span style="color:#D4A85C;font-size:12px;font-weight:700;">${n}</span>
          </td>
          <td style="padding-left:12px;">
            <p style="color:#1A1A2E;font-size:13px;font-weight:700;margin:0 0 2px 0;">${title}</p>
            <p style="color:#666;font-size:12px;margin:0;">${desc}</p>
          </td>
        </tr></table>
      </td></tr>`).join("")}
    </table>

    <p style="color:#333;font-size:14px;line-height:1.8;margin:32px 0 0 0;">
      Further details about the academic programme and module schedule will be communicated during orientation. Please ensure you are in the Telegram group so you do not miss anything.
    </p>
  </td></tr>

  <!-- Signature -->
  <tr><td style="padding:0 40px 40px 40px;border-top:1px solid #E8E2D9;">
    <p style="color:#333;font-size:14px;margin:24px 0 4px 0;">Yours in His service,</p>
    <p style="color:#1A1A2E;font-size:15px;font-weight:700;font-family:Georgia,serif;margin:0 0 2px 0;">John Ayomide Akinola</p>
    <p style="color:#666;font-size:12px;margin:0;">Registrar, S&amp;D Prophetic Training School</p>
    <p style="color:#666;font-size:12px;margin:0;">Treasures in Clay Ministries</p>
    <p style="color:#888;font-size:12px;margin:6px 0 0 0;font-style:italic;">On behalf of Prophet Abiodun Sule — Founder &amp; Dean</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#1A1A2E;padding:20px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">sandd.abiodunsule.uk · Treasures in Clay Ministries · 2026</p>
    <p style="color:rgba(212,168,92,0.6);font-size:10px;font-style:italic;margin:4px 0 0 0;">"But the one who prophesies speaks to people for their strengthening, encouraging and comfort." — 1 Cor 14:3</p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}
