"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import {
  Play, FileDown, CheckCircle, Lock,
  ChevronRight, BookOpen, Star, Clock, Mic, Presentation
} from "lucide-react";

interface Subtopic {
  id: string; title: string; order_index: number;
  youtube_video_id?: string; audio_url?: string; slides_url?: string;
  attachment_url?: string; notes_url?: string;
  is_published: boolean;
}

interface Progress { lesson_id: string; status: string; }

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params?.slug as string;

  const [course, setCourse]       = useState<any>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [progress, setProgress]   = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setStudentId(user.id);

      // Load course
      const { data: courseData } = await supabase
        .from("courses").select("*").eq("slug", slug).single();
      if (!courseData) { router.push("/portal/courses"); return; }
      setCourse(courseData);

      // Load published subtopics
      const { data: subs } = await supabase
        .from("lessons")
        .select("id, title, order_index, youtube_video_id, audio_url, slides_url, attachment_url, notes_url, is_published")
        .eq("course_id", courseData.id)
        .eq("is_published", true)
        .order("order_index");
      setSubtopics(subs ?? []);

      // Load student progress
      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("student_id", user.id);
      const progMap: Record<string, string> = {};
      prog?.forEach((p: Progress) => { progMap[p.lesson_id] = p.status; });
      setProgress(progMap);

      // Load course resources
      const { data: res } = await supabase.from("course_resources")
        .select("*").eq("course_id", courseData.id).order("created_at", { ascending: false });
      setResources(res ?? []);

      // Load published assessment for this course
      const { data: ass } = await supabase
        .from("assessments")
        .select("id, title, total_marks, is_published")
        .eq("course_id", courseData.id)
        .eq("is_published", true)
        .single();
      if (ass) setAssessment(ass);

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <PortalShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </PortalShell>
  );

  if (!course) return null;

  const completedCount = subtopics.filter(s => progress[s.id] === "completed").length;
  const totalCount     = subtopics.length;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <PortalShell>
      <div className="max-w-2xl space-y-5">

        {/* Back */}
        <Link href="/portal/courses"
          className="inline-flex items-center gap-1.5 theme-text-muted hover:theme-text text-sm font-sans transition-colors">
          ← My Courses
        </Link>

        {/* Course hero card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] rounded-2xl p-7 relative overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(26,26,46,0.2)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #D4A85C 0%, transparent 70%)", transform: "translate(30%,-40%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="theme-accent text-xs font-sans tracking-[0.15em] uppercase">Year {course.year}</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/40 text-xs font-sans">{course.credits || 3} Credits</span>
            </div>
            <h1 className="text-white text-2xl font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              {course.title}
            </h1>
            {course.description && (
              <p className="text-white/50 text-sm font-sans leading-relaxed mb-5">{course.description}</p>
            )}
            {/* Progress */}
            {totalCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-xs font-sans">{completedCount} of {totalCount} subtopics complete</span>
                  <span className="theme-accent text-xs font-sans font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-[#D4A85C] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Course material download */}
        {course.notes_url && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <a href={course.notes_url} target="_blank" rel="noopener noreferrer" download
              className="flex items-center gap-4 theme-bg-elevated border theme-border rounded-2xl p-4 hover:border-[#D4A85C]/40 hover:shadow-md transition-all group"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-5 h-5 theme-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="theme-text text-sm font-semibold group-hover:theme-accent transition-colors">
                  Course Material
                </div>
                <div className="theme-text-muted text-xs font-sans mt-0.5">Click to download — PDF</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:theme-accent transition-colors" />
            </a>
          </motion.div>
        )}

        {/* Subtopics */}
        <div>
          <h2 className="theme-text text-base font-semibold mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Subtopics {totalCount > 0 && <span className="theme-text-muted text-sm font-sans font-normal">({totalCount})</span>}
          </h2>

          {subtopics.length === 0 ? (
            <div className="theme-bg-elevated border theme-border rounded-2xl p-10 text-center"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Clock className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
              <p className="theme-text text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                No subtopics yet
              </p>
              <p className="theme-text-muted text-xs font-sans">
                Your instructor will publish subtopics here when ready.
              </p>
            </div>
          ) : (
            <div className="theme-bg-elevated rounded-2xl border theme-border overflow-hidden"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {subtopics.map((sub, i) => {
                const isDone = progress[sub.id] === "completed";
                const isNext = !isDone && subtopics.slice(0, i).every(s => progress[s.id] === "completed");
                return (
                  <Link key={sub.id} href={`/portal/lessons/${sub.id}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:theme-bg transition-colors group ${
                      i < subtopics.length - 1 ? "border-b theme-border-soft" : ""
                    }`}>
                    {/* Status icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDone
                        ? "bg-green-50 border border-green-200"
                        : isNext
                        ? "bg-[#1A1A2E] border border-[#1A1A2E]"
                        : "theme-bg-subtle border theme-border"
                    }`}>
                      {isDone
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : isNext
                        ? <Play className="w-3.5 h-3.5 text-white" fill="white" />
                        : <span className="theme-text-faint text-xs font-mono">{String(sub.order_index).padStart(2,"0")}</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${
                        isDone ? "text-green-700" : isNext ? "theme-text" : "theme-text-muted"
                      }`} style={{ fontFamily: "'Georgia', serif" }}>
                        {sub.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sub.youtube_video_id && (
                          <span className="theme-text-muted text-[10px] font-sans flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" /> Video
                          </span>
                        )}
                        {sub.audio_url && (
                          <span className="theme-text-muted text-[10px] font-sans flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" /> Audio
                          </span>
                        )}
                        {sub.slides_url && (
                          <span className="theme-text-muted text-[10px] font-sans flex items-center gap-1">
                            <Presentation className="w-2.5 h-2.5" /> Slides
                          </span>
                        )}
                        {sub.attachment_url && (
                          <span className="theme-text-muted text-[10px] font-sans flex items-center gap-1">
                            <FileDown className="w-2.5 h-2.5" /> File
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status label */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isDone && (
                        <span className="text-green-600 text-xs font-semibold font-sans">Done</span>
                      )}
                      {isNext && (
                        <span className="theme-text text-xs font-semibold font-sans">Start →</span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-colors ${
                        isDone ? "text-green-300" : isNext ? "theme-text" : "text-[#E8E2D9]"
                      } group-hover:theme-accent`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Assessment */}
        {assessment && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href={`/portal/assessments/${assessment.id}`}
              className="flex items-center gap-4 theme-bg-elevated border border-[#D4A85C]/25 rounded-2xl p-5 hover:border-[#D4A85C]/50 hover:shadow-md transition-all group"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 theme-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="theme-accent text-[10px] uppercase tracking-widest font-sans mb-0.5">Course Assessment</div>
                <div className="theme-text text-sm font-semibold group-hover:theme-accent transition-colors">
                  {assessment.title}
                </div>
                <div className="theme-text-muted text-xs font-sans mt-0.5">{assessment.total_marks} marks total</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:theme-accent transition-colors" />
            </Link>
          </motion.div>
        )}
      </div>
    </PortalShell>
  );
}
