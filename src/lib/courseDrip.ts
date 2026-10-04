import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Course drip automation. Any course whose 14-day window has elapsed is closed
 * (its exam locked, recordings kept), and the next locked course in that cohort
 * is opened for a fresh window. Idempotent — safe to run daily.
 */
export async function runCourseDrip(): Promise<{ closed: string[]; opened: string[] }> {
  const admin = createAdminClient();
  const now = new Date();
  const closed: string[] = [];
  const opened: string[] = [];

  // Courses whose window has elapsed
  const { data: due } = await admin
    .from("cohort_courses")
    .select("id, cohort_id, course_id, position, duration_days")
    .eq("status", "open")
    .lte("closes_at", now.toISOString());

  for (const row of due ?? []) {
    // Close it + lock its exam
    await admin.from("cohort_courses").update({ status: "closed" }).eq("id", row.id);
    await admin.from("assessments").update({ is_published: false }).eq("course_id", row.course_id);
    closed.push(row.id);

    // Open the next locked course in this cohort
    const { data: next } = await admin
      .from("cohort_courses")
      .select("id, duration_days")
      .eq("cohort_id", row.cohort_id)
      .eq("status", "locked")
      .order("position")
      .limit(1);
    if (next && next[0]) {
      const days = next[0].duration_days ?? 14;
      const opens = new Date();
      const closesAt = new Date(opens.getTime() + days * 86_400_000);
      await admin.from("cohort_courses")
        .update({ status: "open", opens_at: opens.toISOString(), closes_at: closesAt.toISOString() })
        .eq("id", next[0].id);
      opened.push(next[0].id);
    }
  }

  return { closed, opened };
}
