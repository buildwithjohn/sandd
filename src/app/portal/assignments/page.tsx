"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Bell, Upload, CheckCircle, Clock, AlertCircle, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

const assignments = [
  {
    id: "a1",
    course: "Introduction to NT Prophecy",
    course_icon: "📖",
    title: "The Purpose of NT Prophecy in the Local Church",
    description: "Drawing from 1 Corinthians 14:3 and your lesson notes, write a reflective essay on how New Testament prophecy should function in a local church context. Include at least 3 Scripture references and a practical example.",
    due_date: "March 28, 2025",
    min_words: 800,
    status: "pending",
    submission: null,
  },
  {
    id: "a2",
    course: "The Person & Work of the Holy Spirit",
    course_icon: "🕊️",
    title: "The Holy Spirit and My Prophetic Journey",
    description: "Write a personal reflection on how the Holy Spirit has been at work in your spiritual life, particularly as it relates to prophetic sensitivity. Reference John 14–16.",
    due_date: "April 10, 2025",
    min_words: 600,
    status: "submitted",
    submission: { text: "Submitted on April 8, 2025", grade: null, feedback: null },
  },
  {
    id: "a3",
    course: "Biblical Hermeneutics",
    course_icon: "📜",
    title: "Interpreting a Prophetic Text",
    description: "Choose one prophetic passage from the New Testament and perform a full hermeneutical analysis using the methods taught in class. Show how context, grammar, and theology inform the correct interpretation.",
    due_date: "April 25, 2025",
    min_words: 1000,
    status: "graded",
    submission: {
      text: "Submitted on April 20, 2025",
      grade: 88,
      feedback: "Excellent analysis of the passage. Your use of context was strong. Consider expanding the theological section in future assignments.",
    },
  },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending:   { label: "Not Submitted", icon: Clock,         className: "bg-amber-50 text-amber-600 border-amber-200" },
  submitted: { label: "Under Review",  icon: AlertCircle,   className: "bg-blue-50 text-brand-600 border-brand-200" },
  graded:    { label: "Graded",        icon: CheckCircle,   className: "bg-green-50 text-green-600 border-green-200" },
};

function PortalSidebar({ active }: { active: string }) {
  const links = [
    { href: "/portal/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/portal/courses", icon: "📚", label: "My Courses" },
    { href: "/portal/assignments", icon: "📝", label: "Assignments" },
    { href: "/portal/announcements", icon: "📢", label: "Announcements" },
    { href: "/portal/profile", icon: "👤", label: "Profile" },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-blue-50">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-brand-900 text-sm font-medium">S&D School</span>
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function AssignmentsPage() {
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selected = assignments.find(a => a.id === activeAssignment);

  async function handleSubmit() {
    if (!selected || (!text.trim() && !file)) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      let file_url: string | null = null;

      if (file) {
        const path = `assignments/${selected.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("submissions").upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("submissions").getPublicUrl(path);
        file_url = data.publicUrl;
      }

      await supabase.from("assignment_submissions").upsert({
        assignment_id: selected.id,
        student_id: "mock-student-id",
        text_response: text || null,
        file_url,
        status: "submitted",
      }, { onConflict: "assignment_id,student_id" });

      toast.success("Assignment submitted successfully!");
      setActiveAssignment(null);
      setText("");
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-900 text-sm font-semibold">S&D Student Portal</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-medium text-xs">AO</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <PortalSidebar active="Assignments" />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">Assignments</h1>
            <p className="text-slate-400 text-sm mt-0.5">Submit your written work and track grades here.</p>
          </div>

          <div className="space-y-4">
            {assignments.map(a => {
              const s = statusConfig[a.status];
              const StatusIcon = s.icon;
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xl flex-shrink-0">
                      {a.course_icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400 mb-0.5">{a.course}</div>
                      <h2 className="font-display text-brand-900 text-lg font-medium leading-snug">{a.title}</h2>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${s.className}`}>
                      <StatusIcon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed mb-3">{a.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {a.due_date}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Min {a.min_words} words</span>
                  </div>

                  {/* Grade feedback */}
                  {a.status === "graded" && a.submission?.grade && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-medium text-sm">Grade</span>
                        <span className="font-display text-green-700 text-2xl font-semibold">{a.submission.grade}%</span>
                      </div>
                      {a.submission.feedback && (
                        <p className="text-green-700 text-xs leading-relaxed">{a.submission.feedback}</p>
                      )}
                    </div>
                  )}

                  {a.status === "pending" && (
                    <button
                      onClick={() => setActiveAssignment(a.id)}
                      className="bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Submit Assignment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Submission modal */}
      {activeAssignment && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-brand-900 text-lg font-medium">Submit Assignment</h2>
              <button onClick={() => setActiveAssignment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-4 font-medium">{selected.title}</p>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Written Response
              </label>
              <textarea
                rows={6}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 resize-none"
              />
              <div className={`text-xs mt-1 ${text.trim().split(/\s+/).filter(Boolean).length >= selected.min_words ? "text-green-500" : "text-slate-400"}`}>
                {text.trim().split(/\s+/).filter(Boolean).length} / {selected.min_words} words minimum
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Or Upload Document (optional)
              </label>
              <label className="border-2 border-dashed border-blue-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-brand-400 bg-brand-50/30 transition-colors">
                <Upload className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <span className="text-sm text-brand-600">{file ? file.name : "Upload PDF or Word doc"}</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActiveAssignment(null)}
                className="flex-1 border border-slate-200 text-slate-600 font-medium text-sm py-2.5 rounded-xl hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!text.trim() && !file)}
                className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
