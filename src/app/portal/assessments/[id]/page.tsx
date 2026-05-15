"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Phase = "intro" | "objectives" | "theory" | "submitted" | "results";

export default function StudentAssessmentPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions]   = useState<any[]>([]);
  const [theory, setTheory]         = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [studentId, setStudentId]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [phase, setPhase]           = useState<Phase>("intro");

  // Answers
  const [objAnswers, setObjAnswers]   = useState<Record<string, string>>({});
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ]      = useState(0);
  const [submitting, setSubmitting]  = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setStudentId(user.id);

      const [{ data: a }, { data: q }, { data: th }, { data: sub }] = await Promise.all([
        supabase.from("assessments").select("*, courses(title)").eq("id", id).single(),
        supabase.from("assessment_questions").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_theory").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_submissions").select("*").eq("assessment_id", id).eq("student_id", user.id).single(),
      ]);

      setAssessment(a);
      setQuestions(q ?? []);
      setTheory(th ?? []);

      if (sub) {
        setSubmission(sub);
        setPhase(sub.status === "graded" && sub.results_released ? "results" : "submitted");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function submitExam() {
    setSubmitting(true);
    try {
      const supabase = createClient();

      // Auto-mark objectives
      let objScore = 0;
      questions.forEach(q => {
        if (objAnswers[q.id] === q.correct_option) objScore += q.marks;
      });

      // If no theory questions, auto-release results immediately
      const isObjOnly = theory.length === 0;

      const { data: sub, error } = await supabase.from("assessment_submissions").insert({
        assessment_id: id,
        student_id: studentId,
        obj_answers: objAnswers,
        theory_answers: theoryAnswers,
        obj_score: objScore,
        theory_score: isObjOnly ? 0 : null,
        total_score: isObjOnly ? objScore : null,
        status: isObjOnly ? "graded" : "submitted",
        results_released: isObjOnly,
      }).select().single();

      if (error) throw error;
      setSubmission(sub);
      // If obj-only, go straight to results, else show "submitted, awaiting grading"
      setPhase(isObjOnly ? "results" : "submitted");
      toast.success(isObjOnly
        ? `Assessment graded! You scored ${objScore}/${assessment?.total_marks}.`
        : "Assessment submitted! Theory section will be graded by your instructor."
      );
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <PortalShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </PortalShell>
  );

  const answered  = Object.keys(objAnswers).length;
  const progress  = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

  // ── SUBMITTED ───────────────────────────────────────────────────────
  if (phase === "submitted") return (
    <PortalShell>
      <div className="max-w-lg mx-auto text-center py-12 space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 theme-accent" />
        </div>
        <h1 className="text-2xl font-semibold theme-text" style={{ fontFamily: "'Georgia', serif" }}>
          Assessment Submitted
        </h1>
        <p className="theme-text-muted text-sm font-sans leading-relaxed">
          Your responses have been received. Your instructor will review the theory section and release your results.
        </p>
        <div className="theme-bg-elevated border theme-border rounded-2xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="theme-text-muted text-xs uppercase tracking-widest font-sans mb-3">Part A — Objectives (Auto-Marked)</div>
          <div className="theme-text text-3xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>
            {submission?.obj_score} <span className="theme-text-muted text-lg font-normal">/ {assessment?.obj_marks}</span>
          </div>
          <div className="theme-text-muted text-xs font-sans mt-2 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Theory section pending grading
          </div>
        </div>
      </div>
    </PortalShell>
  );

  // ── RESULTS ─────────────────────────────────────────────────────────
  if (phase === "results") return (
    <PortalShell>
      <div className="max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold theme-text" style={{ fontFamily: "'Georgia', serif" }}>
          Assessment Results
        </h1>

        {/* Score card */}
        <div className="bg-[#1A1A2E] rounded-2xl p-7 text-center"
          style={{ boxShadow: "0 8px 32px rgba(26,26,46,0.15)" }}>
          <div className="theme-accent text-xs tracking-[0.2em] uppercase font-sans mb-2">Final Score</div>
          <div className="text-white text-5xl font-bold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
            {submission?.total_score}
            <span className="text-white/30 text-2xl font-normal">/{assessment?.total_marks}</span>
          </div>
          <div className="text-white/40 text-sm font-sans">
            {Math.round((submission?.total_score / assessment?.total_marks) * 100)}% · {
              submission?.total_score >= assessment?.total_marks * 0.7 ? "Pass" : "Needs Improvement"
            }
          </div>
          <div className="flex justify-center gap-8 mt-5 pt-5 border-t border-white/10">
            <div>
              <div className="theme-accent font-bold text-lg">{submission?.obj_score}/{assessment?.obj_marks}</div>
              <div className="text-white/30 text-xs font-sans mt-0.5">Part A</div>
            </div>
            <div>
              <div className="theme-accent font-bold text-lg">{submission?.theory_score}/{assessment?.theory_marks}</div>
              <div className="text-white/30 text-xs font-sans mt-0.5">Part B</div>
            </div>
          </div>
        </div>

        {/* Part A review with correct answers */}
        <div className="theme-bg-elevated border theme-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-3 border-b theme-border-soft">
            <h2 className="theme-text text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
              Part A — Objective Review
            </h2>
          </div>
          {questions.map((q, i) => {
            const myAnswer = submission?.obj_answers?.[q.id];
            const correct  = q.correct_option;
            const isRight  = myAnswer === correct;
            return (
              <div key={q.id} className={`px-5 py-4 ${i < questions.length - 1 ? "border-b theme-border-soft" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isRight ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="theme-text text-sm font-sans mb-2">{q.question}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["A","B","C","D"] as const).map(opt => {
                        const optText = q[`option_${opt.toLowerCase()}`];
                        const isCorrectOpt = opt === correct;
                        const isMyAnswer   = opt === myAnswer;
                        return (
                          <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans ${
                            isCorrectOpt
                              ? "bg-green-50 border border-green-200 text-green-700"
                              : isMyAnswer && !isCorrectOpt
                              ? "bg-red-50 border border-red-200 text-red-500"
                              : "bg-[#F8F6F2] theme-text-muted"
                          }`}>
                            <span className="font-bold w-4">{opt}.</span> {optText}
                            {isCorrectOpt && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Theory feedback */}
        {theory.length > 0 && (
          <div className="theme-bg-elevated border theme-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="px-5 py-3 border-b theme-border-soft">
              <h2 className="theme-text text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                Part B — Theory Feedback
              </h2>
            </div>
            {theory.map((q, i) => {
              const myAnswer = submission?.theory_answers?.[q.id] || "";
              const fb = submission?.theory_feedback?.[q.id] || {};
              return (
                <div key={q.id} className={`px-5 py-4 ${i < theory.length - 1 ? "border-b theme-border-soft" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="theme-text text-sm font-semibold font-sans">Q{i + 1}: {q.question}</p>
                    {fb.score !== undefined && (
                      <span className="theme-accent text-sm font-bold ml-3 flex-shrink-0">{fb.score}/{q.marks}</span>
                    )}
                  </div>
                  <div className="theme-bg border theme-border rounded-xl p-3 mb-2">
                    <p className="theme-text-muted text-xs font-sans leading-relaxed">{myAnswer || "No answer"}</p>
                  </div>
                  {fb.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-blue-700 text-xs font-semibold font-sans mb-1">Instructor Feedback</p>
                      <p className="text-blue-600 text-xs font-sans">{fb.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );

  // ── INTRO ────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <PortalShell>
      <div className="max-w-lg space-y-5">
        <div>
          <h1 className="text-2xl font-semibold theme-text" style={{ fontFamily: "'Georgia', serif" }}>
            {assessment?.title}
          </h1>
          <p className="theme-text-muted text-sm font-sans mt-1">{assessment?.courses?.title}</p>
        </div>

        <div className="theme-bg-elevated border theme-border rounded-2xl p-6 space-y-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Total Marks", `${assessment?.total_marks}`],
              ["Part A (Obj)", `${assessment?.obj_marks} marks`],
              ["Part B (Theory)", `${assessment?.theory_marks} marks`],
              ["Due", assessment?.due_date ? new Date(assessment.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "No deadline"],
            ].map(([l, v]) => (
              <div key={l} className="theme-bg rounded-xl p-3">
                <div className="theme-text-muted text-[10px] uppercase tracking-widest font-sans">{l}</div>
                <div className="theme-text text-sm font-bold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          {assessment?.instructions && (
            <div className="border-t theme-border pt-4">
              <div className="theme-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">Instructions</div>
              <p className="theme-text text-sm font-sans leading-relaxed">{assessment.instructions}</p>
            </div>
          )}
        </div>

        <div className="theme-bg border theme-border rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 theme-accent flex-shrink-0 mt-0.5" />
            <p className="theme-text-muted text-xs font-sans leading-relaxed">
              Once you start, complete the exam in one session. Part A is auto-marked instantly.
              Part B will be reviewed by your instructor. Results are released after grading.
            </p>
          </div>
        </div>

        <button onClick={() => setPhase("objectives")}
          className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white font-bold text-sm py-4 rounded-full transition-all font-sans">
          Start Assessment →
        </button>
      </div>
    </PortalShell>
  );

  // ── OBJECTIVES ───────────────────────────────────────────────────────
  if (phase === "objectives") {
    const q = questions[currentQ];
    return (
      <PortalShell>
        <div className="max-w-2xl space-y-5">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="theme-text text-sm font-semibold font-sans">
                Part A — Question {currentQ + 1} of {questions.length}
              </span>
              <span className="theme-text-muted text-xs font-sans">{answered} answered</span>
            </div>
            <div className="w-full bg-[#E8E2D9] rounded-full h-2">
              <div className="bg-[#1A1A2E] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question */}
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="theme-bg-elevated border theme-border rounded-2xl p-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start gap-3 mb-5">
              <span className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center theme-accent text-xs font-bold flex-shrink-0">
                {currentQ + 1}
              </span>
              <p className="theme-text text-sm font-sans leading-relaxed flex-1">{q.question}</p>
              <span className="theme-text-muted text-xs font-sans flex-shrink-0">{q.marks}mk</span>
            </div>
            <div className="space-y-2.5">
              {(["A","B","C","D"] as const).map(opt => {
                const text     = q[`option_${opt.toLowerCase()}`];
                const selected = objAnswers[q.id] === opt;
                return (
                  <button key={opt} onClick={() => setObjAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? "bg-[#1A1A2E] border-[#1A1A2E] text-white"
                        : "theme-bg theme-border theme-text-muted hover:border-[#1A1A2E]/30"
                    }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selected ? "bg-[#D4A85C] theme-text" : "theme-bg-elevated border theme-border theme-text-muted"
                    }`}>{opt}</span>
                    <span className="text-sm font-sans">{text}</span>
                    {selected && <CheckCircle className="w-4 h-4 ml-auto theme-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full border theme-border theme-text-muted text-sm font-semibold font-sans disabled:opacity-40 hover:border-[#1A1A2E] transition-all">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Question dots */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
              {questions.slice(Math.max(0, currentQ - 3), currentQ + 4).map((_, relIdx) => {
                const absIdx = Math.max(0, currentQ - 3) + relIdx;
                const isAnswered = !!objAnswers[questions[absIdx]?.id];
                return (
                  <button key={absIdx} onClick={() => setCurrentQ(absIdx)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold flex-shrink-0 transition-all ${
                      absIdx === currentQ
                        ? "bg-[#1A1A2E] text-white"
                        : isAnswered
                        ? "bg-[#D4A85C]/20 theme-accent border border-[#D4A85C]/30"
                        : "bg-[#F0EDE8] theme-text-muted"
                    }`}>
                    {absIdx + 1}
                  </button>
                );
              })}
            </div>

            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(q => q + 1)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#1A1A2E] text-white text-sm font-semibold font-sans hover:bg-[#2A2A4E] transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setPhase(theory.length > 0 ? "theory" : "submitted")}
                className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#D4A85C] text-[#080C14] text-sm font-bold font-sans hover:bg-[#C49848] transition-all">
                {theory.length > 0 ? "Part B →" : "Review & Submit →"}
              </button>
            )}
          </div>

          <p className="theme-text-muted text-xs font-sans text-center">
            {questions.length - answered} question{questions.length - answered !== 1 ? "s" : ""} unanswered
          </p>
        </div>
      </PortalShell>
    );
  }

  // ── THEORY ──────────────────────────────────────────────────────────
  if (phase === "theory") return (
    <PortalShell>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold theme-text" style={{ fontFamily: "'Georgia', serif" }}>
              Part B — Theory
            </h1>
            <p className="theme-text-muted text-xs font-sans mt-0.5">{theory.length} questions · {assessment?.theory_marks} marks · Written answers</p>
          </div>
          <button onClick={() => setPhase("objectives")}
            className="theme-text-muted text-xs font-sans hover:theme-text transition-colors">
            ← Back to Part A
          </button>
        </div>

        {theory.map((q, i) => (
          <div key={q.id} className="theme-bg-elevated border theme-border rounded-2xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1A1A2E] flex items-center justify-center theme-accent text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="theme-text text-sm font-sans leading-relaxed">{q.question}</p>
              </div>
              <span className="theme-text-muted text-xs font-sans flex-shrink-0">{q.marks} marks</span>
            </div>
            <textarea
              value={theoryAnswers[q.id] ?? ""}
              onChange={e => setTheoryAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              rows={6}
              placeholder="Write your answer here..."
              className="w-full theme-bg border theme-border rounded-xl px-4 py-3 text-sm theme-text font-sans focus:outline-none focus:border-[#1A1A2E]/30 transition-colors resize-none leading-relaxed"
            />
            <div className="text-right mt-1">
              <span className="theme-text-faint text-[10px] font-sans">{(theoryAnswers[q.id] ?? "").length} characters</span>
            </div>
          </div>
        ))}

        <div className="theme-bg border theme-border rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 theme-accent flex-shrink-0 mt-0.5" />
            <p className="theme-text-muted text-xs font-sans leading-relaxed">
              Review your answers before submitting. You cannot edit after submission.
              Part A: {answered}/{questions.length} answered · Part B: {Object.values(theoryAnswers).filter(a => a.trim()).length}/{theory.length} answered.
            </p>
          </div>
        </div>

        <button onClick={submitExam} disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] disabled:opacity-50 text-white font-bold text-sm py-4 rounded-full transition-all font-sans">
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            : <><Send className="w-4 h-4" /> Submit Assessment</>
          }
        </button>
      </div>
    </PortalShell>
  );

  return null;
}
