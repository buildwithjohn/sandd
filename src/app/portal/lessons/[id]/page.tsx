"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle,
  Loader2, FileDown, Star
} from "lucide-react";

interface Lesson {
  id: string; title: string; order_index: number;
  youtube_video_id?: string;
  audio_url?: string;
  courses: { id: string; title: string; slug: string; year: number; notes_url?: string; };
}

export default function LessonPage() {
  const params   = useParams();
  const router   = useRouter();
  const lessonId = params?.id as string;

  const [lesson, setLesson]         = useState<Lesson | null>(null);
  const [studentId, setStudentId]   = useState("");
  const [completed, setCompleted]   = useState(false);
  const [marking, setMarking]       = useState(false);
  const [prevLesson, setPrevLesson] = useState<{ id: string; title: string } | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setStudentId(user.id);

      // Load lesson + course
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*, courses(id, title, slug, year, notes_url)")
        .eq("id", lessonId).single();
      if (!lessonData) { router.push("/portal/courses"); return; }
      setLesson(lessonData);

      // Progress
      const { data: progress } = await supabase.from("lesson_progress")
        .select("status").eq("student_id", user.id).eq("lesson_id", lessonId).single();
      if (progress?.status === "completed") setCompleted(true);

      // Prev/Next in same course
      const { data: siblings } = await supabase.from("lessons")
        .select("id, title, order_index")
        .eq("course_id", lessonData.course_id)
        .eq("is_published", true)
        .order("order_index");
      if (siblings) {
        const idx = siblings.findIndex((l: any) => l.id === lessonId);
        if (idx > 0)                    setPrevLesson(siblings[idx - 1]);
        if (idx < siblings.length - 1) setNextLesson(siblings[idx + 1]);
      }

      // Course assessment
      const { data: ass } = await supabase.from("assessments")
        .select("id, title, total_marks")
        .eq("course_id", lessonData.course_id)
        .eq("is_published", true)
        .single();
      if (ass) setAssessment(ass);

      setLoading(false);
    }
    load();
  }, [lessonId]);

  async function markComplete() {
    setMarking(true);
    const supabase = createClient();
    await supabase.from("lesson_progress").upsert({
      student_id: studentId, lesson_id: lessonId,
      status: "completed", watch_percent: 100,
    }, { onConflict: "student_id,lesson_id" });
    setCompleted(true);
    setMarking(false);
  }

  if (loading || !lesson) return (
    <PortalShell>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 theme-accent animate-spin" />
      </div>
    </PortalShell>
  );

  return (
    <PortalShell>
      <div className="max-w-2xl space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans theme-text-muted flex-wrap">
          <Link href="/portal/courses" className="hover:theme-text transition-colors">Courses</Link>
          <span>/</span>
          <Link href={`/portal/courses/${lesson.courses.slug}`} className="hover:theme-text transition-colors">
            {lesson.courses.title}
          </Link>
          <span>/</span>
          <span className="theme-text truncate max-w-[180px]">{lesson.title}</span>
        </div>

        {/* Title + status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="theme-accent text-[10px] uppercase tracking-widest font-sans mb-1">
              Subtopic {lesson.order_index}
            </p>
            <h1 className="text-xl font-semibold theme-text" style={{ fontFamily: "'Georgia', serif" }}>
              {lesson.title}
            </h1>
          </div>
          {completed && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </div>
          )}
        </div>

        {/* Video or Audio */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {lesson.youtube_video_id ? (
            <div className="rounded-2xl overflow-hidden bg-black border theme-border"
              style={{ aspectRatio: "16/9", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <iframe
                src={`https://www.youtube.com/embed/${lesson.youtube_video_id}?rel=0&modestbranding=1`}
                className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen
              />
            </div>
          ) : lesson.audio_url ? (
            <div className="rounded-2xl theme-bg-elevated border theme-border p-6 sm:p-8"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="theme-text-faint text-[10px] uppercase tracking-widest font-sans mb-1">Audio Recording</div>
                  <div className="theme-text text-base font-semibold font-sans truncate">{lesson.title}</div>
                </div>
              </div>
              <audio controls className="w-full" preload="metadata" controlsList="nodownload">
                <source src={lesson.audio_url} />
                Your browser does not support audio playback.
              </audio>
              <a href={lesson.audio_url} download
                className="mt-4 inline-flex items-center gap-1.5 text-xs theme-accent hover:opacity-70 font-sans transition-opacity">
                Download audio file →
              </a>
            </div>
          ) : (
            <div className="rounded-2xl theme-bg-elevated border theme-border p-12 text-center">
              <p className="theme-text-muted text-sm font-sans">Content not available yet.</p>
            </div>
          )}
        </motion.div>

        {/* Mark complete */}
        {!completed && (
          <button onClick={markComplete} disabled={marking}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] disabled:opacity-50 text-white font-semibold text-sm py-4 rounded-xl transition-all font-sans">
            {marking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><CheckCircle className="w-4 h-4 theme-accent" /> Mark as Complete</>
            }
          </button>
        )}

        {/* Course resources — material + assessment */}
        {(lesson.courses.notes_url || assessment) && (
          <div className="space-y-2">
            <p className="theme-text-muted text-[10px] uppercase tracking-widest font-sans">
              Course Resources
            </p>

            {lesson.courses.notes_url && (
              <a href={lesson.courses.notes_url} target="_blank" rel="noopener noreferrer" download
                className="flex items-center gap-3 theme-bg-elevated border theme-border rounded-xl px-4 py-3.5 hover:border-[#D4A85C]/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-[#D4A85C]/10 flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-4 h-4 theme-accent" />
                </div>
                <div className="flex-1">
                  <div className="theme-text text-sm font-semibold group-hover:theme-accent transition-colors">
                    Course Material
                  </div>
                  <div className="theme-text-muted text-xs font-sans">Download PDF for this course</div>
                </div>
              </a>
            )}

            {assessment && (
              <Link href={`/portal/assessments/${assessment.id}`}
                className="flex items-center gap-3 theme-bg-elevated border border-[#D4A85C]/20 rounded-xl px-4 py-3.5 hover:border-[#D4A85C]/50 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-[#D4A85C]/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 theme-accent" />
                </div>
                <div className="flex-1">
                  <div className="theme-text text-sm font-semibold group-hover:theme-accent transition-colors">
                    {assessment.title}
                  </div>
                  <div className="theme-text-muted text-xs font-sans">{assessment.total_marks} marks · Course assessment</div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Prev / Next */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {prevLesson ? (
            <Link href={`/portal/lessons/${prevLesson.id}`}
              className="theme-bg-elevated border theme-border rounded-2xl p-4 hover:border-[#D4A85C]/40 transition-all group">
              <div className="theme-text-muted text-[10px] uppercase tracking-widest font-sans mb-1 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Previous
              </div>
              <div className="theme-text text-xs font-semibold font-sans group-hover:theme-accent transition-colors line-clamp-2">
                {prevLesson.title}
              </div>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link href={`/portal/lessons/${nextLesson.id}`}
              className="theme-bg-elevated border theme-border rounded-2xl p-4 hover:border-[#D4A85C]/40 transition-all group text-right">
              <div className="theme-text-muted text-[10px] uppercase tracking-widest font-sans mb-1 flex items-center gap-1 justify-end">
                Next <ChevronRight className="w-3 h-3" />
              </div>
              <div className="theme-text text-xs font-semibold font-sans group-hover:theme-accent transition-colors line-clamp-2">
                {nextLesson.title}
              </div>
            </Link>
          ) : (
            <Link href={`/portal/courses/${lesson.courses.slug}`}
              className="bg-[#1A1A2E] border border-[#1A1A2E] rounded-2xl p-4 hover:bg-[#2A2A4E] transition-all group text-right">
              <div className="text-white/40 text-[10px] uppercase tracking-widest font-sans mb-1 flex items-center gap-1 justify-end">
                Done
              </div>
              <div className="text-white text-xs font-semibold font-sans">
                Back to Course →
              </div>
            </Link>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
