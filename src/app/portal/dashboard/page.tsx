"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Play, BookOpen, ChevronRight, CheckCircle, Clock, TrendingUp } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent]   = useState({ name: "Student", church: "", enrolled: "" });
  const [stats, setStats]       = useState({ courses: 0, lessons: 0, quiz_avg: 0 });
  const [welcomeId, setWelcomeId] = useState<string | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

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
        enrolled: new Date(profile.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" }),
      });

      const { data: welcome } = await supabase.from("lessons").select("id").eq("title", "Welcome to S&D Prophetic School").single();
      if (welcome) setWelcomeId(welcome.id);

      const { count: courses } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("student_id", user.id);
      const { data: progress } = await supabase.from("lesson_progress").select("status").eq("student_id", user.id);
      const completed = progress?.filter(p => p.status === "completed").length ?? 0;
      const { data: attempts } = await supabase.from("quiz_attempts").select("score").eq("student_id", user.id);
      const avg = attempts?.length ? Math.round(attempts.reduce((a: number, b: { score: number }) => a + b.score, 0) / attempts.length) : 0;
      setStats({ courses: courses ?? 0, lessons: completed, quiz_avg: avg });

      const { data: enrollments } = await supabase
        .from("enrollments").select("courses(id, title, slug, year)").eq("student_id", user.id).limit(4);
      setRecentCourses(enrollments?.map((e: any) => e.courses).filter(Boolean) ?? []);

      const { data: ann } = await supabase.from("announcements").select("*").order("published_at", { ascending: false }).limit(3);
      setAnnouncements(ann ?? []);
    }
    load();
  }, []);

  const firstName = student.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <PortalShell>
      <div className="space-y-6">

        {/* ── GREETING ─────────────────────────────────────────────── */}
        <motion.div variants={rise(0)} initial="hidden" animate="visible"
          className="bg-[#1A1A2E] rounded-2xl p-7 relative overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(26,26,46,0.15)" }}>
          {/* Gold glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #D4A85C 0%, transparent 70%)", transform: "translate(30%, -40%)" }} />
          <div className="relative z-10">
            <p className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans mb-2">{greeting}</p>
            <h1 className="text-white text-3xl font-medium mb-1" style={{ fontFamily: "'Georgia', serif" }}>
              {firstName}
            </h1>
            <p className="text-white/50 text-sm font-sans">{student.church} · Enrolled {student.enrolled}</p>
          </div>
        </motion.div>

        {/* ── STATS ROW ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: BookOpen,    label: "Courses Enrolled",    value: stats.courses,   color: "text-[#1A1A2E]" },
            { icon: CheckCircle, label: "Lessons Completed",   value: stats.lessons,   color: "text-green-600"  },
            { icon: TrendingUp,  label: "Quiz Average",        value: stats.quiz_avg ? `${stats.quiz_avg}%` : "—", color: "text-[#D4A85C]" },
          ].map((s, i) => (
            <motion.div key={s.label} variants={rise(i * 0.08)} initial="hidden" animate="visible"
              className="bg-white rounded-2xl border border-[#E8E2D9] p-5"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <s.icon className={`w-4 h-4 ${s.color} mb-3 opacity-70`} />
              <div className={`text-2xl font-semibold ${s.color} mb-1`}
                style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-[#9B9B9B] text-xs font-sans">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── WELCOME MODULE ───────────────────────────────────────── */}
        {welcomeId && (
          <motion.div variants={rise(0.2)} initial="hidden" animate="visible">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 flex items-center gap-4"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-12 h-12 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-[#D4A85C]" fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#8B7355] text-[10px] uppercase tracking-widest font-sans mb-0.5">Start Here</div>
                <div className="text-[#1A1A2E] text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                  Welcome from Prophet Abiodun Sule
                </div>
                <div className="text-[#9B9B9B] text-xs font-sans mt-0.5">Watch this before starting your first course</div>
              </div>
              <Link href={`/portal/lessons/${welcomeId}`}
                className="bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 hover:shadow-md">
                Watch <Play className="w-3 h-3" fill="currentColor" />
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── MY COURSES ────────────────────────────────────────── */}
          <motion.div variants={rise(0.25)} initial="hidden" animate="visible">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EDE8]">
                <h2 className="text-[#1A1A2E] text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                  My Courses
                </h2>
                <Link href="/portal/courses" className="text-[#8B7355] hover:text-[#1A1A2E] text-xs font-sans transition-colors flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {recentCourses.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="w-8 h-8 text-[#E8E2D9] mx-auto mb-2" />
                  <p className="text-[#9B9B9B] text-sm font-sans">No courses yet</p>
                </div>
              ) : (
                <div>
                  {recentCourses.map((course, i) => (
                    <Link key={course.id} href={`/portal/courses/${course.slug}`}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors group
                        ${i < recentCourses.length - 1 ? "border-b border-[#F5F0E8]" : ""}`}>
                      <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#8B7355] text-xs font-mono font-medium">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#1A1A2E] text-xs font-semibold truncate">{course.title}</div>
                        <div className="text-[#9B9B9B] text-[10px] font-sans mt-0.5">Year {course.year}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#D4D0C8] group-hover:text-[#D4A85C] transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── ANNOUNCEMENTS ─────────────────────────────────────── */}
          <motion.div variants={rise(0.3)} initial="hidden" animate="visible">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0EDE8]">
                <h2 className="text-[#1A1A2E] text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                  Announcements
                </h2>
                <Link href="/portal/announcements" className="text-[#8B7355] hover:text-[#1A1A2E] text-xs font-sans transition-colors flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {announcements.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#9B9B9B] text-sm font-sans">No announcements yet</p>
                </div>
              ) : (
                <div>
                  {announcements.map((a, i) => (
                    <div key={a.id}
                      className={`px-5 py-4 ${i < announcements.length - 1 ? "border-b border-[#F5F0E8]" : ""}`}>
                      <div className="flex items-start gap-2">
                        {a.is_pinned && (
                          <span className="text-[#D4A85C] text-[10px] bg-[#D4A85C]/10 border border-[#D4A85C]/20 px-2 py-0.5 rounded-full font-sans flex-shrink-0 mt-0.5">
                            Pinned
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="text-[#1A1A2E] text-xs font-semibold mb-1">{a.title}</div>
                          <p className="text-[#9B9B9B] text-xs font-sans leading-relaxed line-clamp-2">{a.body}</p>
                          <div className="text-[#C4BDB2] text-[10px] font-sans mt-1.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(a.published_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── SCRIPTURE CARD ───────────────────────────────────────── */}
        <motion.div variants={rise(0.35)} initial="hidden" animate="visible">
          <div className="rounded-2xl border border-[#D4A85C]/20 bg-[#D4A85C]/[0.04] p-6 text-center">
            <p className="text-[#5C4A2A] text-sm italic leading-relaxed mb-2 max-w-xl mx-auto"
              style={{ fontFamily: "'Georgia', serif" }}>
              &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo;
            </p>
            <span className="text-[#D4A85C] text-xs font-sans tracking-[0.15em] uppercase">1 Corinthians 14:3</span>
          </div>
        </motion.div>
      </div>
    </PortalShell>
  );
}
