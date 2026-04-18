"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Play, FileDown,
  ClipboardList, CheckCircle, Clock, Upload, Loader2, BookOpen
} from "lucide-react";

type Tab = "video" | "material" | "assignment";

interface Lesson {
  id: string; title: string; description?: string;
  youtube_video_id?: string; notes_url?: string; order_index: number;
  courses: { title: string; slug: string; year: number };
}

interface Assignment {
  id: string; title: string; description: string; due_date?: string; max_score: number;
}

interface Submission {
  id: string; status: string; text_response: string; grade?: number; feedback?: string;
}

export default function LessonPage() {
  const params    = useParams();
  const router    = useRouter();
  const lessonId  = params?.id as string;

  const [lesson, setLesson]         = useState<Lesson | null>(null);
  const [studentId, setStudentId]   = useState("");
  const [completed, setCompleted]   = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>("video");
  const [prevLesson, setPrevLesson] = useState<{ id: string; title: string } | null>(null);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading]       = useState(true);

  // Assignment
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [responses, setResponses]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setStudentId(user.id);

      const { data: lessonData } = await supabase
        .from("lessons").select("*, courses(title, slug, year)")
        .eq("id", lessonId).single();
      if (!lessonData) { router.push("/portal/dashboard"); return; }
      setLesson(lessonData);

      // Progress
      const { data: progress } = await supabase.from("lesson_progress")
        .select("status").eq("student_id", user.id).eq("lesson_id", lessonId).single();
      if (progress?.status === "completed") setCompleted(true);

      // Prev/next in same course
      const { data: siblings } = await supabase.from("lessons")
        .select("id, title, order_index").eq("course_id", lessonData.course_id)
        .eq("is_published", true).order("order_index");
      if (siblings) {
        const idx = siblings.findIndex((l: any) => l.id === lessonId);
        if (idx > 0)                     setPrevLesson(siblings[idx - 1]);
        if (idx < siblings.length - 1)  setNextLesson(siblings[idx + 1]);
      }

      // Assignments for this lesson (and course-wide ones)
      const { data: asgn } = await supabase.from("assignments")
        .select("*")
        .or(`lesson_id.eq.${lessonId},and(course_id.eq.${lessonData.course_id},lesson_id.is.null)`);
      setAssignments(asgn ?? []);

      // Submissions
      if (asgn && asgn.length > 0) {
        const ids = asgn.map((a: Assignment) => a.id);
        const { data: subs } = await supabase.from("assignment_submissions")
          .select("*").eq("student_id", user.id).in("assignment_id", ids);
        const subMap: Record<string, Submission> = {};
        subs?.forEach((s: any) => { subMap[s.assignment_id] = s; });
        setSubmissions(subMap);
      }

      setLoading(false);
    }
    load();
  }, [lessonId]);

  async function markComplete() {
    const supabase = createClient();
    await supabase.from("lesson_progress").upsert({
      student_id: studentId, lesson_id: lessonId, status: "completed", watch_percent: 100,
    }, { onConflict: "student_id,lesson_id" });
    setCompleted(true);
  }

  async function handleSubmit(assignmentId: string) {
    const text = responses[assignmentId]?.trim();
    if (!text || text.length < 50) { return; }
    setSubmitting(assignmentId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId, student_id: studentId,
        text_response: text, status: "submitted",
      }).select().single();
      if (error) throw error;
      setSubmissions(prev => ({ ...prev, [assignmentId]: data }));
      setResponses(prev => ({ ...prev, [assignmentId]: "" }));
    } catch (err: any) { console.error(err); }
    finally { setSubmitting(null); }
  }

  if (loading || !lesson) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#D4A85C] animate-spin" />
        </div>
      </PortalShell>
    );
  }

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: "video",      icon: Play,          label: "Lesson"    },
    { id: "material",   icon: FileDown,      label: "Material"  },
    { id: "assignment", icon: ClipboardList, label: "Assignment" },
  ];

  return (
    <PortalShell>
      <div className="space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans text-[#9B9B9B]">
          <Link href="/portal/courses" className="hover:text-[#1A1A2E] transition-colors">Courses</Link>
          <span>/</span>
          <Link href={`/portal/courses/${lesson.courses.slug}`} className="hover:text-[#1A1A2E] transition-colors">
            {lesson.courses.title}
          </Link>
          <span>/</span>
          <span className="text-[#1A1A2E]">{lesson.title}</span>
        </div>

        {/* Lesson title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E]" style={{ fontFamily: "'Georgia', serif" }}>
              {lesson.title}
            </h1>
            <p className="text-[#9B9B9B] text-xs font-sans mt-1">
              Lesson {lesson.order_index} · {lesson.courses.title}
            </p>
          </div>
          {completed && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F0E8] rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold font-sans flex-1 justify-center transition-all ${
                activeTab === t.id
                  ? "bg-[#1A1A2E] text-white shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#1A1A2E]"
              }`}>
              <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? "text-[#D4A85C]" : ""}`} />
              {t.label}
              {t.id === "assignment" && assignments.length > 0 && (
                <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${
                  activeTab === t.id ? "bg-[#D4A85C] text-[#1A1A2E]" : "bg-[#D4A85C]/20 text-[#8B7355]"
                }`}>{assignments.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── VIDEO TAB ────────────────────────────────────────────────── */}
        {activeTab === "video" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {lesson.youtube_video_id ? (
              <>
                <div className="rounded-2xl overflow-hidden bg-black border border-[#E8E2D9]"
                  style={{ aspectRatio: "16/9", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${lesson.youtube_video_id}?rel=0&modestbranding=1`}
                    className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen
                  />
                </div>
                {!completed && (
                  <button onClick={markComplete}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white font-semibold text-sm py-3.5 rounded-xl transition-all font-sans">
                    <CheckCircle className="w-4 h-4 text-[#D4A85C]" />
                    Mark as Complete
                  </button>
                )}
              </>
            ) : (
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center">
                <Play className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
                <p className="text-[#9B9B9B] text-sm font-sans">Video not available yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── MATERIAL TAB ─────────────────────────────────────────────── */}
        {activeTab === "material" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {lesson.notes_url ? (
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 text-center"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="w-16 h-16 rounded-2xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center mx-auto mb-4">
                  <FileDown className="w-7 h-7 text-[#D4A85C]" />
                </div>
                <h2 className="text-[#1A1A2E] text-base font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                  Course Material
                </h2>
                <p className="text-[#9B9B9B] text-sm font-sans mb-6">
                  Download the material for this lesson. You can read it offline or print it.
                </p>
                <a href={lesson.notes_url} target="_blank" rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all font-sans">
                  <FileDown className="w-4 h-4" />
                  Download Material
                </a>
                <p className="text-[#C4BDB2] text-xs font-sans mt-4">
                  PDF or Word document · Opens in your browser or downloads to your device
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <BookOpen className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
                <p className="text-[#1A1A2E] text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                  No Material Yet
                </p>
                <p className="text-[#9B9B9B] text-xs font-sans">
                  Course material will be uploaded here by the instructor.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ASSIGNMENT TAB ────────────────────────────────────────────── */}
        {activeTab === "assignment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <ClipboardList className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
                <p className="text-[#1A1A2E] text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                  No Assignment Yet
                </p>
                <p className="text-[#9B9B9B] text-xs font-sans">
                  Your instructor will add the assignment for this lesson here.
                </p>
              </div>
            ) : assignments.map(a => {
              const sub = submissions[a.id];
              return (
                <div key={a.id} className={`bg-white rounded-2xl border p-6 ${
                  sub?.status === "graded" ? "border-green-200" :
                  sub?.status === "submitted" ? "border-[#D4A85C]/30" : "border-[#E8E2D9]"
                }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="text-[#1A1A2E] text-base font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                      {a.title}
                    </h2>
                    {sub?.status === "graded" ? (
                      <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Graded — {sub.grade}%
                      </span>
                    ) : sub?.status === "submitted" ? (
                      <span className="flex items-center gap-1.5 bg-[#D4A85C]/10 border border-[#D4A85C]/25 text-[#8B7355] text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Grade
                      </span>
                    ) : (
                      <span className="bg-[#F5F0E8] border border-[#E8E2D9] text-[#9B9B9B] text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Due date */}
                  {a.due_date && (
                    <div className="flex items-center gap-1.5 text-[#9B9B9B] text-xs font-sans mb-4">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "long" })}
                    </div>
                  )}

                  {/* Questions */}
                  <div className="bg-[#FAF9F6] border border-[#E8E2D9] rounded-xl p-4 mb-4">
                    <p className="text-[#9B9B9B] text-[10px] uppercase tracking-widest font-sans mb-2">Questions & Instructions</p>
                    <pre className="text-[#1A1A2E] text-sm font-sans leading-relaxed whitespace-pre-wrap">
                      {a.description}
                    </pre>
                  </div>

                  {/* Feedback if graded */}
                  {sub?.status === "graded" && sub.feedback && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <p className="text-green-700 text-xs font-semibold font-sans mb-1">Instructor Feedback</p>
                      <p className="text-green-600 text-sm font-sans">{sub.feedback}</p>
                    </div>
                  )}

                  {/* Submission text if submitted */}
                  {sub && sub.status !== "graded" && (
                    <div className="bg-[#D4A85C]/[0.04] border border-[#D4A85C]/15 rounded-xl p-4 mb-4">
                      <p className="text-[#8B7355] text-xs font-semibold font-sans mb-2">Your Submission</p>
                      <p className="text-[#6B6B6B] text-sm font-sans leading-relaxed whitespace-pre-wrap">{sub.text_response}</p>
                    </div>
                  )}

                  {/* Response input if not submitted */}
                  {!sub && (
                    <div className="space-y-3">
                      <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block">
                        Your Response
                      </label>
                      <textarea
                        value={responses[a.id] ?? ""}
                        onChange={e => setResponses(p => ({ ...p, [a.id]: e.target.value }))}
                        rows={8}
                        placeholder="Write your response here. Address each question clearly and number your answers..."
                        className="w-full bg-[#FAF9F6] border border-[#E8E2D9] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-colors resize-none leading-relaxed"
                      />
                      {responses[a.id] && responses[a.id].length < 50 && (
                        <p className="text-red-400 text-xs font-sans">Response must be at least 50 characters.</p>
                      )}
                      <button
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting === a.id || !responses[a.id] || responses[a.id].length < 50}
                        className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-xl transition-all font-sans flex items-center justify-center gap-2">
                        {submitting === a.id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                          : <><Upload className="w-4 h-4" /> Submit Assignment</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {prevLesson ? (
            <Link href={`/portal/lessons/${prevLesson.id}`}
              className="bg-white border border-[#E8E2D9] rounded-2xl p-4 hover:border-[#D4A85C]/40 transition-all group">
              <div className="text-[#9B9B9B] text-[10px] uppercase tracking-widest font-sans mb-1 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Previous
              </div>
              <div className="text-[#1A1A2E] text-xs font-semibold font-sans group-hover:text-[#D4A85C] transition-colors line-clamp-1">
                {prevLesson.title}
              </div>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link href={`/portal/lessons/${nextLesson.id}`}
              className="bg-white border border-[#E8E2D9] rounded-2xl p-4 hover:border-[#D4A85C]/40 transition-all group text-right">
              <div className="text-[#9B9B9B] text-[10px] uppercase tracking-widest font-sans mb-1 flex items-center gap-1 justify-end">
                Next <ChevronRight className="w-3 h-3" />
              </div>
              <div className="text-[#1A1A2E] text-xs font-semibold font-sans group-hover:text-[#D4A85C] transition-colors line-clamp-1">
                {nextLesson.title}
              </div>
            </Link>
          ) : <div />}
        </div>
      </div>
    </PortalShell>
  );
}
