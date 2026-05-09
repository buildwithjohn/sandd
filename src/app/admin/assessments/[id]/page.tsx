"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Users, Eye, Star, ArrowRight, CheckCircle, Clock } from "lucide-react";

export default function AssessmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions]   = useState<any[]>([]);
  const [theory, setTheory]         = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: a }, { data: q }, { data: th }, { data: subs }] = await Promise.all([
        supabase.from("assessments").select("*, courses(title)").eq("id", id).single(),
        supabase.from("assessment_questions").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_theory").select("*").eq("assessment_id", id).order("order_index"),
        supabase.from("assessment_submissions").select("*, profiles(full_name, student_number)").eq("assessment_id", id),
      ]);
      setAssessment(a); setQuestions(q ?? []); setTheory(th ?? []); setSubmissions(subs ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function togglePublish() {
    const supabase = createClient();
    await supabase.from("assessments").update({ is_published: !assessment.is_published }).eq("id", id);
    toast.success(assessment.is_published ? "Assessment unpublished." : "Assessment published!");
    setAssessment((a: any) => ({ ...a, is_published: !a.is_published }));
  }

  if (loading) return <AdminShell><div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" /></div></AdminShell>;

  const graded = submissions.filter(s => s.status === "graded").length;

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>{assessment?.title}</h1>
            <p className="text-white/35 text-sm font-sans mt-1">{assessment?.courses?.title} · {assessment?.total_marks} marks</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={togglePublish}
              className={`text-xs font-semibold font-sans px-4 py-2 rounded-full border transition-all ${
                assessment?.is_published
                  ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                  : "bg-white/[0.06] border-white/10 text-white/50 hover:border-white/25"
              }`}>
              {assessment?.is_published ? "Published" : "Publish"}
            </button>
            <Link href={`/admin/assessments/${id}/grade`}
              className="flex items-center gap-1.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-xs font-bold font-sans px-4 py-2 rounded-full transition-all">
              Grade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Obj Questions", value: questions.length },
            { label: "Theory Qs", value: theory.length },
            { label: "Submissions", value: submissions.length },
            { label: "Graded", value: graded },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-4 text-center">
              <div className="text-[#D4A85C] text-xl font-bold" style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-white/30 text-[10px] font-sans mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Questions preview */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-sans mb-3">Part A — {questions.length} Objective Questions ({assessment?.obj_marks} marks)</h2>
          {questions.slice(0, 3).map((q, i) => (
            <div key={q.id} className="flex gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[#D4A85C]/50 text-xs font-mono w-5">Q{i+1}</span>
              <span className="text-white/60 text-xs font-sans">{q.question}</span>
            </div>
          ))}
          {questions.length > 3 && <p className="text-white/25 text-xs font-sans mt-2">+{questions.length - 3} more questions</p>}
        </div>

        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-sans mb-3">Part B — {theory.length} Theory Questions ({assessment?.theory_marks} marks)</h2>
          {theory.map((q, i) => (
            <div key={q.id} className="flex gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[#D4A85C]/50 text-xs font-mono w-5">Q{i+1}</span>
              <span className="text-white/60 text-xs font-sans flex-1">{q.question}</span>
              <span className="text-white/25 text-xs font-sans flex-shrink-0">{q.marks}mk</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
