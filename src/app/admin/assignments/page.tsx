"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, Clock, Send } from "lucide-react";

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  text_response?: string;
  file_url?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  student?: { full_name: string };
  assignment?: { title: string; courses?: { title: string } };
}

export default function AssignmentsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("assignment_submissions")
        .select("*, student:profiles(full_name), assignment:assignments(title, courses(title))")
        .order("submitted_at", { ascending: false });
      setSubmissions(data ?? []);
      const g: Record<string, { grade: string; feedback: string }> = {};
      (data ?? []).forEach((s: Submission) => {
        g[s.id] = { grade: s.grade?.toString() ?? "", feedback: s.feedback ?? "" };
      });
      setGrades(g);
      setLoading(false);
    }
    load();
  }, []);

  async function submitGrade(id: string) {
    const g = grades[id];
    if (!g?.grade) return;
    setSaving(id);
    try {
      const supabase = createClient();
      await supabase.from("assignment_submissions").update({
        grade: parseInt(g.grade),
        feedback: g.feedback,
        status: "graded",
        graded_at: new Date().toISOString(),
      }).eq("id", id);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade: parseInt(g.grade), feedback: g.feedback, status: "graded" } : s));
      toast.success("Grade saved.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  const pending = submissions.filter(s => s.status === "submitted");
  const graded  = submissions.filter(s => s.status === "graded");

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">Assignment Grading</h1>
          <p className="text-gray-500 text-sm mt-1">{pending.length} submissions awaiting grades</p>
        </div>

        {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
          <>
            {/* Needs grading */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h2 className="text-gray-400 text-sm font-medium">Needs Grading</h2>
                </div>
                <div className="space-y-4">
                  {pending.map(s => (
                    <div key={s.id} className="bg-gray-900 border border-amber-900/50 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-brand-900 border border-brand-800 flex items-center justify-center text-brand-300 font-display font-semibold text-sm flex-shrink-0">
                          {(s.student as any)?.full_name?.split(" ").map((n: string) => n[0]).slice(0,2).join("") ?? "ST"}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{(s.student as any)?.full_name}</div>
                          <div className="text-gray-500 text-xs">{(s.assignment as any)?.courses?.title} · {new Date(s.submitted_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</div>
                        </div>
                        <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                          className="text-brand-400 hover:text-brand-300 text-xs font-medium">
                          {expanded === s.id ? "Hide" : "Read"}
                        </button>
                      </div>
                      <p className="text-white text-sm font-medium mb-3">{(s.assignment as any)?.title}</p>
                      {expanded === s.id && s.text_response && (
                        <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed mb-4 max-h-48 overflow-y-auto">
                          {s.text_response}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Grade (0–100)</label>
                          <input type="number" min="0" max="100" value={grades[s.id]?.grade ?? ""}
                            onChange={e => setGrades(g => ({ ...g, [s.id]: { ...g[s.id], grade: e.target.value } }))}
                            placeholder="85"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Feedback</label>
                          <input type="text" value={grades[s.id]?.feedback ?? ""}
                            onChange={e => setGrades(g => ({ ...g, [s.id]: { ...g[s.id], feedback: e.target.value } }))}
                            placeholder="Brief feedback for student..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
                        </div>
                      </div>
                      <button onClick={() => submitGrade(s.id)} disabled={saving === s.id || !grades[s.id]?.grade}
                        className="mt-3 bg-brand-700 hover:bg-brand-600 disabled:opacity-40 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                        <Send className="w-3.5 h-3.5" />
                        {saving === s.id ? "Saving..." : "Save Grade"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Already graded */}
            {graded.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <h2 className="text-gray-400 text-sm font-medium">Already Graded</h2>
                </div>
                <div className="space-y-2">
                  {graded.map(s => (
                    <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-800 flex items-center justify-center text-green-300 font-display font-semibold text-xs flex-shrink-0">
                        {(s.student as any)?.full_name?.split(" ").map((n: string) => n[0]).slice(0,2).join("") ?? "ST"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{(s.student as any)?.full_name}</div>
                        <div className="text-gray-500 text-xs">{(s.assignment as any)?.title}</div>
                      </div>
                      <div className="font-display text-green-400 text-xl font-semibold flex-shrink-0">{s.grade}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submissions.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                <p className="text-gray-500 text-sm">No submissions yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
