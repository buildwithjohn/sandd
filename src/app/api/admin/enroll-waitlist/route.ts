import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendBatch, enrolmentEmail } from "@/lib/email";

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

    // Current cohort (if the cohort engine has been set up). Tolerate absence.
    let currentCohortId: string | null = null;
    try {
      const { data: cc } = await admin.from("cohorts").select("id").eq("is_current", true).maybeSingle();
      currentCohortId = cc?.id ?? null;
    } catch { /* cohorts table not present yet */ }

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
          ...(currentCohortId ? { cohort_id: currentCohortId } : {}),
        }, { onConflict: "id" });

        // Enroll in Year 1 courses
        if (courseIds.length > 0) {
          const enrollments = courseIds.map((courseId: string) => ({
            student_id: userId,
            course_id: courseId,
          }));
          await admin.from("enrollments").upsert(enrollments, { onConflict: "student_id,course_id" });
        }

        // Remove from waitlist
        await admin.from("waitlist").delete().eq("id", entry.id);

        enrolled.push({ name: entry.full_name, email: entry.email, studentNumber, password, emailed: false });

      } catch (err: any) {
        failed.push({ email: entry.email, reason: err.message });
      }
    }

    // Send all enrolment emails in one batch (avoids the per-request rate limit)
    const messages = enrolled.map((e) => ({
      to: e.email,
      subject: "You're enrolled — S&D Prophetic School (Login Details Inside)",
      html: enrolmentEmail(e.name || e.email.split("@")[0], e.email, e.password, e.studentNumber),
    }));
    const batch = await sendBatch(messages);
    const statusByEmail = new Map(batch.results.map((r) => [r.to, r]));
    for (const e of enrolled) {
      const r = statusByEmail.get(e.email);
      e.emailed = !!r?.ok;
      if (!r?.ok) e.emailError = r?.error;
    }

    return NextResponse.json({ enrolled, failed, total: enrolled.length, emailsSent: batch.sent });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
