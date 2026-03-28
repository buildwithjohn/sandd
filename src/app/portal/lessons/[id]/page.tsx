"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import VideoPlayer from "@/components/video/VideoPlayer";
import QuizEngine from "@/components/quiz/QuizEngine";
import { ChevronLeft, ChevronRight, FileText, BookOpen, MessageSquare, CheckCircle } from "lucide-react";
import type { Quiz } from "@/types";

type Tab = "video" | "notes" | "quiz";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  youtube_video_id?: string;
  notes_url?: string;
  order_index: number;
  courses: { title: string; slug: string; year: number };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("video");
  const [prevLesson, setPrevLesson] = useState<{ id: string; title: string } | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setStudentId(user.id);

      // Fetch lesson
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*, courses(title, slug, year)")
        .eq("id", lessonId)
        .single();
      if (!lessonData) { router.push("/portal/dashboard"); return; }
      setLesson(lessonData);

      // Check existing progress
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("status, watch_percent")
        .eq("student_id", user.id)
        .eq("lesson_id", lessonId)
        .single();
      if (progress?.status === "completed") setCompleted(true);

      // Get prev/next lessons in same course
      const { data: siblings } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("course_id", lessonData.course_id ?? "")
        .eq("is_published", true)
        .order("order_index");

      if (siblings) {
        const idx = siblings.findIndex((l: any) => l.id === lessonId);
        if (idx > 0) setPrevLesson(siblings[idx - 1]);
        if (idx < siblings.length - 1) setNextLesson(siblings[idx + 1]);
      }

      setLoading(false);
    }
    load();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center">
        <div className="text-brand-400 text-sm">Loading lesson...</div>
      </div>
    );
  }

  if (!lesson) return null;

  const courseTitle = (lesson.courses as any)?.title ?? "Course";
  const courseSlug  = (lesson.courses as any)?.slug ?? "";

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      {/* Nav */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href={`/portal/courses/${courseSlug}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-brand-600 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{courseTitle}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="font-medium text-brand-900 text-sm text-center truncate px-4">{lesson.title}</h1>
          {completed && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" /> Done
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-blue-100 p-1 shadow-card">
              {([
                { id: "video" as Tab, icon: BookOpen,      label: "Lesson"  },
                { id: "notes" as Tab, icon: FileText,      label: "Notes"   },
                { id: "quiz"  as Tab, icon: MessageSquare, label: "Quiz"    },
              ]).map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.id ? "bg-brand-700 text-white" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* VIDEO TAB */}
            {activeTab === "video" && (
              <div className="space-y-3">
                {lesson.youtube_video_id ? (
                  <VideoPlayer
                    youtubeVideoId={lesson.youtube_video_id}
                    lessonId={lesson.id}
                    studentId={studentId}
                    onComplete={() => setCompleted(true)}
                    title={lesson.title}
                  />
                ) : (
                  <div className="bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 text-sm"
                    style={{ aspectRatio: "16/9" }}>
                    Video coming soon
                  </div>
                )}
                <div className="bg-white rounded-xl border border-blue-100 shadow-card p-4">
                  <h2 className="font-display text-brand-900 text-lg font-medium mb-1">{lesson.title}</h2>
                  {lesson.description && <p className="text-slate-400 text-sm">{lesson.description}</p>}
                  {completed && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4" /> Lesson complete! Move to the next lesson or take the quiz.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
                <h2 className="font-display text-brand-900 text-lg font-medium mb-4">Lesson Notes</h2>
                {lesson.notes_url ? (
                  <a href={lesson.notes_url} download
                    className="flex items-center gap-3 border border-blue-100 rounded-xl p-4 bg-brand-50 hover:bg-brand-100 transition-colors">
                    <FileText className="w-5 h-5 text-brand-600" />
                    <div>
                      <div className="text-sm font-medium text-brand-900">Download Notes PDF</div>
                      <div className="text-xs text-slate-400 mt-0.5">Study guide for this lesson</div>
                    </div>
                  </a>
                ) : (
                  <p className="text-slate-400 text-sm">No notes available for this lesson yet.</p>
                )}
              </div>
            )}

            {/* QUIZ TAB */}
            {activeTab === "quiz" && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
                <h2 className="font-display text-brand-900 text-lg font-medium mb-4">Lesson Quiz</h2>
                <p className="text-slate-400 text-sm">No quiz available for this lesson yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Prev / Next */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 space-y-2">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Navigation</h3>
              {prevLesson && (
                <Link href={`/portal/lessons/${prevLesson.id}`}
                  className="flex items-center gap-2 p-3 rounded-xl border border-blue-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm">
                  <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Previous</div>
                    <div className="truncate font-medium text-brand-900 text-xs mt-0.5">{prevLesson.title}</div>
                  </div>
                </Link>
              )}
              {nextLesson && (
                <Link href={`/portal/lessons/${nextLesson.id}`}
                  className="flex items-center gap-2 p-3 rounded-xl border border-blue-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Next</div>
                    <div className="truncate font-medium text-brand-900 text-xs mt-0.5">{nextLesson.title}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </Link>
              )}
              <Link href="/portal/courses"
                className="flex items-center justify-center gap-1 p-2 rounded-xl text-brand-500 hover:text-brand-700 text-xs font-medium mt-1">
                ← Back to all courses
              </Link>
            </div>

            {/* Tips */}
            <div className="bg-brand-950 rounded-2xl p-4">
              <h3 className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-3">Study Tips</h3>
              <ul className="space-y-2">
                {[
                  "Watch the full video before taking the quiz",
                  "Download the notes PDF for offline study",
                  "You can retake quizzes as many times as needed",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-brand-400 text-xs leading-relaxed">
                    <span className="text-brand-600 mt-0.5">→</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
