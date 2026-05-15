"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  Star, Plus, ArrowRight, CheckCircle, Clock,
  Users, FileText, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface AssessmentRow {
  id: string;
  title: string;
  is_published: boolean;
  total_marks: number;
  obj_marks: number;
  theory_marks: number;
  due_date: string | null;
  created_at: string;
  courses: { title: string; year: number; slug: string };
  submission_count: number;
  graded_count: number;
  question_count: number;
  theory_count: number;
}

export default function AdminAssessmentsListPage() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "draft">("all");

  async function load() {
    const supabase = createClient();
    const { data: ass } = await supabase
      .from("assessments")
      .select("*, courses(title, year, slug)")
      .order("created_at", { ascending: false });

    if (!ass) { setLoading(false); return; }

    const full: AssessmentRow[] = await Promise.all(
      ass.map(async (a: any) => {
        const [{ count: subs }, { count: graded }, { count: q }, { count: th }] = await Promise.all([
          supabase.from("assessment_submissions").select("*", { count: "exact", head: true }).eq("assessment_id", a.id),
          supabase.from("assessment_submissions").select("*", { count: "exact", head: true }).eq("assessment_id", a.id).eq("status", "graded"),
          supabase.from("assessment_questions").select("*", { count: "exact", head: true }).eq("assessment_id", a.id),
          supabase.from("assessment_theory").select("*", { count: "exact", head: true }).eq("assessment_id", a.id),
        ]);
        return { ...a, submission_count: subs ?? 0, graded_count: graded ?? 0, question_count: q ?? 0, theory_count: th ?? 0 };
      })
    );
    setAssessments(full);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("assessments").update({ is_published: !current }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    toast.success(current ? "Assessment unpublished." : "Assessment published!");
    load();
  }

  const filtered = assessments.filter(a => {
    if (filter === "all")      return true;
    if (filter === "pending")  return a.submission_count > a.graded_count;
    if (filter === "published") return a.is_published;
    if (filter === "draft")    return !a.is_published;
    return true;
  });

  const totalPending = assessments.reduce((sum, a) => sum + (a.submission_count - a.graded_count), 0);
  const totalSubs    = assessments.reduce((sum, a) => sum + a.submission_count, 0);
  const totalGraded  = assessments.reduce((sum, a) => sum + a.graded_count, 0);

  if (loading) return (
    <AdminShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  return (
    <AdminShell>
      <div className="space-y-5 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
              Assessments
            </h1>
            <p className="text-white/35 text-sm font-sans mt-1">
              View submissions, grade theory answers, release results to students.
            </p>
          </div>
          <Link href="/admin/assessments/new"
            className="flex items-center gap-1.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-xs font-bold font-sans px-4 py-2.5 rounded-full transition-all flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> New Assessment
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Assessments", value: assessments.length, color: "text-white" },
            { label: "Submissions",       value: totalSubs,           color: "text-[#D4A85C]" },
            { label: "Graded",            value: totalGraded,         color: "text-green-400" },
            { label: "Pending Grade",     value: totalPending,        color: totalPending > 0 ? "text-orange-400" : "text-white/40" },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-4">
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-white/30 text-[10px] uppercase tracking-widest font-sans mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ["all",       "All",                 assessments.length],
            ["pending",   "Pending Grading",     assessments.filter(a => a.submission_count > a.graded_count).length],
            ["published", "Published",           assessments.filter(a => a.is_published).length],
            ["draft",     "Drafts",              assessments.filter(a => !a.is_published).length],
          ] as const).map(([key, label, count]) => (
            <button key={key} onClick={() => setFilter(key as any)}
              className={`text-xs font-semibold font-sans px-3.5 py-2 rounded-full border whitespace-nowrap transition-all ${
                filter === key
                  ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                  : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/25"
              }`}>
              {label} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-12 text-center">
            <Star className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm font-sans mb-1">
              {filter === "all" ? "No assessments yet" : `No ${filter} assessments`}
            </p>
            {filter === "all" && (
              <Link href="/admin/assessments/new" className="text-[#D4A85C] text-xs font-sans hover:underline">
                Create your first assessment →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((a, i) => {
              const hasPending = a.submission_count > a.graded_count;
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <div className={`bg-[#0D1320] border rounded-2xl p-4 sm:p-5 transition-all ${
                    hasPending
                      ? "border-orange-500/30 hover:border-orange-500/50"
                      : "border-white/[0.07] hover:border-white/15"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        hasPending
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : "bg-[#D4A85C]/10 border border-[#D4A85C]/20"
                      }`}>
                        <Star className={`w-4 h-4 ${hasPending ? "text-orange-400" : "text-[#D4A85C]"}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <h3 className="text-white text-sm font-semibold font-sans truncate" style={{ fontFamily: "'Georgia', serif" }}>
                            {a.title}
                          </h3>
                          {!a.is_published && (
                            <span className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded font-sans">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="text-white/40 text-xs font-sans mb-2 truncate">
                          {a.courses?.title} · Year {a.courses?.year}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-[11px] font-sans">
                          <span className="text-white/40 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {a.question_count} obj · {a.theory_count} theory
                          </span>
                          <span className="text-white/40">·</span>
                          <span className="text-white/40">{a.total_marks} marks</span>
                          {a.due_date && (
                            <>
                              <span className="text-white/40">·</span>
                              <span className="text-white/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due {new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Users className="w-3 h-3 text-white/40" />
                            <span className="text-white text-sm font-bold tabular-nums">{a.submission_count}</span>
                            <span className="text-white/30 text-xs">submitted</span>
                          </div>
                          {hasPending && (
                            <div className="text-orange-400 text-[10px] font-sans mt-0.5 font-semibold">
                              {a.submission_count - a.graded_count} need grading
                            </div>
                          )}
                          {!hasPending && a.submission_count > 0 && (
                            <div className="text-green-400 text-[10px] font-sans mt-0.5 flex items-center gap-1 justify-end">
                              <CheckCircle className="w-2.5 h-2.5" />
                              All graded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                      {a.submission_count > 0 ? (
                        <Link href={`/admin/assessments/${a.id}/grade`}
                          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold font-sans py-2.5 rounded-full transition-all ${
                            hasPending
                              ? "bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14]"
                              : "bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/70"
                          }`}>
                          {hasPending ? "Grade Submissions" : "View Grades"} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="flex-1 text-center text-white/30 text-xs font-sans py-2.5">
                          Waiting for student submissions
                        </span>
                      )}

                      <Link href={`/admin/assessments/${a.id}`}
                        className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white font-sans px-3 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all">
                        Details
                      </Link>

                      <button onClick={() => togglePublish(a.id, a.is_published)}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white transition-all"
                        title={a.is_published ? "Unpublish" : "Publish"}>
                        {a.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
