"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Download, Send } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

const submissions = [
  { id: "s1", student: "Adeyemi Ogunlade", initials: "AO", assignment: "The Purpose of NT Prophecy in the Local Church", course: "Intro to NT Prophecy", submitted: "March 26, 2025", word_count: 920, status: "submitted", grade: null, feedback: "", text: "The role of the New Testament prophet differs fundamentally from that of the Old Testament prophet in several key respects. While the OT prophet served as the primary conduit of divine revelation to a people who did not yet have the indwelling Holy Spirit, the NT prophet operates within a new covenant framework where every believer has access to the Spirit. According to 1 Corinthians 14:3, the purpose of NT prophecy is threefold: edification, exhortation, and comfort. This threefold mandate positions NT prophecy as fundamentally pastoral in nature..." },
  { id: "s2", student: "Esther Madu", initials: "EM", assignment: "The Purpose of NT Prophecy in the Local Church", course: "Intro to NT Prophecy", submitted: "March 27, 2025", word_count: 843, status: "submitted", grade: null, feedback: "", text: "When we consider the words of Paul in 1 Corinthians 14, we find a vision of prophecy that is radically different from what is often practiced. The Apostle Paul clearly states that the one who prophesies speaks to people for strengthening, encouragement and comfort. This single verse contains within it the entire philosophy of New Testament prophetic ministry. It is not primarily about foretelling future events, predicting disasters, or calling down judgment on sinners. It is about building the body of Christ..." },
  { id: "s3", student: "Chiamaka Festus", initials: "CF", assignment: "The Holy Spirit and My Prophetic Journey", course: "Person & Work of the HS", submitted: "April 8, 2025", word_count: 712, status: "graded", grade: 91, feedback: "Excellent personal reflection with strong scriptural grounding. Your honesty about moments of doubt and growth made this particularly compelling. Well done.", text: "" },
];

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications", icon: "📋", label: "Applications" },
    { href: "/admin/students", icon: "👥", label: "Students" },
    { href: "/admin/assignments", icon: "📝", label: "Assignments" },
    { href: "/admin/announcements", icon: "📢", label: "Announcements" },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-brand-950 rounded-2xl p-4 sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-brand-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-brand-100 text-sm font-medium">Admin Panel</span>
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label ? "bg-brand-800 text-brand-100 font-medium" : "text-brand-400 hover:bg-brand-900 hover:text-brand-200"
            }`}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function AdminAssignmentsPage() {
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>(
    Object.fromEntries(submissions.map(s => [s.id, { grade: s.grade?.toString() ?? "", feedback: s.feedback }]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function submitGrade(submissionId: string) {
    const g = grades[submissionId];
    if (!g.grade) return;
    setSaving(submissionId);
    try {
      const supabase = createClient();
      await supabase.from("assignment_submissions").update({
        grade: parseInt(g.grade),
        feedback: g.feedback,
        status: "graded",
        graded_at: new Date().toISOString(),
      }).eq("id", submissionId);
      toast.success("Grade saved and student notified.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  const pending = submissions.filter(s => s.status === "submitted");
  const graded = submissions.filter(s => s.status === "graded");

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-brand-950 border-b border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-display text-brand-100 text-sm font-semibold">S&D Admin Panel</span>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-medium">AS</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar active="Assignments" />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">Assignment Grading</h1>
            <p className="text-slate-400 text-sm mt-0.5">{pending.length} submissions awaiting grades</p>
          </div>

          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-medium text-slate-600">Needs Grading</h2>
              </div>
              <div className="space-y-4">
                {pending.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-amber-200 shadow-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-display font-semibold text-brand-700 text-sm flex-shrink-0">
                        {s.initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-brand-900 text-sm">{s.student}</div>
                        <div className="text-xs text-slate-400">{s.course} · {s.word_count} words · {s.submitted}</div>
                      </div>
                      <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        className="text-brand-500 text-xs hover:text-brand-700 font-medium">
                        {expanded === s.id ? "Hide" : "Read"}
                      </button>
                    </div>

                    <p className="text-slate-600 text-sm font-medium mb-3">{s.assignment}</p>

                    {expanded === s.id && (
                      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed mb-4 max-h-48 overflow-y-auto">
                        {s.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1.5">
                          Grade (0–100)
                        </label>
                        <input
                          type="number" min="0" max="100"
                          value={grades[s.id]?.grade ?? ""}
                          onChange={e => setGrades(g => ({ ...g, [s.id]: { ...g[s.id], grade: e.target.value } }))}
                          placeholder="e.g. 85"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1.5">Feedback</label>
                        <input
                          type="text"
                          value={grades[s.id]?.feedback ?? ""}
                          onChange={e => setGrades(g => ({ ...g, [s.id]: { ...g[s.id], feedback: e.target.value } }))}
                          placeholder="Brief feedback for student..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => submitGrade(s.id)}
                      disabled={saving === s.id || !grades[s.id]?.grade}
                      className="mt-3 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {saving === s.id ? "Saving..." : "Save Grade & Notify Student"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Already graded */}
          {graded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-medium text-slate-600">Already Graded</h2>
              </div>
              <div className="space-y-3">
                {graded.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center font-display font-semibold text-green-700 text-sm flex-shrink-0">
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-brand-900 text-sm">{s.student}</div>
                      <div className="text-xs text-slate-400">{s.assignment}</div>
                    </div>
                    <div className="font-display text-green-600 text-xl font-semibold flex-shrink-0">{s.grade}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
