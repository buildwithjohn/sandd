"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Youtube, FileText, ClipboardList, CheckCircle,
  AlertCircle, Upload, Loader2, Eye, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

interface Course { id: string; title: string; year: number; }
interface Lesson { id: string; title: string; order_index: number; youtube_video_id?: string; notes_url?: string; }

function extractYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = input.match(p); if (m) return m[1]; }
  return null;
}

type ActiveTab = "video" | "material" | "assignment";

export default function CourseBuilderPage() {
  const [courses, setCourses]   = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [lessons, setLessons]   = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("video");
  const fileRef = useRef<HTMLInputElement>(null);

  // Video state
  const [lessonTitle, setLessonTitle] = useState("");
  const [youtubeInput, setYoutube]    = useState("");
  const [orderIndex, setOrder]        = useState("1");
  const [savingVideo, setSavingVideo] = useState(false);

  // Material state
  const [materialLessonId, setMaterialLessonId] = useState("");
  const [materialFile, setMaterialFile]          = useState<File | null>(null);
  const [uploadingFile, setUploadingFile]        = useState(false);

  // Assignment state
  const [assignLessonId, setAssignLessonId]   = useState("");
  const [assignTitle, setAssignTitle]         = useState("");
  const [assignDesc, setAssignDesc]           = useState("");
  const [assignDue, setAssignDue]             = useState("");
  const [savingAssign, setSavingAssign]       = useState(false);

  const videoId = extractYouTubeId(youtubeInput);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("courses").select("id, title, year").order("year").order("order_index");
      setCourses(data ?? []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!courseId) { setLessons([]); return; }
    async function loadLessons() {
      const supabase = createClient();
      const { data } = await supabase.from("lessons")
        .select("id, title, order_index, youtube_video_id, notes_url")
        .eq("course_id", courseId)
        .order("order_index");
      setLessons(data ?? []);
    }
    loadLessons();
  }, [courseId]);

  // ── VIDEO PUBLISH ──────────────────────────────────────────────────────
  async function handlePublishVideo() {
    if (!lessonTitle || !courseId || !videoId) { toast.error("Fill in all fields with a valid YouTube URL."); return; }
    setSavingVideo(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("lessons").insert({
        course_id: courseId, title: lessonTitle,
        youtube_video_id: videoId,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        order_index: parseInt(orderIndex),
        is_published: true,
      });
      if (error) throw error;
      toast.success("Video lesson published!");
      setLessonTitle(""); setYoutube(""); setOrder("1");
      // Refresh lessons
      const { data } = await supabase.from("lessons")
        .select("id, title, order_index, youtube_video_id, notes_url")
        .eq("course_id", courseId).order("order_index");
      setLessons(data ?? []);
    } catch (err: any) { toast.error(err.message || "Failed to publish."); }
    finally { setSavingVideo(false); }
  }

  // ── FILE UPLOAD ────────────────────────────────────────────────────────
  async function handleUploadFile() {
    if (!materialFile || !materialLessonId) { toast.error("Select a lesson and a file."); return; }
    if (materialFile.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB."); return; }
    setUploadingFile(true);
    try {
      const supabase = createClient();
      const ext  = materialFile.name.split(".").pop();
      const path = `materials/${materialLessonId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("materials")
        .upload(path, materialFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("lessons")
        .update({ notes_url: urlData.publicUrl })
        .eq("id", materialLessonId);
      if (dbErr) throw dbErr;
      toast.success("Course material uploaded!");
      setMaterialFile(null); setMaterialLessonId("");
      if (fileRef.current) fileRef.current.value = "";
      const { data } = await supabase.from("lessons")
        .select("id, title, order_index, youtube_video_id, notes_url")
        .eq("course_id", courseId).order("order_index");
      setLessons(data ?? []);
    } catch (err: any) { toast.error(err.message || "Upload failed."); }
    finally { setUploadingFile(false); }
  }

  // ── ASSIGNMENT CREATE ──────────────────────────────────────────────────
  async function handleCreateAssignment() {
    if (!assignTitle || !assignLessonId || !assignDesc) { toast.error("Fill in all assignment fields."); return; }
    setSavingAssign(true);
    try {
      const supabase = createClient();
      const lesson = lessons.find(l => l.id === assignLessonId);
      const { error } = await supabase.from("assignments").insert({
        course_id: courseId,
        lesson_id: assignLessonId,
        title: assignTitle,
        description: assignDesc,
        due_date: assignDue || null,
        max_score: 100,
      });
      if (error) throw error;
      toast.success("Assignment created!");
      setAssignTitle(""); setAssignDesc(""); setAssignDue(""); setAssignLessonId("");
    } catch (err: any) { toast.error(err.message || "Failed to create assignment."); }
    finally { setSavingAssign(false); }
  }

  const tabs: { id: ActiveTab; icon: any; label: string; desc: string }[] = [
    { id: "video",      icon: Youtube,       label: "Video Lesson",    desc: "Paste YouTube link" },
    { id: "material",   icon: FileText,      label: "Course Material", desc: "PDF, Word, or doc" },
    { id: "assignment", icon: ClipboardList, label: "Assignment",      desc: "Questions for students" },
  ];

  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";
  const sel = "w-full bg-[#0D1320] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-all";

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Course Builder
          </h1>
          <p className="text-white/35 text-sm font-sans">Add video lessons, upload course materials, and create assignments.</p>
        </div>

        {/* Course selector */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5">
          <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
            Select Course
          </label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className={sel}>
            <option value="">Choose a course to work on...</option>
            <optgroup label="── Year 1">
              {courses.filter(c => c.year === 1).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </optgroup>
            <optgroup label="── Year 2">
              {courses.filter(c => c.year === 2).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Lessons in this course */}
        {courseId && lessons.length > 0 && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <span className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} in this course
              </span>
            </div>
            {lessons.map((l, i) => (
              <div key={l.id} className={`flex items-center gap-3 px-5 py-3 ${i < lessons.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                <span className="text-[#D4A85C]/50 text-xs font-mono w-5">{String(l.order_index).padStart(2,"0")}</span>
                <span className="text-white/70 text-sm font-sans flex-1">{l.title}</span>
                <div className="flex items-center gap-2">
                  {l.youtube_video_id && (
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                      <Youtube className="w-2.5 h-2.5" /> Video
                    </span>
                  )}
                  {l.notes_url && (
                    <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Material
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                activeTab === t.id
                  ? "bg-[#D4A85C]/10 border-[#D4A85C]/30"
                  : "bg-[#0D1320] border-white/[0.07] hover:border-white/20"
              }`}>
              <t.icon className={`w-4 h-4 mb-2 ${activeTab === t.id ? "text-[#D4A85C]" : "text-white/30"}`} />
              <div className={`text-xs font-semibold font-sans mb-0.5 ${activeTab === t.id ? "text-white" : "text-white/50"}`}>{t.label}</div>
              <div className="text-[10px] text-white/25 font-sans">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* ── VIDEO TAB ──────────────────────────────────────────────────── */}
        {activeTab === "video" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <Youtube className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Add Video Lesson</div>
                <div className="text-white/30 text-xs font-sans">Upload to YouTube as Unlisted first, then paste the link</div>
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Lesson Title *</label>
              <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                placeholder="e.g. What is New Testament Prophecy?"
                className={inp} />
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">YouTube URL *</label>
              <input value={youtubeInput} onChange={e => setYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inp} />
              {youtubeInput && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 font-sans ${videoId ? "text-green-400" : "text-red-400"}`}>
                  {videoId
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Valid YouTube link — ID: {videoId}</>
                    : <><AlertCircle className="w-3.5 h-3.5" /> Invalid URL — paste the full YouTube link</>
                  }
                </p>
              )}
            </div>

            {videoId && (
              <div className="rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: "16/9" }}>
                <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} className="w-full h-full" allowFullScreen />
              </div>
            )}

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Lesson Number</label>
              <input type="number" min="0" value={orderIndex} onChange={e => setOrder(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:border-[#D4A85C]/50" />
              <p className="text-white/20 text-xs font-sans mt-1.5">Use 0 for the Welcome/Intro lesson</p>
            </div>

            <button onClick={handlePublishVideo} disabled={savingVideo || !videoId || !lessonTitle || !courseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
              {savingVideo ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : <><Youtube className="w-4 h-4" /> Publish Video Lesson</>}
            </button>
          </div>
        )}

        {/* ── MATERIAL TAB ───────────────────────────────────────────────── */}
        {activeTab === "material" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <FileText className="w-4 h-4 text-[#D4A85C]" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Upload Course Material</div>
                <div className="text-white/30 text-xs font-sans">PDF or Word document — students will download this</div>
              </div>
            </div>

            {!courseId ? (
              <div className="py-8 text-center">
                <p className="text-white/30 text-sm font-sans">Select a course above first</p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-white/30 text-sm font-sans">No lessons in this course yet. Add a video lesson first.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Attach to Lesson *</label>
                  <select value={materialLessonId} onChange={e => setMaterialLessonId(e.target.value)} className={sel}>
                    <option value="">Select a lesson...</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>
                        {String(l.order_index).padStart(2,"0")} — {l.title}{l.notes_url ? " ✓ (has material)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">File (PDF or Word, max 20MB) *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      materialFile
                        ? "border-[#D4A85C]/40 bg-[#D4A85C]/[0.03]"
                        : "border-white/10 hover:border-white/25"
                    }`}>
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${materialFile ? "text-[#D4A85C]" : "text-white/20"}`} />
                    {materialFile ? (
                      <>
                        <p className="text-white/80 text-sm font-semibold font-sans">{materialFile.name}</p>
                        <p className="text-white/30 text-xs font-sans mt-1">
                          {(materialFile.size / 1024 / 1024).toFixed(2)} MB — click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/50 text-sm font-sans">Click to select file</p>
                        <p className="text-white/25 text-xs font-sans mt-1">PDF, DOCX, DOC — max 20MB</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                      className="hidden" onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="bg-[#D4A85C]/[0.05] border border-[#D4A85C]/15 rounded-xl px-4 py-3">
                  <p className="text-[#D4A85C]/70 text-xs font-sans">
                    The file will be stored securely and students will see a download button on the lesson page.
                    If a material already exists for this lesson, it will be replaced.
                  </p>
                </div>

                <button onClick={handleUploadFile} disabled={uploadingFile || !materialFile || !materialLessonId}
                  className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
                  {uploadingFile ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Course Material</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── ASSIGNMENT TAB ─────────────────────────────────────────────── */}
        {activeTab === "assignment" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Create Assignment</div>
                <div className="text-white/30 text-xs font-sans">Students submit written responses from their portal</div>
              </div>
            </div>

            {!courseId ? (
              <div className="py-8 text-center">
                <p className="text-white/30 text-sm font-sans">Select a course above first</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Link to Lesson (optional)</label>
                  <select value={assignLessonId} onChange={e => setAssignLessonId(e.target.value)} className={sel}>
                    <option value="">General course assignment (not tied to a lesson)</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>
                        {String(l.order_index).padStart(2,"0")} — {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Assignment Title *</label>
                  <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)}
                    placeholder="e.g. Course 1 — Written Exam"
                    className={inp} />
                </div>

                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
                    Questions / Instructions *
                  </label>
                  <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)}
                    rows={10}
                    placeholder={`Enter all questions and instructions here. Example:\n\nPart A — Written Exam (40 marks)\nAnswer ALL five questions. Each carries 8 marks.\n\n1. Define NT prophecy in your own words...\n2. Explain the three purposes...`}
                    className={`${inp} resize-none leading-relaxed`} />
                  <p className="text-white/20 text-xs font-sans mt-1.5">Students will see this exactly as typed and submit their response below it.</p>
                </div>

                <div>
                  <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Due Date (optional)</label>
                  <input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)}
                    className={inp} />
                </div>

                <button onClick={handleCreateAssignment} disabled={savingAssign || !assignTitle || !assignDesc || !courseId}
                  className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
                  {savingAssign ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><ClipboardList className="w-4 h-4" /> Create Assignment</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
