"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import {
  Play, BookOpen, ChevronRight, CheckCircle, Clock,
  Star, GraduationCap, Megaphone, ArrowUpRight, TrendingUp
} from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as any } }
});

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState({ name: "Student", studentNumber: "", enrolled: "" });
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    subtopicsWatched: 0,
    assessmentAvg: 0,
    assessmentCount: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [nextSubtopic, setNextSubtopic] = useState<any>(null);
  const [pendingAssessments, setPendingAssessments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!profile) return;
      if (profile.role === "admin" || profile.role === "super_admin") { router.push("/admin/dashboard"); return; }

      setStudent({
        name: profile.full_name ?? "Student",
        studentNumber: profile.student_number ?? "",
        enrolled: new Date(profile.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" }),
      });

      const { data: enrolls } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      const courseIds = enrolls?.map((e: any) => e.course_id) ?? [];
      let courses: any[] = [];
      if (courseIds.length > 0) {
        const { data: c } = await supabase.from("courses").select("id, title, slug, year, description").in("id", courseIds).order("year").order("order_index");
        courses = c ?? [];
      } else {
        const { data: c } = await supabase.from("courses").select("id, title, slug, year, description").eq("year", profile.current_year ?? 1).order("order_index");
        courses = c ?? [];
      }
      setRecentCourses(courses.slice(0, 4));

      const { data: progress } = await supabase.from("lesson_progress").select("lesson_id, status").eq("student_id", user.id);
      const completedLessonIds = new Set(progress?.filter(p => p.status === "completed").map(p => p.lesson_id) ?? []);

      const { data: allLessons } = await supabase.from("lessons").select("id, course_id, title, order_index, is_published").in("course_id", courses.map(c => c.id)).eq("is_published", true).order("order_index");

      let coursesCompleted = 0;
      const lessonsByCourse: Record<string, any[]> = {};
      allLessons?.forEach(l => {
        if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = [];
        lessonsByCourse[l.course_id].push(l);
      });
      Object.values(lessonsByCourse).forEach(lessons => {
        if (lessons.length > 0 && lessons.every(l => completedLessonIds.has(l.id))) coursesCompleted++;
      });

      let nextSub: any = null;
      for (const course of courses) {
        const lessons = lessonsByCourse[course.id] || [];
        const next = lessons.find(l => !completedLessonIds.has(l.id));
        if (next) { nextSub = { ...next, courseTitle: course.title, courseSlug: course.slug }; break; }
      }
      setNextSubtopic(nextSub);

      const { data: subs } = await supabase.from("assessment_submissions").select("*, assessments(total_marks, course_id, title, courses(title))").eq("student_id", user.id).eq("status", "graded").eq("results_released", true);
      let avg = 0;
      if (subs && subs.length > 0) {
        const total = subs.reduce((sum, s: any) => sum + (s.total_score / (s.assessments?.total_marks || 100)) * 100, 0);
        avg = Math.round(total / subs.length);
      }
      const { data: published } = await supabase.from("assessments").select("*, courses(title, slug)").in("course_id", courses.map(c => c.id)).eq("is_published", true);
      const submittedIds = new Set();
      const { data: allSubs } = await supabase.from("assessment_submissions").select("assessment_id").eq("student_id", user.id);
      allSubs?.forEach((s: any) => submittedIds.add(s.assessment_id));
      const pending = published?.filter((a: any) => !submittedIds.has(a.id)) ?? [];
      setPendingAssessments(pending.slice(0, 3));

      setStats({
        coursesEnrolled: courses.length,
        coursesCompleted,
        subtopicsWatched: completedLessonIds.size,
        assessmentAvg: avg,
        assessmentCount: subs?.length ?? 0,
      });

      const { data: ann } = await supabase.from("announcements").select("*").order("published_at", { ascending: false }).limit(3);
      setAnnouncements(ann ?? []);
    }
    load();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const firstName = student.name.split(" ")[0];

  return (
    <PortalShell>
      <div className="space-y-6 max-w-6xl">

        {/* ── HERO — DEEP ROYAL CARD ─────────────────────────────────── */}
        <motion.div variants={rise()} initial="hidden" animate="visible"
          className="relative rounded-[28px] p-8 sm:p-12 overflow-hidden border border-royal-700"
          style={{
            background: "linear-gradient(135deg, #2D1B5E 0%, #1F1342 50%, #150C2E 100%)",
            boxShadow: "0 24px 60px -20px rgba(45, 27, 94, 0.45)",
          }}>

          {/* Gold leaf accent — top right */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-50"
            style={{ background: "radial-gradient(ellipse at top right, rgba(201, 169, 97, 0.18) 0%, transparent 60%)" }} />

          {/* Subtle texture pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          {/* Gold corner ornament */}
          <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-gilt-500/40 hidden sm:block" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-gilt-500/40 hidden sm:block" />

          <div className="relative z-10">
            <div className="text-gilt-400 text-[10px] tracking-[0.4em] uppercase font-medium mb-6 sm:mb-8" style={{ fontFamily: "'Arial', sans-serif" }}>
              {greeting}
            </div>

            {/* The dramatic editorial heading */}
            <h1 className="text-white leading-[0.95] tracking-tight mb-2"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 600 }}>
              {firstName}
            </h1>

            <div className="flex items-center gap-4 mt-6 sm:mt-8">
              {student.studentNumber && (
                <>
                  <span className="text-white text-sm font-mono tracking-wider font-semibold">
                    {student.studentNumber}
                  </span>
                  <span className="w-px h-4 bg-white/20" />
                </>
              )}
              <span className="text-white/60 text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'Arial', sans-serif" }}>
                Enrolled {student.enrolled}
              </span>
            </div>

            {/* Scripture verse — the spiritual gravitas */}
            <div className="mt-8 sm:mt-12 pl-4 border-l-2 border-gilt-500/40">
              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl"
                style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
                He gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers.
              </p>
              <p className="text-gilt-400 text-xs tracking-[0.25em] uppercase mt-2" style={{ fontFamily: "'Arial', sans-serif" }}>
                Ephesians 4:11
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── EDITORIAL STAT CARDS ─────────────────────────────────── */}
        <motion.div variants={rise(0.1)} initial="hidden" animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Courses",      sublabel: "Enrolled",  value: stats.coursesEnrolled,     suffix: null },
            { label: "Completed",    sublabel: "Courses",   value: stats.coursesCompleted,    suffix: stats.coursesEnrolled },
            { label: "Subtopics",    sublabel: "Watched",   value: stats.subtopicsWatched,    suffix: null },
            { label: stats.assessmentCount > 0 ? "Average" : "No Exams", sublabel: stats.assessmentCount > 0 ? `${stats.assessmentCount} graded` : "yet",
              value: stats.assessmentAvg > 0 ? `${stats.assessmentAvg}` : "—", suffix: stats.assessmentAvg > 0 ? "%" : null },
          ].map((s, i) => (
            <div key={i}
              className="bg-white border border-ivory-300 rounded-2xl p-5 hover:border-gilt-400/50 transition-all group">
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-ink-800 tabular-nums leading-none"
                  style={{ fontFamily: "'Georgia', serif", fontWeight: 600 }}>
                  {s.value}
                </span>
                {s.suffix && (
                  <span className="text-ink-400 text-base"
                    style={{ fontFamily: "'Georgia', serif" }}>
                    {typeof s.suffix === "number" ? `/ ${s.suffix}` : s.suffix}
                  </span>
                )}
              </div>
              <div className="border-t border-ivory-300 pt-2.5">
                <div className="text-ink-800 text-xs font-medium" style={{ fontFamily: "'Arial', sans-serif" }}>
                  {s.label}
                </div>
                <div className="text-ink-400 text-[10px] tracking-wider uppercase mt-0.5" style={{ fontFamily: "'Arial', sans-serif" }}>
                  {s.sublabel}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── ORIENTATION RECORDING ─────────────────────────────────── */}
        <motion.div variants={rise(0.18)} initial="hidden" animate="visible"
          className="bg-white border border-ivory-300 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 20px -8px rgba(45, 27, 94, 0.08)" }}>
          <div className="px-6 py-4 border-b border-ivory-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1 h-8 bg-gilt-500 rounded-full" />
              <div className="min-w-0">
                <div className="text-ink-800 text-base sm:text-lg truncate" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                  Cohort Orientation
                </div>
                <div className="text-ink-400 text-[11px] tracking-wider uppercase mt-0.5" style={{ fontFamily: "'Arial', sans-serif" }}>
                  7 May 2026 · Recording
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase bg-royal-50 text-royal-700 border border-royal-100 px-3 py-1.5 rounded-full">
              Watch Now
            </span>
          </div>
          <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
            <iframe src="https://www.youtube.com/embed/5avJn6tSOHw?rel=0&modestbranding=1"
              title="S&D Prophetic School — Orientation 2026"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        </motion.div>

        {/* ── CONTINUE LEARNING ─────────────────────────────────────── */}
        {nextSubtopic && (
          <motion.div variants={rise(0.22)} initial="hidden" animate="visible">
            <Link href={`/portal/lessons/${nextSubtopic.id}`}
              className="group block relative bg-white border border-ivory-300 rounded-2xl p-6 sm:p-8 hover:border-gilt-400/60 transition-all overflow-hidden"
              style={{ boxShadow: "0 4px 20px -8px rgba(45, 27, 94, 0.08)" }}>

              <div className="absolute top-0 right-0 w-1/3 h-full opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at right, rgba(201, 169, 97, 0.15) 0%, transparent 70%)" }} />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-royal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ boxShadow: "0 8px 24px -8px rgba(45, 27, 94, 0.4)" }}>
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-gilt-400" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gilt-700 text-[10px] uppercase tracking-[0.3em] font-medium mb-2" style={{ fontFamily: "'Arial', sans-serif" }}>
                    Continue Where You Left Off
                  </div>
                  <div className="text-ink-800 text-xl sm:text-2xl mb-1.5" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                    {nextSubtopic.title}
                  </div>
                  <div className="text-ink-400 text-sm" style={{ fontFamily: "'Arial', sans-serif" }}>
                    {nextSubtopic.courseTitle}
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gilt-600 group-hover:rotate-12 transition-transform flex-shrink-0 hidden sm:block" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── PENDING ASSESSMENTS ───────────────────────────────────── */}
        {pendingAssessments.length > 0 && (
          <motion.div variants={rise(0.26)} initial="hidden" animate="visible">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-ink-800 text-2xl sm:text-3xl" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                Assessments Due
              </h2>
              <Link href="/portal/assessments" className="text-ink-400 hover:text-royal-700 text-xs uppercase tracking-wider transition-colors flex items-center gap-1" style={{ fontFamily: "'Arial', sans-serif" }}>
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingAssessments.map((a) => (
                <Link key={a.id} href={`/portal/assessments/${a.id}`}
                  className="group flex items-center gap-4 bg-white border border-ivory-300 rounded-2xl px-5 py-4 hover:border-royal-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gilt-50 border border-gilt-200 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-gilt-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-400 text-[10px] uppercase tracking-widest mb-0.5" style={{ fontFamily: "'Arial', sans-serif" }}>
                      {a.courses?.title}
                    </div>
                    <div className="text-ink-800 text-base truncate" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                      {a.title}
                    </div>
                    <div className="text-ink-400 text-xs mt-0.5" style={{ fontFamily: "'Arial', sans-serif" }}>
                      {a.total_marks} marks{a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}`}
                    </div>
                  </div>
                  <span className="bg-royal-700 text-white text-xs font-medium px-4 py-2 rounded-full flex-shrink-0 group-hover:bg-royal-800 transition-colors" style={{ fontFamily: "'Arial', sans-serif" }}>
                    Take
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── COURSES + ANNOUNCEMENTS ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Courses */}
          <motion.div variants={rise(0.3)} initial="hidden" animate="visible" className="lg:col-span-2">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-ink-800 text-2xl sm:text-3xl" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                Your Courses
              </h2>
              <Link href="/portal/courses" className="text-ink-400 hover:text-royal-700 text-xs uppercase tracking-wider transition-colors flex items-center gap-1" style={{ fontFamily: "'Arial', sans-serif" }}>
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recentCourses.length === 0 ? (
              <div className="bg-white border border-ivory-300 rounded-2xl p-12 text-center">
                <BookOpen className="w-10 h-10 text-ivory-300 mx-auto mb-3" />
                <p className="text-ink-400 text-sm" style={{ fontFamily: "'Arial', sans-serif" }}>No courses yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-ivory-300 overflow-hidden"
                style={{ boxShadow: "0 4px 20px -8px rgba(45, 27, 94, 0.06)" }}>
                {recentCourses.map((course, i) => (
                  <Link key={course.id} href={`/portal/courses/${course.slug}`}
                    className={`flex items-center gap-5 px-5 py-5 hover:bg-ivory-50 transition-colors group
                      ${i < recentCourses.length - 1 ? "border-b border-ivory-200" : ""}`}>
                    <div className="text-gilt-600 text-2xl font-mono leading-none flex-shrink-0 w-8" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-ink-800 text-lg leading-tight truncate group-hover:text-royal-700 transition-colors"
                        style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                        {course.title}
                      </div>
                      <div className="text-ink-400 text-xs mt-1 tracking-wider uppercase" style={{ fontFamily: "'Arial', sans-serif" }}>
                        Year {course.year}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-ivory-300 group-hover:text-gilt-600 group-hover:rotate-12 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Announcements */}
          <motion.div variants={rise(0.35)} initial="hidden" animate="visible">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-ink-800 text-2xl sm:text-3xl" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                News
              </h2>
              <Link href="/portal/announcements" className="text-ink-400 hover:text-royal-700 text-xs uppercase tracking-wider transition-colors" style={{ fontFamily: "'Arial', sans-serif" }}>
                All
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white border border-ivory-300 rounded-2xl p-6 text-center">
                <p className="text-ink-400 text-xs" style={{ fontFamily: "'Arial', sans-serif" }}>No announcements.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {announcements.map(a => (
                  <Link key={a.id} href="/portal/announcements"
                    className="block bg-white border border-ivory-300 rounded-2xl p-4 hover:border-gilt-400/40 transition-all">
                    {a.is_pinned && (
                      <div className="text-gilt-600 text-[9px] tracking-[0.3em] uppercase font-medium mb-2" style={{ fontFamily: "'Arial', sans-serif" }}>
                        ◆ Pinned
                      </div>
                    )}
                    <div className="text-ink-800 text-base leading-tight mb-2 line-clamp-2"
                      style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
                      {a.title}
                    </div>
                    <div className="text-ink-400 text-[10px] tracking-wider uppercase flex items-center gap-1" style={{ fontFamily: "'Arial', sans-serif" }}>
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(a.published_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PortalShell>
  );
}
