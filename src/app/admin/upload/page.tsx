"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Youtube, Mic, FileText, Plus, Upload, Loader2, Calendar,
  CheckCircle, AlertCircle, Music, Presentation, FolderOpen,
  Eye, Trash2, X
} from "lucide-react";

interface Course { id: string; title: string; year: number; }
interface Subtopic {
  id: string; title: string; description?: string; order_index: number;
  youtube_video_id?: string; audio_url?: string; slides_url?: string;
  slides_type?: string; attachment_url?: string; attachment_name?: string;
  is_published: boolean;
}
interface Resource {
  id: string; course_id: string; title: string;
  file_url: string; file_name?: string; category: string; created_at: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.trim().match(p); if (m) return m[1]; }
  return null;
}

// Direct upload to Supabase Storage with progress tracking
async function uploadToStorage(
  supabase: any, file: File, folder: string, courseId: string,
  onProgress: (pct: number) => void
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${courseId}-${Date.now()}.${ext}`;

  // Use XMLHttpRequest for actual progress tracking
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { reject(new Error("Not authenticated")); return; }

      const { data: { publicUrl } } = supabase.storage.from("materials").getPublicUrl(path);
      const xhr = new XMLHttpRequest();
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/materials/${path}`;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ url: publicUrl, path });
        } else {
          let msg = "Upload failed";
          try {
            const err = JSON.parse(xhr.responseText);
            msg = err.message || err.error || msg;
          } catch {}
          reject(new Error(msg));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");
      xhr.send(file);
    } catch (err) { reject(err); }
  });
}

type Tab = "subtopic" | "resources" | "manage";
type ContentType = "video" | "audio" | "slides";

const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";
const sel = "w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function CourseBuilderPage() {
  const [tab, setTab] = useState<Tab>("subtopic");
  const [courses, setCourses] = useState<Course[]>([]);

  const [sCourseId, setSCourseId] = useState("");
  const [sTitle, setSTitle] = useState("");
  const [sDescription, setSDescription] = useState("");
  const [sOrderIndex, setSOrderIndex] = useState("1");
  const [sContentType, setSContentType] = useState<ContentType>("video");
  const [sYoutubeUrl, setSYoutubeUrl] = useState("");
  const [sAudioFile, setSAudioFile] = useState<File | null>(null);
  const [sSlidesFile, setSSlidesFile] = useState<File | null>(null);
  const [sAttachment, setSAttachment] = useState<File | null>(null);
  const [sPublishMode, setSPublishMode] = useState<"now" | "schedule">("now");
  const [sScheduledAt, setSScheduledAt] = useState("");
  const [sSaving, setSSaving] = useState(false);
  const [sProgress, setSProgress] = useState(0);
  const [sStatusMsg, setSStatusMsg] = useState("");
  const [sSubtopics, setSSubtopics] = useState<Subtopic[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const slidesInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [rCourseId, setRCourseId] = useState("");
  const [rTitle, setRTitle] = useState("");
  const [rCategory, setRCategory] = useState<"Notes" | "Slides" | "Handout" | "Reading">("Notes");
  const [rFile, setRFile] = useState<File | null>(null);
  const [rSaving, setRSaving] = useState(false);
  const [rProgress, setRProgress] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const resourceInputRef = useRef<HTMLInputElement>(null);

  const [mCourseId, setMCourseId] = useState("");
  const [mSubtopics, setMSubtopics] = useState<Subtopic[]>([]);

  const videoId = extractYouTubeId(sYoutubeUrl);

  useEffect(() => {
    createClient().from("courses").select("id, title, year").order("year").order("order_index")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  async function loadSubtopics(courseId: string, setter: (s: Subtopic[]) => void) {
    if (!courseId) { setter([]); return; }
    const { data } = await createClient().from("lessons")
      .select("*").eq("course_id", courseId).order("order_index");
    setter(data ?? []);
  }
  async function loadResources(courseId: string) {
    if (!courseId) { setResources([]); return; }
    const { data } = await createClient().from("course_resources")
      .select("*").eq("course_id", courseId).order("created_at", { ascending: false });
    setResources(data ?? []);
  }

  useEffect(() => { loadSubtopics(sCourseId, setSSubtopics); }, [sCourseId]);
  useEffect(() => { loadResources(rCourseId); }, [rCourseId]);
  useEffect(() => { loadSubtopics(mCourseId, setMSubtopics); }, [mCourseId]);

  useEffect(() => {
    if (sSubtopics.length > 0) {
      const maxOrder = Math.max(...sSubtopics.map(s => s.order_index));
      setSOrderIndex(String(maxOrder + 1));
    } else {
      setSOrderIndex("1");
    }
  }, [sSubtopics]);

  async function handleSaveSubtopic() {
    if (!sCourseId) { toast.error("Select a course."); return; }
    if (!sTitle) { toast.error("Enter a subtopic title."); return; }
    if (sContentType === "video" && !videoId) { toast.error("Enter a valid YouTube URL."); return; }
    if (sContentType === "audio" && !sAudioFile) { toast.error("Choose an audio file."); return; }
    if (sContentType === "slides" && !sSlidesFile) { toast.error("Choose a slides file."); return; }
    if (sPublishMode === "schedule" && !sScheduledAt) { toast.error("Pick a date and time."); return; }

    setSSaving(true);
    setSProgress(0);
    try {
      const supabase = createClient();
      let audioUrl: string | undefined;
      let slidesUrl: string | undefined;
      let slidesType: string | undefined;
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;

      // Upload primary content
      if (sContentType === "audio" && sAudioFile) {
        setSStatusMsg(`Uploading audio (${(sAudioFile.size / 1024 / 1024).toFixed(1)}MB)...`);
        const { url } = await uploadToStorage(supabase, sAudioFile, "audio", sCourseId, setSProgress);
        audioUrl = url;
      } else if (sContentType === "slides" && sSlidesFile) {
        setSStatusMsg(`Uploading slides (${(sSlidesFile.size / 1024 / 1024).toFixed(1)}MB)...`);
        const { url } = await uploadToStorage(supabase, sSlidesFile, "slides", sCourseId, setSProgress);
        slidesUrl = url;
        slidesType = sSlidesFile.name.split(".").pop()?.toLowerCase() || "pdf";
      }

      // Upload attachment if present
      if (sAttachment) {
        setSStatusMsg(`Uploading attachment...`);
        setSProgress(0);
        const { url } = await uploadToStorage(supabase, sAttachment, "attachments", sCourseId, setSProgress);
        attachmentUrl = url;
        attachmentName = sAttachment.name;
      }

      // Create lesson row via API
      setSStatusMsg("Creating subtopic...");
      const isNow = sPublishMode === "now";
      const res = await fetch("/api/admin/upload-subtopic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: sCourseId,
          title: sTitle,
          description: sDescription,
          orderIndex: sOrderIndex,
          contentType: sContentType,
          isPublished: isNow,
          scheduledAt: isNow ? null : sScheduledAt,
          youtubeId: sContentType === "video" ? videoId : null,
          audioUrl, slidesUrl, slidesType,
          attachmentUrl, attachmentName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(isNow ? "Subtopic published!" : `Scheduled for ${new Date(sScheduledAt).toLocaleString("en-NG")}`);
      setSTitle(""); setSDescription("");
      setSYoutubeUrl(""); setSAudioFile(null); setSSlidesFile(null); setSAttachment(null);
      setSPublishMode("now"); setSScheduledAt("");
      if (audioInputRef.current) audioInputRef.current.value = "";
      if (slidesInputRef.current) slidesInputRef.current.value = "";
      if (attachInputRef.current) attachInputRef.current.value = "";
      loadSubtopics(sCourseId, setSSubtopics);
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setSSaving(false);
      setSProgress(0);
      setSStatusMsg("");
    }
  }

  async function handleSaveResource() {
    if (!rCourseId) { toast.error("Select a course."); return; }
    if (!rTitle) { toast.error("Enter a title."); return; }
    if (!rFile) { toast.error("Choose a file."); return; }

    setRSaving(true);
    setRProgress(0);
    try {
      const supabase = createClient();
      const { url } = await uploadToStorage(supabase, rFile, "resources", rCourseId, setRProgress);

      const res = await fetch("/api/admin/upload-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: rCourseId,
          title: rTitle,
          category: rCategory,
          fileUrl: url,
          fileName: rFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(`${rCategory} uploaded!`);
      setRTitle(""); setRFile(null);
      if (resourceInputRef.current) resourceInputRef.current.value = "";
      loadResources(rCourseId);
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setRSaving(false);
      setRProgress(0);
    }
  }

  async function handleDeleteResource(id: string) {
    if (!confirm("Delete this resource?")) return;
    const res = await fetch("/api/admin/delete-resource", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: id }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Resource deleted.");
    loadResources(rCourseId);
  }

  async function handleDeleteSubtopic(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch("/api/admin/delete-lesson", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: id, action: "delete" }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Subtopic deleted.");
    loadSubtopics(mCourseId, setMSubtopics);
  }

  const CourseSelect = ({ value, onChange, label = "Course" }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div>
      <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">{label} *</label>
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

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: "subtopic",  icon: Plus,        label: "Add Subtopic" },
    { id: "resources", icon: FolderOpen,  label: "Resources" },
    { id: "manage",    icon: Eye,         label: "Manage" },
  ];

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-medium text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Course Builder
          </h1>
          <p className="text-white/35 text-sm font-sans">Add subtopics with video, audio or slides. Upload course resources of any type.</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                tab === t.id
                  ? "bg-[#D4A85C]/10 border-[#D4A85C]/30"
                  : "bg-[#0D1320] border-white/[0.07] hover:border-white/20"
              }`}>
              <t.icon className={`w-4 h-4 mb-1.5 sm:mb-2 ${tab === t.id ? "text-[#D4A85C]" : "text-white/30"}`} />
              <div className={`text-[11px] sm:text-xs font-semibold font-sans ${tab === t.id ? "text-white" : "text-white/50"}`}>
                {t.label}
              </div>
            </button>
          ))}
        </div>

        {/* SUBTOPIC TAB */}
        {tab === "subtopic" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="pb-4 border-b border-white/[0.06]">
              <div className="text-white text-sm font-semibold font-sans">Add a Subtopic</div>
              <div className="text-white/30 text-xs font-sans mt-0.5">Pick a content type and optionally attach a file. Large audio uploads run directly to storage so no size limit besides 100MB per file.</div>
            </div>

            <CourseSelect value={sCourseId} onChange={setSCourseId} />

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Title *</label>
              <input value={sTitle} onChange={e => setSTitle(e.target.value)}
                placeholder="e.g. The Person and Work of the Holy Spirit" className={inp} />
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
                Description / Lesson Outline <span className="text-white/20 normal-case tracking-normal">(optional)</span>
              </label>
              <textarea value={sDescription} onChange={e => setSDescription(e.target.value)} rows={8}
                placeholder={"Paste lesson outline, summary, or full description here. Line breaks are preserved.\n\nLesson 1: ...\nLesson 2: ..."}
                className={`${inp} resize-y font-sans leading-relaxed whitespace-pre-wrap`} />
              <p className="text-white/20 text-xs font-sans mt-1">Tip: paste multiple lines, each on its own row. Students see them formatted.</p>
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subtopic Number</label>
              <input type="number" min="0" value={sOrderIndex} onChange={e => setSOrderIndex(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:border-[#D4A85C]/50" />
              <p className="text-white/20 text-xs font-sans mt-1">Auto-suggested based on existing subtopics</p>
            </div>

            {/* Content Type picker */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Content Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "video",  icon: Youtube,       label: "Video",  color: "text-red-400" },
                  { id: "audio",  icon: Mic,           label: "Audio",  color: "text-purple-400" },
                  { id: "slides", icon: Presentation, label: "Slides", color: "text-blue-400" },
                ] as const).map(c => (
                  <button key={c.id} type="button" onClick={() => setSContentType(c.id)}
                    className={`rounded-xl border p-3 transition-all ${
                      sContentType === c.id
                        ? "bg-[#D4A85C]/10 border-[#D4A85C]/30"
                        : "bg-white/[0.04] border-white/10 hover:border-white/25"
                    }`}>
                    <c.icon className={`w-4 h-4 mx-auto mb-1.5 ${sContentType === c.id ? "text-[#D4A85C]" : c.color}`} />
                    <div className={`text-xs font-semibold font-sans text-center ${sContentType === c.id ? "text-white" : "text-white/60"}`}>
                      {c.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {sContentType === "video" && (
              <div>
                <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">YouTube URL *</label>
                <input value={sYoutubeUrl} onChange={e => setSYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/... or paste full URL" className={inp} />
                {sYoutubeUrl && (
                  <p className={`text-xs mt-2 flex items-center gap-1.5 font-sans ${videoId ? "text-green-400" : "text-red-400"}`}>
                    {videoId
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Valid — preview below</>
                      : <><AlertCircle className="w-3.5 h-3.5" /> Invalid URL</>}
                  </p>
                )}
                {videoId && (
                  <div className="rounded-xl overflow-hidden border border-white/10 mt-3" style={{ aspectRatio: "16/9" }}>
                    <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>
            )}

            {sContentType === "audio" && (
              <div>
                <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Audio File *</label>
                <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all ${
                  sAudioFile ? "border-purple-400/40 bg-purple-400/[0.03]" : "border-white/10 hover:border-white/25"
                }`}>
                  <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac"
                    onChange={e => setSAudioFile(e.target.files?.[0] || null)} className="hidden" id="aud-input" />
                  <label htmlFor="aud-input" className="cursor-pointer block">
                    <Music className={`w-8 h-8 mx-auto mb-3 ${sAudioFile ? "text-purple-400" : "text-white/20"}`} />
                    {sAudioFile ? (
                      <>
                        <p className="text-white/80 text-sm font-semibold font-sans truncate px-2">{sAudioFile.name}</p>
                        <p className="text-white/30 text-xs font-sans mt-1">{(sAudioFile.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/50 text-sm font-sans">Click to select audio file</p>
                        <p className="text-white/25 text-xs font-sans mt-1">MP3, M4A, WAV — max 100MB</p>
                      </>
                    )}
                  </label>
                </div>
                {sAudioFile && (
                  <audio controls className="w-full mt-3" src={URL.createObjectURL(sAudioFile)} />
                )}
              </div>
            )}

            {sContentType === "slides" && (
              <div>
                <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Slides File (PDF or PPTX) *</label>
                <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all ${
                  sSlidesFile ? "border-blue-400/40 bg-blue-400/[0.03]" : "border-white/10 hover:border-white/25"
                }`}>
                  <input ref={slidesInputRef} type="file" accept=".pdf,.pptx,.ppt"
                    onChange={e => setSSlidesFile(e.target.files?.[0] || null)} className="hidden" id="slides-input" />
                  <label htmlFor="slides-input" className="cursor-pointer block">
                    <Presentation className={`w-8 h-8 mx-auto mb-3 ${sSlidesFile ? "text-blue-400" : "text-white/20"}`} />
                    {sSlidesFile ? (
                      <>
                        <p className="text-white/80 text-sm font-semibold font-sans truncate px-2">{sSlidesFile.name}</p>
                        <p className="text-white/30 text-xs font-sans mt-1">{(sSlidesFile.size / 1024 / 1024).toFixed(2)} MB · click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/50 text-sm font-sans">Click to select slides</p>
                        <p className="text-white/25 text-xs font-sans mt-1">PDF or PPTX — max 100MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Optional Attachment */}
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">
                Attachment <span className="text-white/20 normal-case tracking-normal">(optional handout, PDF, image, etc)</span>
              </label>
              <div className={`border border-dashed rounded-xl p-3 text-center transition-all ${
                sAttachment ? "border-[#D4A85C]/40 bg-[#D4A85C]/[0.03]" : "border-white/10 hover:border-white/25"
              }`}>
                <input ref={attachInputRef} type="file" accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.zip"
                  onChange={e => setSAttachment(e.target.files?.[0] || null)} className="hidden" id="attach-input" />
                <label htmlFor="attach-input" className="cursor-pointer block py-1">
                  {sAttachment ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-[#D4A85C]" />
                      <span className="text-white/80 truncate font-sans">{sAttachment.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); setSAttachment(null); if (attachInputRef.current) attachInputRef.current.value = ""; }}
                        className="text-white/30 hover:text-red-400 ml-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/40 text-xs font-sans">Click to attach a file</p>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">When to Publish</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["now", "schedule"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setSPublishMode(m)}
                    className={`py-2.5 rounded-xl text-xs font-semibold font-sans transition-all border flex items-center justify-center gap-2 ${
                      sPublishMode === m
                        ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                        : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/25"
                    }`}>
                    {m === "schedule" && <Calendar className="w-3.5 h-3.5" />}
                    {m === "now" ? "Publish Now" : "Schedule"}
                  </button>
                ))}
              </div>
              {sPublishMode === "schedule" && (
                <input type="datetime-local" value={sScheduledAt} onChange={e => setSScheduledAt(e.target.value)}
                  className={inp} />
              )}
            </div>

            {/* Progress bar shown during upload */}
            {sSaving && (
              <div className="bg-[#D4A85C]/[0.05] border border-[#D4A85C]/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4A85C]" />
                  <span className="text-[#D4A85C] text-xs font-semibold font-sans">{sStatusMsg}</span>
                  <span className="text-white/40 text-xs font-sans ml-auto tabular-nums">{sProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4A85C] transition-all duration-200 rounded-full"
                    style={{ width: `${sProgress}%` }} />
                </div>
              </div>
            )}

            {sSubtopics.length > 0 && !sSaving && (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <div className="px-4 py-2 border-b border-white/[0.06]">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">
                    {sSubtopics.length} subtopic{sSubtopics.length !== 1 ? "s" : ""} already in this course
                  </span>
                </div>
                {sSubtopics.map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 px-4 py-3 ${i < sSubtopics.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <span className="text-[#D4A85C]/40 text-xs font-mono w-5">{String(l.order_index).padStart(2, "0")}</span>
                    <span className="text-white/60 text-xs font-sans flex-1 truncate">{l.title}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {l.youtube_video_id && <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">V</span>}
                      {l.audio_url && <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">A</span>}
                      {l.slides_url && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">S</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSaveSubtopic} disabled={sSaving || !sTitle || !sCourseId}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
              {sSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                : <><Plus className="w-4 h-4" /> {sPublishMode === "now" ? "Publish Subtopic" : "Schedule Subtopic"}</>}
            </button>
          </div>
        )}

        {/* RESOURCES TAB */}
        {tab === "resources" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="pb-4 border-b border-white/[0.06]">
              <div className="text-white text-sm font-semibold font-sans">Course Resources</div>
              <div className="text-white/30 text-xs font-sans mt-0.5">Upload multiple files per course. Students see them grouped by category.</div>
            </div>

            <CourseSelect value={rCourseId} onChange={setRCourseId} />

            {rCourseId && (
              <>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Title *</label>
                    <input value={rTitle} onChange={e => setRTitle(e.target.value)}
                      placeholder="e.g. Module 1 Reading List" className={inp} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["Notes", "Slides", "Handout", "Reading"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setRCategory(c)}
                          className={`py-2 rounded-lg text-xs font-semibold font-sans transition-all border ${
                            rCategory === c
                              ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                              : "bg-white/[0.04] border-white/10 text-white/50 hover:border-white/25"
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">File *</label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                      rFile ? "border-[#D4A85C]/40 bg-[#D4A85C]/[0.03]" : "border-white/10 hover:border-white/25"
                    }`}>
                      <input ref={resourceInputRef} type="file" accept=".pdf,.docx,.doc,.pptx,.ppt,.zip,.png,.jpg,.jpeg"
                        onChange={e => setRFile(e.target.files?.[0] || null)} className="hidden" id="res-input" />
                      <label htmlFor="res-input" className="cursor-pointer block">
                        <Upload className={`w-7 h-7 mx-auto mb-2 ${rFile ? "text-[#D4A85C]" : "text-white/20"}`} />
                        {rFile ? (
                          <>
                            <p className="text-white/80 text-sm font-semibold font-sans truncate px-2">{rFile.name}</p>
                            <p className="text-white/30 text-xs font-sans mt-1">{(rFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <p className="text-white/50 text-sm font-sans">Click to select file</p>
                            <p className="text-white/25 text-xs font-sans mt-1">PDF, DOCX, PPTX, ZIP, image — max 100MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {rSaving && (
                    <div className="bg-[#D4A85C]/[0.05] border border-[#D4A85C]/20 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4A85C]" />
                        <span className="text-[#D4A85C] text-xs font-semibold font-sans">Uploading...</span>
                        <span className="text-white/40 text-xs font-sans ml-auto tabular-nums">{rProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4A85C] transition-all duration-200 rounded-full"
                          style={{ width: `${rProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveResource} disabled={rSaving || !rFile || !rTitle}
                    className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-2.5 rounded-full transition-all font-sans flex items-center justify-center gap-2">
                    {rSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Add Resource</>}
                  </button>
                </div>

                {resources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans">{resources.length} resource{resources.length !== 1 ? "s" : ""} in this course</h3>
                    {(["Notes", "Slides", "Handout", "Reading"] as const).map(cat => {
                      const items = resources.filter(r => r.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <div className="text-[#D4A85C] text-[10px] uppercase tracking-widest font-sans mb-2">{cat}</div>
                          <div className="space-y-1.5">
                            {items.map(r => (
                              <div key={r.id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                                <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                                  className="text-white/70 text-xs font-sans flex-1 truncate hover:text-[#D4A85C]">
                                  {r.title}
                                </a>
                                <button onClick={() => handleDeleteResource(r.id)}
                                  className="text-white/30 hover:text-red-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* MANAGE TAB */}
        {tab === "manage" && (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="pb-4 border-b border-white/[0.06]">
              <div className="text-white text-sm font-semibold font-sans">Manage Subtopics</div>
              <div className="text-white/30 text-xs font-sans mt-0.5">View and delete subtopics. Use Course Manager for full publish controls.</div>
            </div>
            <CourseSelect value={mCourseId} onChange={setMCourseId} />

            {mCourseId && mSubtopics.length === 0 && (
              <div className="text-white/30 text-sm font-sans text-center py-8">No subtopics in this course yet.</div>
            )}

            {mSubtopics.length > 0 && (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                {mSubtopics.map((l, i) => (
                  <div key={l.id} className={`flex items-center gap-3 px-4 py-3 ${i < mSubtopics.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <span className="text-[#D4A85C]/40 text-xs font-mono w-5">{String(l.order_index).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-sans truncate">{l.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {l.youtube_video_id && <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-sans">Video</span>}
                        {l.audio_url && <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-sans">Audio</span>}
                        {l.slides_url && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-sans">Slides</span>}
                        {l.attachment_url && <span className="text-[9px] bg-[#D4A85C]/10 text-[#D4A85C] px-1.5 py-0.5 rounded font-sans">+ File</span>}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${l.is_published ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/30"}`}>
                          {l.is_published ? "Live" : "Draft"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSubtopic(l.id, l.title)}
                      className="text-white/30 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
