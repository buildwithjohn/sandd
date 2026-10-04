"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Lock, ChevronRight, CheckCircle, Play, CalendarClock } from "lucide-react";
import { fetchCohortCourseStates, statusLabel, type CourseStatus } from "@/lib/courseState";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

interface TrackCourse {
  id: string; title: string; slug: string; year: number;
  description?: string; order_index: number;
  status: CourseStatus; closes_at: string | null; opens_at: string | null; position: number;
}

export default function CoursesPortalPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<TrackCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notStarted, setNotStarted] = useState(false);
  const [cohortInfo, setCohortInfo] = useState<{ name?: string; starts_at?: string | null }>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("cohort_id, current_year").eq("id", user.id).single();

      const states = await fetchCohortCourseStates(supabase, profile?.cohort_id);

      let list: TrackCourse[] = [];
      if (states.size > 0) {
        // Cohort track is the source of truth — show every course with its state.
        const ids = Array.from(states.keys());
        const { data: coursesData } = await supabase
          .from("courses").select("id, title, slug, year, description, order_index").in("id", ids);
        list = (coursesData ?? []).map((c: any) => {
          const s = states.get(c.id)!;
          return { ...c, status: s.status, closes_at: s.closes_at, opens_at: s.opens_at, position: s.position };
        });
      } else {
        // Fallback (schedule not seeded yet): enrolled courses, all open.
        const { data: enr } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
        const ids = (enr ?? []).map((e: any) => e.course_id);
        const q = ids.length
          ? supabase.from("courses").select("id, title, slug, year, description, order_index").in("id", ids)
          : supabase.from("courses").select("id, title, slug, year, description, order_index").eq("year", profile?.current_year ?? 1);
        const { data: coursesData } = await q;
        const sorted = (coursesData ?? []).slice().sort((a: any, b: any) => (a.year - b.year) || (a.order_index - b.order_index));
        list = sorted.map((c: any, i: number) => ({ ...c, status: "open" as CourseStatus, closes_at: null, opens_at: null, position: i + 1 }));
      }

      list.sort((a, b) => (a.position - b.position) || (a.year - b.year) || (a.order_index - b.order_index));

      // A scheduled-but-not-yet-started cohort (everything locked) should see a
      // "class hasn't started" screen, not a list of locked courses.
      if (states.size > 0 && !list.some(c => c.status !== "locked")) {
        const { data: co } = await supabase.from("cohorts").select("name, starts_at, scheduled_start_at").eq("id", profile!.cohort_id).single();
        setCohortInfo({ name: co?.name, starts_at: co?.scheduled_start_at ?? co?.starts_at });
        setNotStarted(true);
      }

      setCourses(list);
      setLoading(false);
    }
    load();
  }, []);

  const openCount   = courses.filter(c => c.status === "open").length;
  const doneCount   = courses.filter(c => c.status === "closed").length;
  const activeCourse = courses.find(c => c.status === "open");

  const byYear = (y: number) => courses.filter(c => c.year === y);

  function CourseRow({ c, index }: { c: TrackCourse; index: number }) {
    const num = String(c.position || index + 1).padStart(2, "0");
    const locked = c.status === "locked";
    const done   = c.status === "closed";
    const open   = c.status === "open";

    const inner = (
      <>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
          open ? "grad-hero border-transparent"
          : done ? "bg-green-500/10 border-green-500/25"
          : "theme-bg-subtle theme-border"
        }`}>
          {open ? <Play className="w-4 h-4 text-white" fill="currentColor" />
            : done ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <Lock className="w-4 h-4 theme-text-faint" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="theme-text-faint text-[11px] font-mono">{num}</span>
            <div className={`text-sm font-semibold truncate ${locked ? "theme-text-faint" : "theme-text"} ${open ? "group-hover:theme-accent transition-colors" : ""}`}
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{c.title}</div>
          </div>
          {c.description && !locked && (
            <p className="theme-text-muted text-xs font-sans leading-relaxed line-clamp-1">{c.description}</p>
          )}
          {locked && (
            <p className="theme-text-faint text-xs font-sans">Unlocks when the current course closes</p>
          )}
        </div>
        <span className={`text-[10px] font-sans px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
          open ? "grad-hero text-white font-semibold"
          : done ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "theme-bg-subtle theme-text-faint border theme-border"
        }`}>
          {statusLabel(c.status, c.closes_at)}
        </span>
        {!locked && <ChevronRight className="w-4 h-4 theme-text-faint group-hover:theme-accent transition-colors flex-shrink-0" />}
      </>
    );

    if (locked) {
      return (
        <div className="kcard p-5 flex items-center gap-4 opacity-60 cursor-not-allowed select-none">{inner}</div>
      );
    }
    return (
      <Link href={`/portal/courses/${c.slug}`} className="group kcard p-5 flex items-center gap-4">{inner}</Link>
    );
  }

  return (
    <PortalShell>
      <div className="space-y-6">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="kinetic-display text-3xl theme-text mb-1">My Courses</h1>
          <p className="theme-text-muted text-sm font-sans">
            {doneCount} completed · {openCount} active · {courses.length} total
            {activeCourse && <> — you&apos;re on <span className="theme-accent font-semibold">{activeCourse.title}</span></>}
          </p>
        </motion.div>

        {loading ? (
          <div className="ksurface p-12 text-center">
            <p className="theme-text-muted text-sm font-sans">Loading your track…</p>
          </div>
        ) : notStarted ? (
          <motion.div variants={rise(0.1)} initial="hidden" animate="visible" className="ksurface p-12 text-center">
            <div className="w-16 h-16 rounded-2xl grad-hero flex items-center justify-center mx-auto mb-5">
              <CalendarClock className="w-7 h-7 text-white" />
            </div>
            <h2 className="kinetic-display text-2xl theme-text mb-2">Your class hasn&apos;t started yet</h2>
            <p className="theme-text-muted text-sm font-sans max-w-sm mx-auto">
              Welcome{cohortInfo.name ? ` to ${cohortInfo.name}` : ""}. Your courses will appear here the moment your cohort begins
              {cohortInfo.starts_at ? ` on ${new Date(cohortInfo.starts_at).toLocaleDateString("en-NG", { dateStyle: "long" })}` : ""}.
              Watch your email and announcements for the start date.
            </p>
          </motion.div>
        ) : (
          [{ y: 1, label: "Year One · Certificate" }, { y: 2, label: "Year Two · Diploma" }].map(group => {
            const rows = byYear(group.y);
            if (rows.length === 0) return null;
            return (
              <motion.div key={group.y} variants={rise(0.1)} initial="hidden" animate="visible">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 theme-border" />
                  <span className="theme-accent text-xs tracking-[0.2em] uppercase font-sans px-3">{group.label}</span>
                  <div className="h-px flex-1 theme-border" />
                </div>
                <div className="space-y-2">
                  {rows.map((c, i) => <CourseRow key={c.id} c={c} index={i} />)}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </PortalShell>
  );
}
