"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Youtube, FileText, ClipboardList, Mic, Music,
  CheckCircle, AlertCircle, Upload, Loader2, Calendar
} from "lucide-react";

interface Course { id: string; title: string; year: number; }
interface Lesson { id: string; title: string; order_index: number; youtube_video_id?: string; notes_url?: string; }

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.trim().match(p); if (m) return m[1]; }
  return null;
}

type Tab = "video" | "audio" | "material" | "assignment";

const inp = `w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 
  text-sm text-white/90 font-sans placeholder-white/20 
  focus:outline-none focus:border-[#D4A85C]/50 transition-all`;

const sel = `w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 
  text-sm text-white/90 font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-all`;

export default function CourseBuilderPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab]         = useState<Tab>("video");
  const [courses, setCourses] = useState<Course[]>([]);

  // ── Shared: course selection per tab (each tab has its own) ──────────
  const [vCourseId, setVCourseId] = useState("");
  const [mCourseId, setMCourseId] = useState("");
  const [aCourseId, setACourseId] = useState("");

  const [vLessons, setVLessons] = useState<Lesson[]>([]);
  const [mLessons, setMLessons] = useState<Lesson[]>([]);
  const [aLessons, setALessons] = useState<Lesson[]>([]);

  // ── Audio state ──────────────────────────────────────────────────────
  const [auTitle, setAuTitle] = useState("");
  const [auFile, setAuFile] = useState<File|null>(null);
  const [auCourseId, setAuCourseId] = useState("");
  const [auOrderIndex, setAuOrderIndex] = useState("1");
  const [auPublishMode, setAuPublishMode] = useState<"now"|"schedule">("now");
  const [auScheduledAt, setAuScheduledAt] = useState("");
  const [savingAudio, setSavingAudio] = useState(false);
  const [auLessons, setAuLessons] = useState<Lesson[]>([]);

  // ── Video state ──────────────────────────────────────────────────────
  const [lessonTitle, setLessonTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl]   = useState("");
  const [orderIndex, setOrderIndex]   = useState("1");
  const [publishMode, setPublishMode] = useState<"now"|"schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);

  // ── Material state ───────────────────────────────────────────────────
  const [mLessonId, setMLessonId]   = useState("");
  const [mFile, setMFile]           = useState<File|null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Assignment state ─────────────────────────────────────────────────
  const [aLessonId, setALessonId]   = useState("");
  const [aTitle, setATitle]         = useState("");
  const [aDesc, setADesc]           = useState("");
  const [aDue, setADue]             = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  const videoId = extractYouTubeId(youtubeUrl);

  // Load all courses once
  useEffect(() => {
    createClient().from("courses").select("id, title, year").order("year").order("order_index")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  // Load lessons whenever a course changes per tab
  async function loadLessons(courseId: string, setter: (l: Lesson[]) => void) {
    if (!courseId) { setter([]); return; }
    const { data } = await createClient().from("lessons")
      .select("id, title, order_index, youtube_video_id, notes_url")
      .eq("course_id", courseId).order("order_index");
    setter(data ?? []);
  }

  useEffect(() => { loadLessons(vCourseId, setVLessons); }, [vCourseId]);
  useEffect(() => { loadLessons(auCourseId, setAuLessons); }, [auCourseId]);
  useEffect(() => { loadLessons(mCourseId, setMLessons); setMLessonId(""); }, [mCourseId]);
  useEffect(() => { loadLessons(aCourseId, setALessons); setALessonId(""); }, [aCourseId]);

  // ── Publish Video ────────────────────────────────────────────────────
  async function handlePublishVideo() {
    if (!vCourseId)    { toast.error("Select a course first."); return; }
    if (!lessonTitle)  { toast.error("Enter a subtopic title."); return; }
    if (!videoId)      { toast.error("Enter a valid YouTube URL."); return; }
    if (publishMode === "schedule" && !scheduledAt) { toast.error("Select a date and time to schedule."); return; }
    setSavingVideo(true);
    try {
      const supabase = createClient();
      const isNow = publishMode === "now";
      const { error } = await supabase.from("lessons").insert({
        course_id:        vCourseId,
        title:            lessonTitle.trim(),
        youtube_video_id: videoId,
        video_url:        `https://www.youtube.com/watch?v=${videoId}`,
        order_index:      parseInt(orderIndex) || 1,
        is_published:     isNow,
        scheduled_at:     isNow ? null : new Date(scheduledAt).toISOString(),
      });
      if (error) throw error;
      const msg = isNow
        ? "Video lesson published successfully!"
        : `Lesson scheduled for ${new Date(scheduledAt).toLocaleString("en-NG")}`;
      toast.success(msg);
      setLessonTitle(""); setYoutubeUrl(""); setOrderIndex("1");
      setPublishMode("now"); setScheduledAt("");
      loadLessons(vCourseId, setVLessons);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish.");
    } finally { setSavingVideo(false); }
  }

  // ── Upload Audio Subtopic ────────────────────────────────────────────
  async function handleUploadAudio() {
    if (!auCourseId) { toast.error("Select a course first."); return; }
    if (!auTitle)    { toast.error("Enter a subtopic title."); return; }
    if (!auFile)     { toast.error("Choose an audio file."); return; }
    if (auFile.size > 100 * 1024 * 1024) { toast.error("Audio must be under 100MB."); return; }
    if (auPublishMode === "schedule" && !auScheduledAt) { toast.error("Pick a date and time."); return; }
    setSavingAudio(true);
    try {
      const isNow = auPublishMode === "now";
      const form = new FormData();
      form.append("file", auFile);
      form.append("courseId", auCourseId);
      form.append("title", auTitle.trim());
      form.append("orderIndex", auOrderIndex);
      form.append("isPublished", isNow ? "true" : "false");
      if (!isNow) form.append("scheduledAt", auScheduledAt);

      const res = await fetch("/api/admin/upload-audio", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      toast.success(isNow
        ? "Audio subtopic published!"
        : `Scheduled for ${new Date(auScheduledAt).toLocaleString("en-NG")}`);
      setAuTitle(""); setAuFile(null); setAuOrderIndex("1");
      setAuPublishMode("now"); setAuScheduledAt("");
      loadLessons(auCourseId, setAuLessons);
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally { setSavingAudio(false); }
  }

  // ── Upload Material via server API (bypasses RLS) ───────────────────
  async function handleUploadMaterial() {
    if (!mCourseId) { toast.error("Select a course first."); return; }
    if (!mFile)     { toast.error("Select a file to upload."); return; }
    if (mFile.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB."); return; }
    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append("courseId", mCourseId);
      form.append("file", mFile);
      const res = await fetch("/api/admin/upload-material", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("Course material uploaded! Students can download it from their portal.");
      setMFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally { setUploadingFile(false); }
  }

  // ── Create Assignment ────────────────────────────────────────────────
  async function handleCreateAssignment() {
    if (!aCourseId) { toast.error("Select a course first."); return; }
    if (!aTitle)    { toast.error("Enter an assignment title."); return; }
    if (!aDesc)     { toast.error("Enter the questions / instructions."); return; }
    setSavingAssign(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("assignments").insert({
        course_id:  aCourseId,
        lesson_id:  aLessonId || null,
        title:      aTitle.trim(),
        description: aDesc.trim(),
        due_date:   aDue || null,
        max_score:  100,
      });
      if (error) throw error;
      toast.success("Assignment created!");
      setATitle(""); setADesc(""); setADue(""); setALessonId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create.");
    } finally { setSavingAssign(false); }
  }

  const tabs: { id: Tab; icon: any; label: string; desc: string }[] = [
    { id: "video",      icon: Youtube,       label: "Video",    desc: "YouTube video link" },
    { id: "audio",      icon: Mic,           label: "Audio",    desc: "Upload MP3 recording" },
    { id: "material",   icon: FileText,      label: "Material", desc: "Course PDF" },
  ];

  const CourseSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="mb-5">
      <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Select Course *</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={sel}>
        <option value="">Choose a course...</option>
        <optgroup label="── Year 1">
          {courses.filter(c => c.year === 1).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </optgroup>
        <optgroup label="── Year 2">
          {courses.filter(c => c.year === 2).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </optgroup>
      </select>
    </div>
  );

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Course Builder
          </h1>
          <p className="text-white/35 text-sm font-sans">Add subtopics, upload course materials, and create assignments.</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-2xl border p-2.5 sm:p-4 text-left transition-all ${
                tab === t.id
                  ? "bg-[#D4A85C]/10 border-[#D4A85C]/30"
                  : "bg-[#0D1320] border-white/[0.07] hover:border-white/20"
              }`}>
              <t.icon className={`w-4 h-4 mb-1.5 sm:mb-2 ${tab === t.id ? "text-[#D4A85C]" : "text-white/30"}`} />
              <div className={`text-[11px] sm:text-xs font-semibold font-sans mb-0.5 ${tab === t.id ? "text-white" : "text-white/50"}`}>
                {t.label}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/25 font-sans hidden sm:block">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* ── VIDEO TAB ─────────────────────────────────────────────── */}
        {tab === "video" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <Youtube className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Add Video Subtopic</div>
                <div className="text-white/30 text-xs font-sans">Upload to YouTube as Unlisted first, then paste the link here</div>
              </div>
            </div>

            {/* Step 1 — Course */}
            <CourseSelect value={vCourseId} onChange={setVCourseId} />

            {/* Step 2 — Title */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Title *</label>
              <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                placeholder="e.g. What is NT Prophecy?"
                className={inp} />
            </div>

            {/* Step 3 — YouTube URL */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">YouTube URL *</label>
              <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                className={inp} />
              {youtubeUrl && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 font-sans ${videoId ? "text-green-400" : "text-red-400"}`}>
                  {videoId
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Valid — Video ID: {videoId}</>
                    : <><AlertCircle className="w-3.5 h-3.5" /> Invalid URL — paste the full YouTube link</>
                  }
                </p>
              )}
            </div>

            {/* Preview */}
            {videoId && (
              <div className="rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: "16/9" }}>
                <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} className="w-full h-full" allowFullScreen />
              </div>
            )}

            {/* Step 4 — Lesson number */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Number</label>
              <input type="number" min="0" value={orderIndex} onChange={e => setOrderIndex(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:border-[#D4A85C]/50" />
              <p className="text-white/20 text-xs font-sans mt-1">Use 1, 2, 3... for each subtopic in the course</p>
            </div>

            {/* Step 5 — Publish or Schedule */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">When to Publish</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["now", "schedule"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setPublishMode(m)}
                    className={`py-2.5 rounded-xl text-xs font-semibold font-sans transition-all border flex items-center justify-center gap-2 ${
                      publishMode === m
                        ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                        : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/25"
                    }`}>
                    {m === "schedule" && <Calendar className="w-3.5 h-3.5" />}
                    {m === "now" ? "Publish Now" : "Schedule"}
                  </button>
                ))}
              </div>
              {publishMode === "schedule" && (
                <div>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    className={inp} />
                  <p className="text-white/20 text-xs font-sans mt-1.5">
                    Students cannot see the lesson until this date and time.
                  </p>
                </div>
              )}
            </div>

            {/* Existing lessons */}
            {vLessons.length > 0 && (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <div className="px-4 py-2 border-b border-white/[0.06]">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">
                    {vLessons.length} subtopic{vLessons.length !== 1 ? "s" : ""} in this course
                  </span>
                </div>
                {vLessons.map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 px-4 py-3 ${i < vLessons.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <span className="text-[#D4A85C]/40 text-xs font-mono w-5">{String(l.order_index).padStart(2,"0")}</span>
                    <span className="text-white/60 text-xs font-sans flex-1 truncate">{l.title}</span>
                    <div className="flex gap-1.5">
                      {l.youtube_video_id && <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-sans">Video</span>}
                      {l.notes_url && <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-sans">Material</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handlePublishVideo} disabled={savingVideo || !videoId || !lessonTitle || !vCourseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
              {savingVideo
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {publishMode === "now" ? "Publishing..." : "Scheduling..."}</>
                : <><Youtube className="w-4 h-4" /> {publishMode === "now" ? "Publish Subtopic" : "Schedule Subtopic"}</>
              }
            </button>
          </div>
        )}

        {/* ── AUDIO TAB ──────────────────────────────────────────────── */}
        {tab === "audio" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <Mic className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Add Audio Subtopic</div>
                <div className="text-white/30 text-xs font-sans">Upload an MP3 recording (up to 100MB)</div>
              </div>
            </div>

            <CourseSelect value={auCourseId} onChange={setAuCourseId} />

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Title *</label>
              <input value={auTitle} onChange={e => setAuTitle(e.target.value)}
                placeholder="e.g. The Office of Prophet"
                className={inp} />
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Audio File *</label>
              <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all ${
                auFile ? "border-purple-400/40 bg-purple-400/[0.03]" : "border-white/10 hover:border-white/25"
              }`}>
                <input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac"
                  onChange={e => setAuFile(e.target.files?.[0] || null)}
                  id="audio-file-input"
                  className="hidden" />
                <label htmlFor="audio-file-input" className="cursor-pointer block">
                  <Music className={`w-8 h-8 mx-auto mb-3 ${auFile ? "text-purple-400" : "text-white/20"}`} />
                  {auFile ? (
                    <>
                      <p className="text-white/80 text-sm font-semibold font-sans truncate max-w-full px-2">{auFile.name}</p>
                      <p className="text-white/30 text-xs font-sans mt-1">{(auFile.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/50 text-sm font-sans">Click to select audio file</p>
                      <p className="text-white/25 text-xs font-sans mt-1">MP3, M4A, WAV, AAC — max 100MB</p>
                    </>
                  )}
                </label>
              </div>
              {auFile && (
                <div className="mt-3">
                  <audio controls className="w-full" src={URL.createObjectURL(auFile)} />
                </div>
              )}
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Number</label>
              <input type="number" min="0" value={auOrderIndex} onChange={e => setAuOrderIndex(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:border-[#D4A85C]/50" />
              <p className="text-white/20 text-xs font-sans mt-1">Use 1, 2, 3... for each subtopic in the course</p>
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">When to Publish</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["now", "schedule"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setAuPublishMode(m)}
                    className={`py-2.5 rounded-xl text-xs font-semibold font-sans transition-all border flex items-center justify-center gap-2 ${
                      auPublishMode === m
                        ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                        : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/25"
                    }`}>
                    {m === "schedule" && <Calendar className="w-3.5 h-3.5" />}
                    {m === "now" ? "Publish Now" : "Schedule"}
                  </button>
                ))}
              </div>
              {auPublishMode === "schedule" && (
                <input type="datetime-local" value={auScheduledAt} onChange={e => setAuScheduledAt(e.target.value)}
                  className={inp} />
              )}
            </div>

            {auLessons.length > 0 && (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <div className="px-4 py-2 border-b border-white/[0.06]">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">
                    {auLessons.length} subtopic{auLessons.length !== 1 ? "s" : ""} in this course
                  </span>
                </div>
                {auLessons.map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 px-4 py-3 ${i < auLessons.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <span className="text-[#D4A85C]/40 text-xs font-mono w-5">{String(l.order_index).padStart(2,"0")}</span>
                    <span className="text-white/60 text-xs font-sans flex-1 truncate">{l.title}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleUploadAudio} disabled={savingAudio || !auFile || !auTitle || !auCourseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
              {savingAudio
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {auPublishMode === "now" ? "Uploading..." : "Scheduling..."}</>
                : <><Mic className="w-4 h-4" /> {auPublishMode === "now" ? "Publish Audio Subtopic" : "Schedule Audio Subtopic"}</>
              }
            </button>
          </div>
        )}


        {/* ── MATERIAL TAB ──────────────────────────────────────────── */}
        {tab === "material" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <FileText className="w-4 h-4 text-[#D4A85C]" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Upload Course Material</div>
                <div className="text-white/30 text-xs font-sans">PDF or Word for the whole course — students download from their portal</div>
              </div>
            </div>

            {/* Step 1 — Course */}
            <CourseSelect value={mCourseId} onChange={setMCourseId} />

            {/* Step 2 — File (one per course) */}
            {mCourseId && (
              <div className="bg-[#D4A85C]/[0.05] border border-[#D4A85C]/15 rounded-xl px-4 py-3">
                <p className="text-[#D4A85C]/80 text-xs font-sans">
                  One course material per course. Uploading a new file will replace the existing one.
                  Students download it from the Documents section of their portal.
                </p>
              </div>
            )}

            {/* Step 3 — File */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">File (max 20MB) *</label>
              <div onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  mFile ? "border-[#D4A85C]/40 bg-[#D4A85C]/[0.03]" : "border-white/10 hover:border-white/25"
                }`}>
                <Upload className={`w-8 h-8 mx-auto mb-3 ${mFile ? "text-[#D4A85C]" : "text-white/20"}`} />
                {mFile ? (
                  <>
                    <p className="text-white/80 text-sm font-semibold font-sans">{mFile.name}</p>
                    <p className="text-white/30 text-xs font-sans mt-1">{(mFile.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/50 text-sm font-sans">Click to select file</p>
                    <p className="text-white/25 text-xs font-sans mt-1">PDF, DOCX, DOC — max 20MB</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={e => setMFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <button onClick={handleUploadMaterial} disabled={uploadingFile || !mFile || !mCourseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2">
              {uploadingFile
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                : <><Upload className="w-4 h-4" /> Upload Material</>
              }
            </button>
          </div>
        )}

        {/* ── ASSIGNMENT TAB ─────────────────────────────────────────── */}
        {tab === "assignment" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-white/[0.06]">
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-white text-sm font-semibold font-sans">Create Assignment</div>
                <div className="text-white/30 text-xs font-sans">Students submit written responses from their portal</div>
              </div>
            </div>

            {/* Step 1 — Course */}
            <CourseSelect value={aCourseId} onChange={setACourseId} />

            {/* Step 2 — Lesson (optional) */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
                Link to Subtopic <span className="text-white/20 normal-case tracking-normal">(optional)</span>
              </label>
              {!aCourseId ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <p className="text-white/25 text-sm font-sans">← Select a course above first</p>
                </div>
              ) : (
                <select value={aLessonId} onChange={e => setALessonId(e.target.value)} className={sel}>
                  <option value="">General course assignment (not tied to a specific subtopic)</option>
                  {aLessons.map(l => (
                    <option key={l.id} value={l.id}>{String(l.order_index).padStart(2,"0")} — {l.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 3 — Title */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Assignment Title *</label>
              <input value={aTitle} onChange={e => setATitle(e.target.value)}
                placeholder="e.g. Course 1 — Written Exam"
                className={inp} />
            </div>

            {/* Step 4 — Questions */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Questions / Instructions *</label>
              <textarea value={aDesc} onChange={e => setADesc(e.target.value)} rows={10}
                placeholder={`Type all questions here. Example:\n\nPart A — Written Exam (40 marks)\nAnswer ALL five questions.\n\n1. Define NT prophecy...\n2. Explain the three purposes...`}
                className={`${inp} resize-none leading-relaxed`} />
              <p className="text-white/20 text-xs font-sans mt-1.5">Students see this exactly as typed and write their response below it.</p>
            </div>

            {/* Step 5 — Due date */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
                Due Date <span className="text-white/20 normal-case tracking-normal">(optional)</span>
              </label>
              <input type="date" value={aDue} onChange={e => setADue(e.target.value)} className={inp} />
            </div>

            <button onClick={handleCreateAssignment} disabled={savingAssign || !aTitle || !aDesc || !aCourseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2">
              {savingAssign
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                : <><ClipboardList className="w-4 h-4" /> Create Assignment</>
              }
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
