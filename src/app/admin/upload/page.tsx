"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Youtube, CheckCircle, AlertCircle } from "lucide-react";

interface Course { id: string; slug: string; title: string; year: number; }

function extractYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = input.match(p); if (m) return m[1]; }
  return null;
}

export default function UploadVideoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId]     = useState("");
  const [title, setTitle]           = useState("");
  const [youtubeInput, setYoutube]  = useState("");
  const [orderIndex, setOrder]      = useState("1");
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const videoId = extractYouTubeId(youtubeInput);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("courses").select("id, slug, title, year").order("order_index");
      setCourses(data ?? []);
    }
    load();
  }, []);

  async function handlePublish() {
    if (!title || !courseId || !videoId) { toast.error("Fill in all fields with a valid YouTube URL."); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("lessons").insert({
        course_id: courseId, title,
        youtube_video_id: videoId,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        order_index: parseInt(orderIndex),
        is_published: true,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Lesson published!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-xl space-y-5">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">Upload Video Lesson</h1>
          <p className="text-gray-500 text-sm mt-1">Upload to YouTube as Unlisted, then paste the link here.</p>
        </div>

        {/* How-to guide */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="w-4 h-4 text-red-400" />
            <span className="text-gray-300 text-sm font-medium">How to add a lesson video</span>
          </div>
          <ol className="space-y-1 text-gray-500 text-xs">
            <li>1. Go to <a href="https://studio.youtube.com" target="_blank" className="text-brand-400">studio.youtube.com</a></li>
            <li>2. Upload your MP4 → set visibility to <span className="text-yellow-400 font-medium">Unlisted</span></li>
            <li>3. Copy the video URL and paste below</li>
          </ol>
        </div>

        {done ? (
          <div className="bg-gray-900 border border-green-800 rounded-2xl p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h2 className="font-display text-white text-xl font-medium mb-2">Lesson Published!</h2>
            <p className="text-gray-400 text-sm mb-5">Students can now watch this lesson.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setDone(false); setTitle(""); setYoutube(""); setCourseId(""); setOrder("1"); }}
                className="bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors">
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Course *</label>
              <select value={courseId} onChange={e => setCourseId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500">
                <option value="">Select a course</option>
                <optgroup label="Year 1">
                  {courses.filter(c => c.year === 1).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </optgroup>
                <optgroup label="Year 2">
                  {courses.filter(c => c.year === 2).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Lesson Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. What is New Testament Prophecy?"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">YouTube URL *</label>
              <input value={youtubeInput} onChange={e => setYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
              {youtubeInput && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${videoId ? "text-green-400" : "text-red-400"}`}>
                  {videoId ? <><CheckCircle className="w-3 h-3" /> Valid — ID: {videoId}</> : <><AlertCircle className="w-3 h-3" /> Invalid URL</>}
                </p>
              )}
            </div>
            {videoId && (
              <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allowFullScreen />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Lesson Number</label>
              <input type="number" min="0" value={orderIndex} onChange={e => setOrder(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
              <p className="text-xs text-gray-600 mt-1">Use 0 for Welcome Module</p>
            </div>
            <button onClick={handlePublish} disabled={saving || !videoId || !title || !courseId}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-40 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Youtube className="w-4 h-4" />
              {saving ? "Publishing..." : "Publish Lesson"}
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
