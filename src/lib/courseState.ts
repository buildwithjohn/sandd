// Per-cohort course drip state. A course moves locked -> open (14 days) ->
// closed (read-only forever). Source of truth: the cohort_courses table.

export type CourseStatus = "locked" | "open" | "closed";

export interface CohortCourseState {
  course_id: string;
  status: CourseStatus;
  opens_at: string | null;
  closes_at: string | null;
  position: number;
}

/**
 * Returns a map of course_id -> state for the given cohort. If the cohort has
 * no schedule rows yet (e.g. the drip SQL hasn't been run), the map is empty
 * and callers should fall back to treating everything as open.
 */
export async function fetchCohortCourseStates(
  supabase: any,
  cohortId: string | null | undefined
): Promise<Map<string, CohortCourseState>> {
  const map = new Map<string, CohortCourseState>();
  if (!cohortId) return map;
  try {
    const { data } = await supabase
      .from("cohort_courses")
      .select("course_id, status, opens_at, closes_at, position")
      .eq("cohort_id", cohortId);
    (data ?? []).forEach((r: CohortCourseState) => map.set(r.course_id, r));
  } catch {
    /* table may not exist yet — fall back to open */
  }
  return map;
}

/** Whole days until a course auto-closes (null if no close time). */
export function daysLeft(closesAt: string | null | undefined): number | null {
  if (!closesAt) return null;
  const ms = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** A short human label for a status + timing. */
export function statusLabel(s: CourseStatus, closesAt?: string | null): string {
  if (s === "open") {
    const d = daysLeft(closesAt);
    return d != null ? `Active · ${d} day${d === 1 ? "" : "s"} left` : "Active";
  }
  if (s === "closed") return "Completed";
  return "Locked";
}
