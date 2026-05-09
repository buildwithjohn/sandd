"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import {
  Play, BookOpen, ChevronRight, CheckCircle, Clock, TrendingUp,
  Star, Sparkles, GraduationCap, Calendar, FileDown, Megaphone, ArrowRight
} from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState({ name: "Student", church: "", studentNumber: "", enrolled: "" });
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
  const [loading, setLoading] = useState(true);

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
        church: profile.church ?? "",
        studentNumber: profile.student_number ?? "",
        enrolled: new Date(profile.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" }),
      });

      // 1. Enrolled course IDs
      const { data: enrolls } = await supabase
        .from("enrollments").select("course_id").eq("student_id", user.id);
      const courseIds = enrolls?.map((e: any) => e.course_id) ?? [];

      // 2. Fetch enrolled courses
      let courses: any[] = [];
      if (courseIds.length > 0) {
        const { data: c } = await supabase.from("courses")
          .select("id, title, slug, year, description")
          .in("id", courseIds).order("year").order("order_index");
        courses = c ?? [];
      } else {
        // Fallback to year 1 if no enrollments
        const { data: c } = await supabase.from("courses")
          .select("id, title, slug, year, description")
          .eq("year", profile.current_year ?? 1).order("order_index");
        courses = c ?? [];
      }

      setRecentCourses(courses.slice(0, 4));

      // 3. Subtopic progress per course
      const { data: progress } = await supabase
        .from("lesson_progress").select("lesson_id, status").eq("student_id", user.id);
      const completedLessonIds = new Set(progress?.filter(p => p.status === "completed").map(p => p.lesson_id) ?? []);

      // Get all lessons for enrolled courses
      const { data: allLessons } = await supabase
        .from("lessons").select("id, course_id, title, order_index, is_published")
        .in("course_id", courses.map(c => c.id))
        .eq("is_published", true)
        .order("order_index");

      // Calculate courses completed: course where ALL lessons are done
      let coursesCompleted = 0;
      const lessonsByCourse: Record<string, any[]> = {};
      allLessons?.forEach(l => {
        if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = [];
        lessonsByCourse[l.course_id].push(l);
      });
      Object.values(lessonsByCourse).forEach(lessons => {
        if (lessons.length > 0 && lessons.every(l => completedLessonIds.has(l.id))) {
          coursesCompleted++;
        }
      });

      // Find next subtopic to watch
      let nextSub: any = null;
      for (const course of courses) {
        const lessons = lessonsByCourse[course.id] || [];
        const next = lessons.find(l => !completedLessonIds.has(l.id));
        if (next) {
          nextSub = { ...next, courseTitle: course.title, courseSlug: course.slug };
          break;
        }
      }
      setNextSubtopic(nextSub);

      // 4. Assessment scores
      const { data: subs } = await supabase
        .from("assessment_submissions")
        .select("*, assessments(total_marks, course_id, title, courses(title))")
        .eq("student_id", user.id)
        .eq("status", "graded")
        .eq("results_released", true);

      let avg = 0;
      if (subs && subs.length > 0) {
        const total = subs.reduce((sum, s: any) =>
          sum + (s.total_score / (s.assessments?.total_marks || 100)) * 100, 0);
        avg = Math.round(total / subs.length);
      }

      // Pending assessments (published, enrolled course, not yet submitted)
      const { data: published } = await supabase
        .from("assessments").select("*, courses(title, slug)")
        .in("course_id", courses.map(c => c.id))
        .eq("is_published", true);
      const submittedIds = new Set(subs?.map((s: any) => s.assessment_id) ?? []);
      const { data: allSubs } = await supabase
        .from("assessment_submissions").select("assessment_id").eq("student_id", user.id);
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

      // Announcements
      const { data: ann } = await supabase.from("announcements")
        .select("*").order("published_at", { ascending: false }).limit(3);
      setAnnouncements(ann ?? []);

      setLoading(false);
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
      <div className="space-y-6">

        {/* ── HERO GREETING ─────────────────────────────────────────── */}
        <motion.div variants={rise()} initial="hidden" animate="visible"
          className="relative bg-gradient-to-br from-[#1A1A2E] via-[#1F1F3A] to-[#0F0F1F] rounded-3xl p-6 sm:p-8 overflow-hidden"
          style={{ boxShadow: "0 12px 40px rgba(26,26,46,0.25)" }}>

          {/* Decorative gradient blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #D4A85C 0%, transparent 60%)" }} />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #D4A85C 0%, transparent 70%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A85C]" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-semibold">{greeting}</span>
            </div>
            <h1 className="text-white text-3xl sm:text-4xl font-medium mb-2 leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", letterSpacing: "-0.02em" }}>
              {firstName}.
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/40 text-sm">
              {student.studentNumber && (
                <span className="font-mono text-[#D4A85C]/70 text-xs">{student.studentNumber}</span>
              )}
              {student.studentNumber && <span className="text-white/20">·</span>}
              <span>Enrolled {student.enrolled}</span>
            </div>
          </div>
        </motion.div>

        {/* ── QUICK STATS ───────────────────────────────────────────── */}
        <motion.div variants={rise(0.1)} initial="hidden" animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: GraduationCap, label: "Courses Enrolled",  value: stats.coursesEnrolled,  total: null,                tint: "#1A1A2E", iconBg: "bg-[#1A1A2E]/10",      iconColor: "text-[#1A1A2E]"  },
            { icon: CheckCircle,   label: "Courses Done",       value: stats.coursesCompleted, total: stats.coursesEnrolled, tint: "#16A34A", iconBg: "bg-green-50",         iconColor: "text-green-600"   },
            { icon: Play,          label: "Subtopics Watched",  value: stats.subtopicsWatched, total: null,                tint: "#D4A85C", iconBg: "bg-[#D4A85C]/10",     iconColor: "text-[#D4A85C]"   },
            { icon: TrendingUp,    label: stats.assessmentCount > 0 ? `Avg (${stats.assessmentCount} assess)` : "No exams yet", value: stats.assessmentAvg > 0 ? `${stats.assessmentAvg}%` : "—", total: null, tint: "#3B82F6", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#EAE3D6] rounded-2xl p-4 hover:border-[#D4A85C]/30 transition-all group">
              <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[#1A1A2E] text-2xl font-semibold tabular-nums"
                  style={{ fontFamily: "var(--font-fraunces)" }}>{s.value}</span>
                {s.total !== null && s.total > 0 && (
                  <span className="text-[#9B9B9B] text-sm font-normal">/ {s.total}</span>
                )}
              </div>
              <div className="text-[#8B8B8B] text-[11px] mt-1 leading-tight">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── ORIENTATION RECORDING ─────────────────────────────────── */}
        <motion.div variants={rise(0.18)} initial="hidden" animate="visible"
          className="bg-white border border-[#EAE3D6] rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-3.5 border-b border-[#F0EDE8] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#1A1A2E] text-sm font-semibold truncate" style={{ fontFamily: "var(--font-fraunces)" }}>
                Orientation Recording
              </span>
              <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
                Watch Now
              </span>
            </div>
            <span className="text-[#9B9B9B] text-xs flex-shrink-0">7 May 2026</span>
          </div>
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://www.youtube.com/embed/5avJn6tSOHw?rel=0&modestbranding=1"
              title="S&D Prophetic School — Orientation 2026"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>

        {/* ── CONTINUE LEARNING ─────────────────────────────────────── */}
        {nextSubtopic && (
          <motion.div variants={rise(0.2)} initial="hidden" animate="visible">
            <Link href={`/portal/lessons/${nextSubtopic.id}`}
              className="group block bg-gradient-to-br from-[#D4A85C]/[0.08] via-[#FAF6EA] to-[#FAF9F6] border border-[#D4A85C]/25 rounded-2xl p-5 hover:border-[#D4A85C]/50 transition-all"
              style={{ boxShadow: "0 2px 12px rgba(212,168,92,0.12)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 text-[#D4A85C]" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#8B7355] text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Continue Where You Left Off
                  </div>
                  <div className="text-[#1A1A2E] text-base font-semibold truncate group-hover:text-[#8B6F35] transition-colors"
                    style={{ fontFamily: "var(--font-fraunces)" }}>
                    {nextSubtopic.title}
                  </div>
                  <div className="text-[#9B9B9B] text-xs mt-0.5 truncate">{nextSubtopic.courseTitle}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#D4A85C] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── PENDING ASSESSMENTS ─────────────────────────────────── */}
        {pendingAssessments.length > 0 && (
          <motion.div variants={rise(0.25)} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1A1A2E] text-base font-semibold flex items-center gap-2"
                style={{ fontFamily: "var(--font-fraunces)" }}>
                <Star className="w-4 h-4 text-[#D4A85C]" />
                Assessments Due
              </h2>
              <Link href="/portal/assessments" className="text-[#8B7355] hover:text-[#1A1A2E] text-xs transition-colors flex items-center gap-1">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingAssessments.map((a, i) => (
                <Link key={a.id} href={`/portal/assessments/${a.id}`}
                  className="group flex items-center gap-4 bg-white border border-[#EAE3D6] rounded-2xl px-5 py-4 hover:border-[#D4A85C]/40 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-[#D4A85C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#8B7355] text-[10px] uppercase tracking-widest mb-0.5">
                      {a.courses?.title}
                    </div>
                    <div className="text-[#1A1A2E] text-sm font-semibold truncate group-hover:text-[#D4A85C] transition-colors">
                      {a.title}
                    </div>
                    <div className="text-[#9B9B9B] text-xs mt-0.5">
                      {a.total_marks} marks
                      {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}`}
                    </div>
                  </div>
                  <span className="bg-[#1A1A2E] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
                    Take
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── COURSES & ANNOUNCEMENTS — TWO COLS ON DESKTOP ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Courses */}
          <motion.div variants={rise(0.3)} initial="hidden" animate="visible" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1A1A2E] text-base font-semibold flex items-center gap-2"
                style={{ fontFamily: "var(--font-fraunces)" }}>
                <BookOpen className="w-4 h-4 text-[#D4A85C]" />
                Your Courses
              </h2>
              <Link href="/portal/courses" className="text-[#8B7355] hover:text-[#1A1A2E] text-xs transition-colors flex items-center gap-1">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recentCourses.length === 0 ? (
              <div className="bg-white border border-[#EAE3D6] rounded-2xl p-10 text-center">
                <BookOpen className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
                <p className="text-[#9B9B9B] text-sm">No courses yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#EAE3D6] overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {recentCourses.map((course, i) => (
                  <Link key={course.id} href={`/portal/courses/${course.slug}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-[#FAF9F6] transition-colors group
                      ${i < recentCourses.length - 1 ? "border-b border-[#F5F0E8]" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6EA] border border-[#EAE3D6] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#D4A85C] text-xs font-mono font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#1A1A2E] text-sm font-semibold truncate group-hover:text-[#D4A85C] transition-colors"
                        style={{ fontFamily: "var(--font-fraunces)" }}>
                        {course.title}
                      </div>
                      <div className="text-[#9B9B9B] text-xs mt-0.5">Year {course.year}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#D4A85C] transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Announcements */}
          <motion.div variants={rise(0.35)} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#1A1A2E] text-base font-semibold flex items-center gap-2"
                style={{ fontFamily: "var(--font-fraunces)" }}>
                <Megaphone className="w-4 h-4 text-[#D4A85C]" />
                Announcements
              </h2>
              <Link href="/portal/announcements" className="text-[#8B7355] hover:text-[#1A1A2E] text-xs transition-colors">
                All
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 text-center">
                <p className="text-[#9B9B9B] text-xs">No announcements.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {announcements.map(a => (
                  <Link key={a.id} href="/portal/announcements"
                    className="block bg-white border border-[#EAE3D6] rounded-2xl p-4 hover:border-[#D4A85C]/30 transition-all">
                    {a.is_pinned && (
                      <div className="text-[#D4A85C] text-[9px] tracking-widest uppercase font-semibold mb-1.5">
                        Pinned
                      </div>
                    )}
                    <div className="text-[#1A1A2E] text-sm font-semibold mb-1 line-clamp-2"
                      style={{ fontFamily: "var(--font-fraunces)" }}>
                      {a.title}
                    </div>
                    <div className="text-[#9B9B9B] text-[11px] flex items-center gap-1">
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
