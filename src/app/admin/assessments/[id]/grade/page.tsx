"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, Clock, ChevronDown, ChevronUp, Star, Send } from "lucide-react";

export default function GradeAssessmentPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [theory, setTheory]           = useState<any[]>([]);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [scores, setScores]           = useState<Record<string, Record<string, number>>>({});
  const [feedback, setFeedback]       = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: a }, { data: subs }, { data: th }] = await Promise.all([
        supabase.from("assessments").select("*, courses(title)").eq("id", id).single(),
        supabase.from("assessment_submissions").select("*").eq("assessment_id", id).order("submitted_at"),
        supabase.from("assessment_theory").select("*").eq("assessment_id", id).order("order_index"),
      ]);

      // Fetch profiles separately via admin API to bypass RLS
      if (subs && subs.length > 0) {
        const studentIds = subs.map((s: any) => s.student_id);
        const res = await fetch("/api/admin/get-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: studentIds }),
        });
        const { profiles } = await res.json();
        const profileMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { profileMap[p.id] = p; });

        // Merge profiles into submissions
        const enriched = subs.map((s: any) => ({ ...s, profile: profileMap[s.student_id] }));
        setSubmissions(enriched);
      } else {
        setSubmissions([]);
      }

      setAssessment(a);
      setTheory(th ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function bulkReleaseObjOnly() {
    const objOnlyPending = submissions.filter(s =>
      s.status !== "graded" && theory.length === 0
    );
    if (objOnlyPending.length === 0) {
      toast.error("No objective-only submissions to release.");
      return;
    }
    if (!confirm(`Release results for ${objOnlyPending.length} submission${objOnlyPending.length !== 1 ? "s" : ""}? Students will see their scores immediately.`)) return;

    const supabase = createClient();
    try {
      await Promise.all(objOnlyPending.map(sub =>
        supabase.from("assessment_submissions").update({
          theory_score: 0,
          total_score: sub.obj_score || 0,
          status: "graded",
          results_released: true,
        }).eq("id", sub.id)
      ));
      toast.success(`Released ${objOnlyPending.length} result${objOnlyPending.length !== 1 ? "s" : ""}!`);
      setSubmissions(prev => prev.map(s => {
        const match = objOnlyPending.find(p => p.id === s.id);
        return match ? { ...s, theory_score: 0, total_score: s.obj_score || 0, status: "graded", results_released: true } : s;
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  async function saveGrade(subId: string) {
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;
    setSaving(subId);
    try {
      const supabase = createClient();
      const theoryScore = Object.values(scores[subId] ?? {}).reduce((a, b) => a + (b || 0), 0);
      const total = (sub.obj_score || 0) + theoryScore;
      await supabase.from("assessment_submissions").update({
        theory_score: theoryScore,
        total_score: total,
        status: "graded",
        theory_feedback: feedback[subId] ?? {},
        results_released: true,
      }).eq("id", subId);
      toast.success(`${sub.profile?.full_name} graded — ${total} marks. Results released.`);
      setSubmissions(prev => prev.map(s => s.id === subId
        ? { ...s, theory_score: theoryScore, total_score: total, status: "graded", results_released: true }
        : s
      ));
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(null); }
  }

  if (loading) return (
    <AdminShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  const graded = submissions.filter(s => s.status === "graded").length;

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
              Grade Assessment
            </h1>
            <p className="text-white/35 text-sm font-sans mt-1">
              {assessment?.title} · {assessment?.courses?.title}
            </p>
          </div>
          {theory.length === 0 && submissions.some(s => s.status !== "graded") && (
            <button onClick={bulkReleaseObjOnly}
              className="flex items-center gap-1.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-xs font-bold font-sans px-4 py-2.5 rounded-full transition-all">
              ⚡ Release All Obj Scores
            </button>
          )}
        </div>

        {/* Obj-only info banner */}
        {theory.length === 0 && (
          <div className="bg-[#D4A85C]/[0.06] border border-[#D4A85C]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4A85C]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D4A85C] text-sm">⚡</span>
            </div>
            <div className="flex-1">
              <p className="text-[#D4A85C] text-sm font-semibold font-sans">Objective-only assessment</p>
              <p className="text-white/50 text-xs font-sans mt-0.5">
                All questions are auto-marked. New submissions will release results to students instantly. Use the button above to release any pending older submissions.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Submitted", value: submissions.length, color: "text-white" },
            { label: "Graded", value: graded, color: "text-green-400" },
            { label: "Pending", value: submissions.length - graded, color: "text-[#D4A85C]" },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-white/30 text-xs font-sans mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Submissions */}
        {submissions.length === 0 ? (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-12 text-center">
            <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30 text-sm font-sans">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => {
              const profile  = sub.profile;
              const isOpen   = expanded === sub.id;
              const isGraded = sub.status === "graded";
              const theoryAnswers: Record<string, string> = sub.theory_answers ?? {};

              return (
                <div key={sub.id} className={`bg-[#0D1320] border rounded-2xl overflow-hidden ${isGraded ? "border-green-500/20" : "border-white/[0.07]"}`}>
                  <button onClick={() => setExpanded(isOpen ? null : sub.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <span className="text-white/60 text-xs font-bold">
                        {profile?.full_name?.split(" ").map((n: string) => n[0]).slice(0,2).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-semibold font-sans">{profile?.full_name}</div>
                      <div className="text-white/30 text-xs font-sans mt-0.5">
                        {profile?.student_number} · Submitted {new Date(sub.submitted_at).toLocaleString("en-NG")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[#D4A85C] text-sm font-bold">
                          {isGraded ? `${sub.total_score}` : `${sub.obj_score ?? 0}`}
                          <span className="text-white/30 text-xs">/{assessment?.total_marks}</span>
                        </div>
                        <div className="text-white/25 text-[10px] font-sans">
                          {isGraded ? "Total" : "Obj only"}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-sans ${
                        isGraded
                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                          : "bg-[#D4A85C]/10 border border-[#D4A85C]/20 text-[#D4A85C]"
                      }`}>
                        {isGraded ? "Graded" : "Pending"}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/[0.06] p-5 space-y-5">
                      {/* Obj score (auto) */}
                      <div className="bg-white/[0.03] rounded-xl p-4">
                        <div className="text-white/30 text-xs uppercase tracking-widest font-sans mb-2">Part A — Objectives (Auto-Marked)</div>
                        <div className="text-white text-lg font-bold">
                          {sub.obj_score ?? 0} <span className="text-white/30 text-sm font-normal">/ {assessment?.obj_marks} marks</span>
                        </div>
                      </div>

                      {/* Theory answers */}
                      {theory.length > 0 && (
                        <div className="space-y-4">
                          <div className="text-white/30 text-xs uppercase tracking-widest font-sans">Part B — Theory (Manual Grading)</div>
                          {theory.map((tq, ti) => {
                            const answer = theoryAnswers[tq.id] || "";
                            const score  = scores[sub.id]?.[tq.id] ?? (sub.theory_feedback?.[tq.id]?.score ?? 0);
                            const fb     = feedback[sub.id]?.[tq.id] ?? (sub.theory_feedback?.[tq.id]?.feedback ?? "");
                            return (
                              <div key={tq.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-white/70 text-xs font-semibold font-sans">Q{ti + 1}: {tq.question}</div>
                                  <span className="text-white/30 text-xs font-sans flex-shrink-0">{tq.marks} marks</span>
                                </div>
                                <div className="bg-[#080C14] rounded-xl px-4 py-3">
                                  <div className="text-white/25 text-[10px] uppercase tracking-widest font-sans mb-1.5">Student Answer</div>
                                  <p className="text-white/70 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                                    {answer || <span className="text-white/25 italic">No answer submitted</span>}
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">Score / {tq.marks}</label>
                                    <input type="number" min="0" max={tq.marks}
                                      value={score}
                                      onChange={e => setScores(prev => ({
                                        ...prev, [sub.id]: { ...prev[sub.id], [tq.id]: parseInt(e.target.value) || 0 }
                                      }))}
                                      disabled={isGraded}
                                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-[#D4A85C]/50 disabled:opacity-40" />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">Feedback (optional)</label>
                                    <input value={fb}
                                      onChange={e => setFeedback(prev => ({
                                        ...prev, [sub.id]: { ...prev[sub.id], [tq.id]: e.target.value }
                                      }))}
                                      disabled={isGraded}
                                      placeholder="Brief feedback..."
                                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-sans focus:outline-none focus:border-[#D4A85C]/50 disabled:opacity-40" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isGraded && (
                        <button onClick={() => saveGrade(sub.id)} disabled={saving === sub.id}
                          className="w-full flex items-center justify-center gap-2 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans disabled:opacity-50">
                          {saving === sub.id
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            : <><Send className="w-4 h-4" /> Submit Grade &amp; Release Results</>
                          }
                        </button>
                      )}
                      {isGraded && (
                        <div className="flex items-center gap-2 bg-green-500/[0.08] border border-green-500/20 rounded-xl px-4 py-3">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-sm font-sans">
                            Graded — {sub.total_score}/{assessment?.total_marks} marks. Results visible to student.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Loader2({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}
