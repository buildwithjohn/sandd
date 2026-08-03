"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Save, Zap } from "lucide-react";

interface ObjQ { question: string; a: string; b: string; c: string; d: string; correct: string; marks: number; }
interface TheoryQ { question: string; marks: number; }
interface Course { id: string; title: string; year: number; }

const emptyObj = (): ObjQ => ({ question: "", a: "", b: "", c: "", d: "", correct: "A", marks: 1 });
const emptyTheory = (): TheoryQ => ({ question: "", marks: 10 });

const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";
const sel = "bg-[#080C14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [objQuestions, setObjQuestions] = useState<ObjQ[]>([emptyObj()]);
  const [theoryQuestions, setTheoryQuestions] = useState<TheoryQ[]>([emptyTheory()]);
  const [saving, setSaving] = useState(false);
  const [expandedObj, setExpandedObj] = useState<number | null>(0);
  const [showImport, setShowImport]   = useState(false);
  const [importText, setImportText]   = useState("");
  const [importing, setImporting]     = useState(false);

  useEffect(() => {
    createClient().from("courses").select("id, title, year").order("year").order("order_index")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  function updateObj(i: number, field: keyof ObjQ, val: string | number) {
    setObjQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  }

  function addObj() {
    if (objQuestions.length >= 100) { toast.error("Maximum 100 objective questions."); return; }
    setObjQuestions(prev => [...prev, emptyObj()]);
    setExpandedObj(objQuestions.length);
  }

  function removeObj(i: number) {
    setObjQuestions(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateTheory(i: number, field: keyof TheoryQ, val: string | number) {
    setTheoryQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  }

  function parseQuestions(raw: string): ObjQ[] {
    const results: ObjQ[] = [];
    // Split into blocks by blank lines
    const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

    for (const block of blocks) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 5) continue;

      // First line is the question (strip leading number like "1." "1)" "Q1.")
      const qLine = lines[0].replace(/^\d+[.)\s]+|^Q\d+[.)\s]*/i, "").trim();
      if (!qLine) continue;

      const opts: Record<string, string> = {};
      let correct = "A";

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Match option lines: A) / A. / A] / (A) / A - etc
        const optMatch = line.match(/^[(\[]?([ABCDabcd])[)\].:\s]+(.+)/);
        if (optMatch) {
          opts[optMatch[1].toUpperCase()] = optMatch[2].trim();
          continue;
        }
        // Match answer line
        const ansMatch = line.match(/^(?:answer|ans|correct|key|\*)[:\s]+([ABCDabcd])/i);
        if (ansMatch) {
          correct = ansMatch[1].toUpperCase();
          continue;
        }
        // Match starred correct answer like: * B) correct answer
        const starMatch = line.match(/^\*\s*[(\[]?([ABCDabcd])[)\].:\s]+/);
        if (starMatch) {
          correct = starMatch[1].toUpperCase();
        }
      }

      if (opts["A"] && opts["B"] && opts["C"] && opts["D"]) {
        results.push({
          question: qLine,
          a: opts["A"], b: opts["B"], c: opts["C"], d: opts["D"],
          correct: correct as "A"|"B"|"C"|"D",
          marks: 1,
        });
      }
    }
    return results.slice(0, 100);
  }

  function handleImport() {
    if (!importText.trim()) { toast.error("Paste some questions first."); return; }
    setImporting(true);
    try {
      const parsed = parseQuestions(importText);
      if (parsed.length === 0) {
        toast.error("No valid questions detected. Make sure each question has options A, B, C, D on separate lines.");
        return;
      }
      setObjQuestions(prev => {
        const existing = prev.filter(q => q.question.trim());
        return [...existing, ...parsed].slice(0, 100);
      });
      setImportText("");
      setShowImport(false);
      setExpandedObj(null);
      toast.success(`${parsed.length} question${parsed.length !== 1 ? "s" : ""} imported!`);
    } catch (err: any) {
      toast.error("Parse failed. Check your format and try again.");
    } finally { setImporting(false); }
  }

  async function handleSave(publish: boolean) {
    if (!courseId) { toast.error("Select a course."); return; }
    if (!title) { toast.error("Enter a title."); return; }
    const validObj = objQuestions.filter(q => q.question.trim() && q.a && q.b && q.c && q.d);
    const validTheory = theoryQuestions.filter(q => q.question.trim());
    if (validObj.length === 0 && validTheory.length === 0) { toast.error("Add at least one question."); return; }

    setSaving(true);
    try {
      const supabase = createClient();
      const objMarks = validObj.reduce((sum, q) => sum + q.marks, 0);
      const theoryMarks = validTheory.reduce((sum, q) => sum + q.marks, 0);

      const { data: assessment, error } = await supabase.from("assessments").insert({
        course_id: courseId, title: title.trim(),
        instructions: instructions.trim() || null,
        due_date: dueDate || null,
        is_published: publish,
        obj_marks: objMarks,
        theory_marks: theoryMarks,
        total_marks: objMarks + theoryMarks,
      }).select().single();

      if (error) throw error;

      if (validObj.length > 0) {
        await supabase.from("assessment_questions").insert(
          validObj.map((q, i) => ({
            assessment_id: assessment.id,
            question: q.question.trim(),
            option_a: q.a.trim(), option_b: q.b.trim(),
            option_c: q.c.trim(), option_d: q.d.trim(),
            correct_option: q.correct,
            marks: q.marks, order_index: i + 1,
          }))
        );
      }

      if (validTheory.length > 0) {
        await supabase.from("assessment_theory").insert(
          validTheory.map((q, i) => ({
            assessment_id: assessment.id,
            question: q.question.trim(),
            marks: q.marks, order_index: i + 1,
          }))
        );
      }

      toast.success(publish ? "Assessment published!" : "Assessment saved as draft.");
      router.push(`/admin/assessments/${assessment.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  const objMarksTotal = objQuestions.reduce((s, q) => s + (q.marks || 0), 0);
  const theoryMarksTotal = theoryQuestions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
              Create Assessment
            </h1>
            <p className="text-white/35 text-sm font-sans mt-1">Build an exam with objective and theory sections.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-white/30 text-xs font-sans">
              Total: <span className="text-[#D4A85C]">{objMarksTotal + theoryMarksTotal} marks</span>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h2 className="text-white text-sm font-semibold font-sans">Assessment Details</h2>
          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-sans block mb-2">Course *</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className={`${sel} w-full`}>
              <option value="">Select course...</option>
              <optgroup label="Year 1">
                {courses.filter(c => c.year === 1).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </optgroup>
              <optgroup label="Year 2">
                {courses.filter(c => c.year === 2).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-sans block mb-2">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Course 1 Final Assessment" className={inp} />
          </div>
          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-sans block mb-2">Instructions</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
              placeholder="e.g. Answer all questions. Part A is auto-marked. Part B will be reviewed by the instructor."
              className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="text-white/40 text-xs tracking-widest uppercase font-sans block mb-2">Due Date (optional)</label>
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp} />
          </div>
        </div>

        {/* Part A — Objectives */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-sm font-semibold font-sans">Part A — Objectives</h2>
              <p className="text-white/30 text-xs font-sans mt-0.5">
                {objQuestions.length}/100 questions · {objMarksTotal} marks total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImport(v => !v)}
                className={`flex items-center gap-1.5 border text-xs font-sans px-3 py-2 rounded-xl transition-all ${
                  showImport
                    ? "bg-[#D4A85C]/20 border-[#D4A85C]/40 text-[#D4A85C]"
                    : "bg-[#D4A85C]/10 border-[#D4A85C]/25 text-[#D4A85C] hover:bg-[#D4A85C]/20"
                }`}>
                <Zap className="w-3.5 h-3.5" /> Paste & Import
              </button>
              <button onClick={addObj}
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/70 text-xs font-sans px-3 py-2 rounded-xl transition-all">
                <Plus className="w-3.5 h-3.5" /> Add One
              </button>
            </div>
          </div>

          {/* Paste & Import Panel */}
          {showImport && (
            <div className="bg-[#0D1320] border border-[#D4A85C]/25 rounded-xl p-5 space-y-4">
              <div>
                <div className="text-[#D4A85C] text-sm font-semibold font-sans mb-1 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Paste Raw Questions</div>
                <p className="text-white/40 text-xs font-sans leading-relaxed">
                  Paste questions in any format. The system will automatically detect each question, options A–D, and the correct answer. One question per block.
                </p>
              </div>

              {/* Format example */}
              <div className="bg-black/30 border border-white/[0.06] rounded-xl p-4">
                <p className="text-white/25 text-[10px] font-sans mb-2 uppercase tracking-widest">Accepted formats</p>
                <pre className="text-white/50 text-[11px] font-mono leading-relaxed">{`1. What is NT prophecy?
A) Speaking in tongues
B) Spirit-inspired speech
C) Future prediction only
D) A gift only for prophets
Answer: B

2. According to 1 Cor 14:3...
A. Edification only
B. Judgment and correction
C. Strengthening, encouragement and comfort
D. Replacing Scripture
Correct: C`}</pre>
              </div>

              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={10}
                placeholder="Paste your questions here — numbered list, Word doc content, any format..."
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all resize-none leading-relaxed"
              />

              <div className="flex items-center gap-3">
                <button onClick={handleImport} disabled={!importText.trim()}
                  className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm px-6 py-2.5 rounded-full transition-all font-sans">
                  Import Questions
                  Import Questions
                  Import Questions
                </button>
                <button onClick={() => { setShowImport(false); setImportText(""); }}
                  className="text-white/30 hover:text-white/60 text-sm font-sans transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {objQuestions.map((q, i) => (
            <div key={i} className="border border-white/[0.08] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedObj(expandedObj === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left">
                <span className="text-[#D4A85C] text-xs font-mono w-6 flex-shrink-0">Q{i + 1}</span>
                <span className="text-white/70 text-xs font-sans flex-1 truncate">
                  {q.question || "Click to expand..."}
                </span>
                <span className="text-white/30 text-xs font-sans">{q.marks}mk</span>
                {expandedObj === i ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                <button onClick={e => { e.stopPropagation(); removeObj(i); }}
                  className="text-white/20 hover:text-red-400 transition-colors ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>

              {expandedObj === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-4">
                  <div>
                    <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">Question</label>
                    <textarea value={q.question} onChange={e => updateObj(i, "question", e.target.value)}
                      rows={2} placeholder="Enter question..." className={`${inp} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["a","b","c","d"] as const).map(opt => (
                      <div key={opt}>
                        <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">
                          Option {opt.toUpperCase()}
                        </label>
                        <input value={q[opt]} onChange={e => updateObj(i, opt, e.target.value)}
                          placeholder={`Option ${opt.toUpperCase()}`} className={inp} />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">Correct Answer</label>
                      <select value={q.correct} onChange={e => updateObj(i, "correct", e.target.value)}
                        className={`${sel} w-full`}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-white/30 text-[10px] uppercase tracking-widest font-sans block mb-1.5">Marks</label>
                      <input type="number" min="1" max="10" value={q.marks}
                        onChange={e => updateObj(i, "marks", parseInt(e.target.value) || 1)}
                        className={`${sel} w-full`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Part B — Theory */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-sm font-semibold font-sans">Part B — Theory</h2>
              <p className="text-white/30 text-xs font-sans mt-0.5">
                {theoryQuestions.length} questions · {theoryMarksTotal} marks total · Manually graded
              </p>
            </div>
            <button onClick={() => setTheoryQuestions(p => [...p, emptyTheory()])}
              className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/70 text-xs font-sans px-3 py-2 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          {theoryQuestions.map((q, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#D4A85C] text-xs font-mono">Q{i + 1}</span>
                <div className="flex items-center gap-2">
                  <label className="text-white/30 text-xs font-sans">Marks:</label>
                  <input type="number" min="1" value={q.marks}
                    onChange={e => updateTheory(i, "marks", parseInt(e.target.value) || 1)}
                    className={`${sel} w-16`} />
                  <button onClick={() => setTheoryQuestions(p => p.filter((_, idx) => idx !== i))}
                    className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea value={q.question} onChange={e => updateTheory(i, "question", e.target.value)}
                rows={3} placeholder="Enter theory question..."
                className={`${inp} resize-none`} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/70 font-semibold text-sm py-3.5 rounded-full transition-all font-sans disabled:opacity-40">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans disabled:opacity-40 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : "Publish Assessment"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
