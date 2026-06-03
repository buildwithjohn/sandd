"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, Youtube, FileText,
  ClipboardList, Plus, Eye, EyeOff, Calendar,
  CheckCircle, Clock, Trash2, Star, Lock
} from "lucide-react";
import { toast } from "sonner";

interface Subtopic {
  id: string; title: string; order_index: number;
  youtube_video_id?: string; notes_url?: string;
  is_published: boolean; scheduled_at?: string;
}

interface Assignment {
  id: string; title: string; due_date?: string;
  lesson_id?: string;
}

interface Assessment {
  id: string; title: string; is_published: boolean; total_marks: number; due_date?: string;
}

interface Course {
  id: string; title: string; year: number; order_index: number;
  description?: string; notes_url?: string;
  is_closed?: boolean; closed_at?: string;
  subtopics: Subtopic[];
  assessments: Assessment[];
}

export default function CourseManagerPage() {
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    const supabase = createClient();
    const { data: coursesData } = await supabase
      .from("courses").select("*").order("year").order("order_index");

    if (!coursesData) { setLoading(false); return; }

    const full: Course[] = await Promise.all(coursesData.map(async (c: any) => {
      const [{ data: subtopics }, { data: assessments }] = await Promise.all([
        supabase.from("lessons").select("*").eq("course_id", c.id).order("order_index"),
        supabase.from("assessments").select("id, title, is_published, total_marks, due_date").eq("course_id", c.id),
      ]);
      return { ...c, subtopics: subtopics ?? [], assessments: assessments ?? [] };
    }));

    setCourses(full);
    // Auto-expand all
    const exp: Record<string, boolean> = {};
    full.forEach(c => { exp[c.id] = true; });
    setExpanded(exp);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleCourseClosed(courseId: string, title: string, currentlyClosed: boolean) {
    const action = currentlyClosed ? "reopen" : "close";
    const confirmMsg = currentlyClosed
      ? `Reopen "${title}"? Students will regain access to its content and assessments.`
      : `Close "${title}"?\n\nThis will:\n- Mark the course as closed\n- Unpublish all assessments (students cannot take them anymore)\n- Students can still view subtopics and material but as read-only\n\nYou can reopen at any time.`;
    if (!confirm(confirmMsg)) return;

    const res = await fetch("/api/admin/close-course", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, action }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Failed."); return; }
    toast.success(currentlyClosed ? "Course reopened!" : "Course closed.");
    load();
  }

  async function togglePublish(subtopicId: string, current: boolean) {
    const res = await fetch("/api/admin/delete-lesson", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: subtopicId, action: "toggle", isPublished: current }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Failed"); return; }
    toast.success(current ? "Subtopic hidden from students." : "Subtopic published!");
    load();
  }

  async function deleteSubtopic(subtopicId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/delete-lesson", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: subtopicId, action: "delete" }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Failed"); return; }
    toast.success("Subtopic deleted.");
    load();
  }

  async function goLiveNow(subtopicId: string) {
    const res = await fetch("/api/admin/delete-lesson", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: subtopicId, action: "toggle", isPublished: false }),
    });
    if (!res.ok) { toast.error("Failed."); return; }
    toast.success("Subtopic is now LIVE!");
    load();
  }

  async function deleteAssessment(assessmentId: string, title: string) {
    if (!confirm(`Delete assessment "${title}"? This cannot be undone.`)) return;
    const supabase = createClient();
    await supabase.from("assessments").delete().eq("id", assessmentId);
    toast.success("Assessment deleted.");
    load();
  }

  if (loading) return (
    <AdminShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  const year1 = courses.filter(c => c.year === 1);
  const year2 = courses.filter(c => c.year === 2);

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
              Course Manager
            </h1>
            <p className="text-white/35 text-sm font-sans">View and manage all courses, subtopics, materials and assignments.</p>
          </div>
          <Link href="/admin/upload"
            className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-xs font-bold font-sans px-4 py-2.5 rounded-full transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Content
          </Link>
        </div>

        {[{ label: "Year 1 — Certificate in Prophetic Ministry", courses: year1 },
          { label: "Year 2 — Diploma in NT Prophecy", courses: year2 }].map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">{group.label}</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="space-y-3">
              {group.courses.map((course, ci) => (
                <motion.div key={course.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.05 }}>

                  {/* Course header */}
                  <div className="bg-[#0D1320] border border-white/[0.09] rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [course.id]: !e[course.id] }))}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#D4A85C] text-xs font-mono font-bold">
                          {String(course.order_index || ci + 1).padStart(2,"0")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm" style={{ fontFamily: "'Georgia', serif" }}>
                          {course.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/30 text-[10px] font-sans">
                            {course.subtopics.length} subtopic{course.subtopics.length !== 1 ? "s" : ""}
                          </span>
                          {course.is_closed && (
                            <span className="text-orange-400 text-[10px] font-sans flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                              <Lock className="w-2.5 h-2.5" /> Closed
                            </span>
                          )}
                          {course.notes_url && (
                            <span className="text-green-400 text-[10px] font-sans flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5" /> Material
                            </span>
                          )}
                          {course.assessments.length > 0 && (
                            <span className="text-[#D4A85C] text-[10px] font-sans flex items-center gap-1">
                              <Star className="w-2.5 h-2.5" /> {course.assessments.length} assessment{course.assessments.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleCourseClosed(course.id, course.title, !!course.is_closed); }}
                        className={`text-[10px] font-semibold font-sans px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                          course.is_closed
                            ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                            : "bg-white/[0.04] border-white/10 text-white/50 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400"
                        }`}>
                        {course.is_closed ? "Reopen" : "Close"}
                      </button>
                      {expanded[course.id]
                        ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                      }
                    </button>

                    {/* Expanded content */}
                    {expanded[course.id] && (
                      <div className="border-t border-white/[0.06]">

                        {/* Subtopics */}
                        <div className="px-5 py-3">
                          <div className="text-white/25 text-[10px] uppercase tracking-widest font-sans mb-2 flex items-center gap-2">
                            <Youtube className="w-3 h-3" /> Subtopics ({course.subtopics.length})
                          </div>

                          {course.subtopics.length === 0 ? (
                            <div className="text-white/20 text-xs font-sans py-2 pl-2">
                              No subtopics yet. <Link href="/admin/upload" className="text-[#D4A85C]/60 hover:text-[#D4A85C]">Add one →</Link>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {course.subtopics.map(sub => (
                                <div key={sub.id}
                                  className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 group">
                                  <span className="text-[#D4A85C]/40 text-xs font-mono w-5 flex-shrink-0">
                                    {String(sub.order_index).padStart(2,"0")}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white/80 text-xs font-semibold font-sans truncate">{sub.title}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {sub.youtube_video_id && (
                                        <a href={`https://youtu.be/${sub.youtube_video_id}`} target="_blank" rel="noopener noreferrer"
                                          className="text-red-400/60 hover:text-red-400 text-[10px] font-sans flex items-center gap-0.5 transition-colors">
                                          <Youtube className="w-2.5 h-2.5" /> YouTube
                                        </a>
                                      )}
                                      {sub.scheduled_at && !sub.is_published && (
                                        <span className="text-[#D4A85C]/60 text-[10px] font-sans flex items-center gap-0.5">
                                          <Calendar className="w-2.5 h-2.5" />
                                          {new Date(sub.scheduled_at).toLocaleString("en-NG")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Status badge */}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans flex-shrink-0 ${
                                    sub.is_published
                                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                      : sub.scheduled_at
                                        ? "bg-[#D4A85C]/10 border border-[#D4A85C]/20 text-[#D4A85C]"
                                        : "bg-white/5 border border-white/10 text-white/30"
                                  }`}>
                                    {sub.is_published ? "Live" : sub.scheduled_at ? "Scheduled" : "Draft"}
                                  </span>
                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!sub.is_published && (
                                      <button onClick={() => goLiveNow(sub.id)}
                                        className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-2 py-1 rounded-lg font-sans transition-all whitespace-nowrap"
                                        title="Publish now">
                                        Go Live
                                      </button>
                                    )}
                                    <button onClick={() => togglePublish(sub.id, sub.is_published)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                                      title={sub.is_published ? "Hide from students" : "Publish now"}>
                                      {sub.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => deleteSubtopic(sub.id, sub.title)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                      title="Delete subtopic">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Course Material */}
                        <div className="px-5 py-3 border-t border-white/[0.04]">
                          <div className="text-white/25 text-[10px] uppercase tracking-widest font-sans mb-2 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Course Material
                          </div>
                          {course.notes_url ? (
                            <div className="flex items-center gap-3 bg-green-500/[0.05] border border-green-500/15 rounded-xl px-4 py-3">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-green-400 text-xs font-semibold font-sans">Material uploaded</div>
                                <a href={course.notes_url} target="_blank" rel="noopener noreferrer"
                                  className="text-white/30 text-[10px] font-sans hover:text-white/60 transition-colors truncate block">
                                  {course.notes_url.split("/").pop()}
                                </a>
                              </div>
                              <Link href="/admin/upload"
                                className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-[10px] font-sans transition-colors flex-shrink-0">
                                Replace
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl px-4 py-3">
                              <FileText className="w-4 h-4 text-white/20 flex-shrink-0" />
                              <span className="text-white/25 text-xs font-sans">No material uploaded yet.</span>
                              <Link href="/admin/upload"
                                className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-[10px] font-sans transition-colors ml-auto flex-shrink-0">
                                Upload →
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Assessments */}
                        <div className="px-5 py-3 border-t border-white/[0.04]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white/25 text-[10px] uppercase tracking-widest font-sans flex items-center gap-2">
                              <Star className="w-3 h-3" /> Assessments ({course.assessments.length})
                            </div>
                            <Link href="/admin/assessments/new"
                              className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-[10px] font-sans transition-colors">
                              + New →
                            </Link>
                          </div>
                          {course.assessments.length === 0 ? (
                            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl px-4 py-3">
                              <Star className="w-4 h-4 text-white/20 flex-shrink-0" />
                              <span className="text-white/25 text-xs font-sans">No assessments yet.</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {course.assessments.map(a => (
                                <div key={a.id}
                                  className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 group">
                                  <Star className="w-3.5 h-3.5 text-[#D4A85C]/60 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white/75 text-xs font-semibold font-sans truncate">{a.title}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${
                                        a.is_published
                                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                          : "bg-white/5 text-white/30 border border-white/10"
                                      }`}>
                                        {a.is_published ? "Published" : "Draft"}
                                      </span>
                                      <span className="text-white/25 text-[10px] font-sans">{a.total_marks} marks</span>
                                      {a.due_date && (
                                        <span className="text-white/25 text-[10px] font-sans">
                                          Due {new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/assessments/${a.id}`}
                                      className="text-[10px] bg-[#D4A85C]/10 border border-[#D4A85C]/20 text-[#D4A85C] hover:bg-[#D4A85C]/20 px-2 py-1 rounded-lg font-sans transition-all">
                                      View
                                    </Link>
                                    <button onClick={() => deleteAssessment(a.id, a.title)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
