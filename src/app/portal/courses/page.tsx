"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { BookOpen, Lock, ChevronRight, CheckCircle } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function CoursesPortalPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("current_year").eq("id", user.id).single();
      setCurrentYear(profile?.current_year ?? 1);
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("courses(id, title, slug, year, description)")
        .eq("student_id", user.id)
        .order("course_id");
      setCourses(enrollments?.map((e: any) => e.courses).filter(Boolean) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const year1 = courses.filter(c => c.year === 1);
  const year2 = courses.filter(c => c.year === 2);

  return (
    <PortalShell>
      <div className="space-y-6">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            My Courses
          </h1>
          <p className="text-[#9B9B9B] text-sm font-sans">Your enrolled courses for Year {currentYear}</p>
        </motion.div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center">
            <p className="text-[#9B9B9B] text-sm font-sans">Loading courses...</p>
          </div>
        ) : (
          <>
            {/* Year 1 */}
            <motion.div variants={rise(0.1)} initial="hidden" animate="visible">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[#E8E2D9]" />
                <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans px-3">Year One · Certificate</span>
                <div className="h-px flex-1 bg-[#E8E2D9]" />
              </div>
              <div className="space-y-2">
                {year1.map((course, i) => (
                  <motion.div key={course.id} variants={rise(i * 0.06)} initial="hidden" animate="visible">
                    <Link href={`/portal/courses/${course.slug}`}
                      className="group bg-white rounded-2xl border border-[#E8E2D9] p-5 flex items-center gap-4 hover:border-[#D4A85C]/40 hover:shadow-md transition-all block"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] border border-[#E8E2D9] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#8B7355] text-xs font-mono font-semibold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#1A1A2E] text-sm font-semibold mb-0.5 group-hover:text-[#D4A85C] transition-colors"
                          style={{ fontFamily: "'Georgia', serif" }}>{course.title}</div>
                        {course.description && (
                          <p className="text-[#9B9B9B] text-xs font-sans leading-relaxed line-clamp-1">{course.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#D4A85C] transition-colors flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Year 2 */}
            <motion.div variants={rise(0.25)} initial="hidden" animate="visible">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[#E8E2D9]" />
                <span className="text-[#9B9B9B] text-xs tracking-[0.2em] uppercase font-sans px-3">Year Two · Diploma</span>
                <div className="h-px flex-1 bg-[#E8E2D9]" />
              </div>
              {currentYear < 2 ? (
                <div className="bg-white rounded-2xl border border-[#E8E2D9] p-8 text-center"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <Lock className="w-8 h-8 text-[#D4D0C8] mx-auto mb-3" />
                  <p className="text-[#1A1A2E] text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                    Year 2 Unlocks After Year 1
                  </p>
                  <p className="text-[#9B9B9B] text-xs font-sans">
                    Complete all Year 1 courses to advance to the Diploma programme.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {year2.map((course, i) => (
                    <Link key={course.id} href={`/portal/courses/${course.slug}`}
                      className="group bg-white rounded-2xl border border-[#D4A85C]/15 p-5 flex items-center gap-4 hover:border-[#D4A85C]/40 hover:shadow-md transition-all block"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/8 border border-[#D4A85C]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#D4A85C] text-xs font-mono font-semibold">
                          {String(i + 7).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#1A1A2E] text-sm font-semibold mb-0.5 group-hover:text-[#D4A85C] transition-colors"
                          style={{ fontFamily: "'Georgia', serif" }}>{course.title}</div>
                        {course.description && (
                          <p className="text-[#9B9B9B] text-xs font-sans leading-relaxed line-clamp-1">{course.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#D4A85C] transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
