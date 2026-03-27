"use client";
export const dynamic = 'force-dynamic';
import { useState, useRef } from "react";
import Link from "next/link";
import { BookOpen, Upload, CheckCircle, X, FileVideo, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BUNNY_API_KEY = process.env.NEXT_PUBLIC_BUNNY_API_KEY ?? "";

const courses = [
  { id: "course-uuid-1", label: "Intro to NT Prophecy",          year: 1 },
  { id: "course-uuid-2", label: "Person & Work of the HS",       year: 1 },
  { id: "course-uuid-3", label: "Biblical Hermeneutics",         year: 1 },
  { id: "course-uuid-4", label: "Spirituality vs. Spiritism",    year: 1 },
  { id: "course-uuid-5", label: "Prayer & Intimacy with God",    year: 1 },
  { id: "course-uuid-6", label: "Character & Ethics",            year: 1 },
  { id: "course-uuid-7", label: "Advanced Prophetic Ministry",   year: 2 },
  { id: "course-uuid-8", label: "Discernment & Deliverance",     year: 2 },
];

type UploadState = "idle" | "creating" | "uploading" | "publishing" | "done" | "error";

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard",     icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications",  icon: "📋", label: "Applications" },
    { href: "/admin/students",      icon: "👥", label: "Students" },
    { href: "/admin/upload",        icon: "🎬", label: "Upload Video" },
    { href: "/admin/assignments",   icon: "📝", label: "Assignments" },
    { href: "/admin/certificates",  icon: "🏅", label: "Certificates" },
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

export default function UploadVideoPage() {
  const [title, setTitle]       = useState("");
  const [courseId, setCourseId] = useState("");
  const [orderIndex, setOrder]  = useState("1");
  const [videoFile, setVideo]   = useState<File | null>(null);
  const [notesFile, setNotes]   = useState<File | null>(null);
  const [state, setState]       = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setError]    = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function reset() {
    setTitle(""); setCourseId(""); setOrder("1");
    setVideo(null); setNotes(null);
    setState("idle"); setProgress(0); setError("");
  }

  async function handleUpload() {
    if (!title || !courseId || !videoFile) {
      toast.error("Please fill in all required fields and select a video.");
      return;
    }

    try {
      // ── Step 1: Create video slot on Bunny via our API ────────────────────
      setState("creating");
      const createRes = await fetch("/api/upload/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, courseId, orderIndex: parseInt(orderIndex) }),
      });
      if (!createRes.ok) throw new Error((await createRes.json()).error);
      const { lessonId, bunnyVideoId, uploadUrl } = await createRes.json();

      // ── Step 2: Upload video directly to Bunny.net with progress ─────────
      setState("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload network error")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("AccessKey", BUNNY_API_KEY);
        xhr.setRequestHeader("Content-Type", "video/*");
        xhr.send(videoFile);
      });

      // ── Step 3: Upload notes PDF to Supabase Storage (optional) ──────────
      let notesUrl: string | null = null;
      if (notesFile) {
        const formData = new FormData();
        formData.append("file", notesFile);
        formData.append("lessonId", lessonId);
        // In production: upload to Supabase storage bucket 'lesson-notes'
        // For now we pass null — notes can be uploaded separately
      }

      // ── Step 4: Mark lesson as published ─────────────────────────────────
      setState("publishing");
      const publishRes = await fetch("/api/upload/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, bunnyVideoId, notesUrl }),
      });
      if (!publishRes.ok) throw new Error((await publishRes.json()).error);

      setState("done");
      toast.success("Video uploaded and published successfully!");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setState("error");
    }
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setState("idle");
    setProgress(0);
  }

  const stateLabel: Record<UploadState, string> = {
    idle:       "Upload & Publish",
    creating:   "Creating video slot...",
    uploading:  `Uploading... ${progress}%`,
    publishing: "Publishing lesson...",
    done:       "Published!",
    error:      "Try Again",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-brand-950 border-b border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-display text-brand-100 text-sm font-semibold">S&D Admin Panel</span>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-medium">AS</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar active="Upload Video" />

        <main className="flex-1 min-w-0 max-w-xl">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">Upload Video Lesson</h1>
            <p className="text-slate-400 text-sm mt-0.5">Videos are hosted on Bunny.net — private, fast, no ads.</p>
          </div>

          {/* Done state */}
          {state === "done" ? (
            <div className="bg-white rounded-2xl border border-green-200 shadow-card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-display text-brand-900 text-xl font-medium mb-2">Lesson Published!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Students enrolled in <strong className="text-brand-900">{courses.find(c => c.id === courseId)?.label}</strong> can now watch this lesson.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset}
                  className="bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors">
                  Upload Another
                </button>
                <Link href="/admin/dashboard"
                  className="border border-slate-200 text-slate-600 font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 space-y-5">

              {/* Course */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Course *</label>
                <select value={courseId} onChange={e => setCourseId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400">
                  <option value="">Select a course</option>
                  <optgroup label="Year 1">
                    {courses.filter(c => c.year === 1).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Year 2">
                    {courses.filter(c => c.year === 2).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Lesson Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. What is New Testament Prophecy?"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Order */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Lesson Number</label>
                <input type="number" min="1" value={orderIndex} onChange={e => setOrder(e.target.value)}
                  className="w-32 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400"
                />
                <p className="text-xs text-slate-400 mt-1">The order this lesson appears in the course</p>
              </div>

              {/* Video file */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Video File * (MP4)</label>
                {videoFile ? (
                  <div className="flex items-center gap-3 border border-brand-200 bg-brand-50 rounded-xl px-4 py-3">
                    <FileVideo className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-brand-900 font-medium truncate">{videoFile.name}</div>
                      <div className="text-xs text-slate-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <button onClick={() => setVideo(null)} className="text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-400 bg-brand-50/30 transition-colors">
                    <Upload className="w-6 h-6 text-brand-400" />
                    <span className="text-brand-600 text-sm font-medium">Click to select MP4 video</span>
                    <span className="text-slate-400 text-xs">Max 2GB · MP4, MOV</span>
                    <input type="file" className="hidden" accept=".mp4,.mov,.avi"
                      onChange={e => setVideo(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              {/* Notes PDF */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Lesson Notes PDF (optional)</label>
                {notesFile ? (
                  <div className="flex items-center gap-3 border border-blue-100 bg-blue-50 rounded-xl px-4 py-3">
                    <span className="text-lg">📄</span>
                    <span className="flex-1 text-sm text-brand-900 truncate">{notesFile.name}</span>
                    <button onClick={() => setNotes(null)} className="text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-brand-400 bg-brand-50/20 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">Upload PDF notes for students</span>
                    <input type="file" className="hidden" accept=".pdf"
                      onChange={e => setNotes(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              {/* Upload progress */}
              {(state === "uploading" || state === "creating" || state === "publishing") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{stateLabel[state]}</span>
                    {state === "uploading" && <span>{progress}%</span>}
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: state === "uploading" ? `${progress}%` : state === "creating" ? "5%" : "98%" }}
                    />
                  </div>
                  {state === "uploading" && (
                    <button onClick={cancelUpload} className="text-xs text-red-400 hover:text-red-600">Cancel upload</button>
                  )}
                </div>
              )}

              {/* Error */}
              {state === "error" && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={state === "error" ? reset : handleUpload}
                disabled={["creating","uploading","publishing"].includes(state)}
                className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {stateLabel[state]}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
