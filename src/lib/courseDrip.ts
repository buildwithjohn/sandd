import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Course drip automation. Any course whose 14-day window has elapsed is closed
 * (its exam locked, recordings kept), and the next locked course in that cohort
 * is opened for a fresh window. Idempotent — safe to run daily.
 */
export async function runCourseDrip(): Promise<{ started: string[]; closed: string[]; opened: string[] }> {
  const admin = createAdminClient();
  const now = new Date();
  const started: string[] = [];
  const closed: string[] = [];
  const opened: string[] = [];

  async function openFirstLocked(cohortId: string): Promise<string | null> {
    const { data: first } = await admin
      .from("cohort_courses")
      .select("id, duration_days")
      .eq("cohort_id", cohortId)
      .eq("status", "locked")
      .order("position")
      .limit(1);
    if (!first || !first[0]) return null;
    const days = first[0].duration_days ?? 14;
    const opens = new Date();
    const closesAt = new Date(opens.getTime() + days * 86_400_000);
    await admin.from("cohort_courses")
      .update({ status: "open", opens_at: opens.toISOString(), closes_at: closesAt.toISOString() })
      .eq("id", first[0].id);
    return first[0].id;
  }

  // 0) Auto-start cohorts whose scheduled start date has arrived and that
  //    haven't begun yet (every course still locked).
  const { data: startable } = await admin
    .from("cohorts")
    .select("id")
    .not("scheduled_start_at", "is", null)
    .lte("scheduled_start_at", now.toISOString());
  for (const c of startable ?? []) {
    const { data: active } = await admin
      .from("cohort_courses").select("id").eq("cohort_id", c.id).neq("status", "locked").limit(1);
    if (active && active.length) continue; // already started
    const id = await openFirstLocked(c.id);
    if (id) started.push(id);
  }

  // Courses whose window has elapsed
  const { data: due } = await admin
    .from("cohort_courses")
    .select("id, cohort_id, course_id, position, duration_days, courses(year)")
    .eq("status", "open")
    .lte("closes_at", now.toISOString());

  for (const row of due ?? []) {
    // Close it + lock its exam
    await admin.from("cohort_courses").update({ status: "closed" }).eq("id", row.id);
    await admin.from("assessments").update({ is_published: false }).eq("course_id", row.course_id);
    closed.push(row.id);

    // Open the next locked course in this cohort — but NEVER auto-cross a year
    // boundary. Year 2 (Diploma) only opens via an explicit admin promotion.
    const { data: next } = await admin
      .from("cohort_courses")
      .select("id, duration_days, courses(year)")
      .eq("cohort_id", row.cohort_id)
      .eq("status", "locked")
      .order("position")
      .limit(1);
    const closedYear = (row as any).courses?.year;
    const nextYear = next && next[0] ? (next[0] as any).courses?.year : null;
    const crossesYear = closedYear != null && nextYear != null && nextYear > closedYear;

    if (next && next[0] && !crossesYear) {
      const days = next[0].duration_days ?? 14;
      const opens = new Date();
      const closesAt = new Date(opens.getTime() + days * 86_400_000);
      await admin.from("cohort_courses")
        .update({ status: "open", opens_at: opens.toISOString(), closes_at: closesAt.toISOString() })
        .eq("id", next[0].id);
      opened.push(next[0].id);
    }
    // crossesYear === true → the cohort has completed the year; Year 2 stays
    // locked until the admin promotes the cohort from the Course Schedule.
  }

  return { started, closed, opened };
}
