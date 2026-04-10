"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, Upload } from "lucide-react";
import { toast } from "sonner";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);
      const { data: asgn } = await supabase.from("assignments").select("*, courses(title)").order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("assignment_submissions").select("*").eq("student_id", user.id);
      const subMap: Record<string, any> = {};
      subs?.forEach(s => { subMap[s.assignment_id] = s; });
      setAssignments(asgn ?? []);
      setSubmissions(subMap);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(assignmentId: string) {
    const text = responses[assignmentId]?.trim();
    if (!text || text.length < 50) { toast.error("Response must be at least 50 characters."); return; }
    setSubmitting(assignmentId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId, student_id: userId,
        text_response: text, status: "submitted",
      });
      if (error) throw error;
      setSubmissions(prev => ({ ...prev, [assignmentId]: { status: "submitted", text_response: text } }));
      setResponses(prev => ({ ...prev, [assignmentId]: "" }));
      toast.success("Assignment submitted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <PortalShell>
      <div className="space-y-5">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Assignments
          </h1>
          <p className="text-[#9B9B9B] text-sm font-sans">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""} across your courses</p>
        </motion.div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center">
            <p className="text-[#9B9B9B] text-sm font-sans">Loading...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <FileText className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
            <p className="text-[#9B9B9B] text-sm font-sans">No assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a, i) => {
              const sub = submissions[a.id];
              const isGraded   = sub?.status === "graded";
              const isSubmitted = sub?.status === "submitted";
              return (
                <motion.div key={a.id} variants={rise(i * 0.08)} initial="hidden" animate="visible">
                  <div className={`bg-white rounded-2xl border p-6 ${
                    isGraded ? "border-green-200" : isSubmitted ? "border-[#D4A85C]/30" : "border-[#E8E2D9]"
                  }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[#8B7355] text-[10px] uppercase tracking-widest font-sans mb-1">
                          {(a.courses as any)?.title}
                        </div>
                        <h2 className="text-[#1A1A2E] text-base font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
                          {a.title}
                        </h2>
                      </div>
                      {isGraded ? (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" /> Graded — {sub.grade}%
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-1.5 bg-[#D4A85C]/10 border border-[#D4A85C]/25 text-[#8B7355] text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" /> Awaiting Grade
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-[#F5F0E8] border border-[#E8E2D9] text-[#9B9B9B] text-xs font-semibold px-3 py-1.5 rounded-full font-sans flex-shrink-0">
                          Pending
                        </div>
                      )}
                    </div>

                    {a.description && (
                      <p className="text-[#6B6B6B] text-sm font-sans leading-relaxed mb-4">{a.description}</p>
                    )}

                    {isGraded && sub.feedback && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <p className="text-green-700 text-xs font-sans font-semibold mb-1">Instructor Feedback</p>
                        <p className="text-green-600 text-sm font-sans">{sub.feedback}</p>
                      </div>
                    )}

                    {!sub && (
                      <div className="mt-2">
                        <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">
                          Your Response
                        </label>
                        <textarea
                          value={responses[a.id] ?? ""}
                          onChange={e => setResponses(p => ({ ...p, [a.id]: e.target.value }))}
                          rows={5}
                          placeholder="Write your response here (minimum 50 characters)..."
                          className="w-full bg-[#FAF9F6] border border-[#E8E2D9] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-colors resize-none"
                        />
                        <button
                          onClick={() => handleSubmit(a.id)}
                          disabled={submitting === a.id}
                          className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A4E] disabled:opacity-50 text-white text-xs font-semibold font-sans px-5 py-2.5 rounded-xl transition-all flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          {submitting === a.id ? "Submitting..." : "Submit Assignment"}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
