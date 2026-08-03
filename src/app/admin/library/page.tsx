"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Youtube, Music, FileText, Plus, Loader2, Trash2, X,
  PlayCircle, Eye, EyeOff, Upload,
} from "lucide-react";

// ── Local helpers (kept private here so the Course Builder is untouched) ────
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.trim().match(p); if (m) return m[1]; }
  return null;
}

// Direct upload to Supabase Storage (materials bucket) with progress.
async function uploadToStorage(
  supabase: any, file: File, folder: string,
  onProgress: (pct: number) => void
): Promise<{ url: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: publicUrl });
        else {
          let msg = "Upload failed";
          try { const err = JSON.parse(xhr.responseText); msg = err.message || err.error || msg; } catch {}
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

interface Material { id: string; item_id: string; title: string; file_url: string; file_name?: string; }
interface LibraryItem {
  id: string; title: string; description?: string; category: string;
  youtube_video_id?: string; audio_url?: string; is_published: boolean;
  order_index: number; created_at: string; materials?: Material[];
}
interface PendingMaterial { file: File; title: string; }

const CATEGORIES = ["Live Class", "Teaching", "Extra Material", "Guest Session"];

const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";
const sel = "w-full bg-[#080C14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function AdminLibraryPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<PendingMaterial[]>([]);
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLInputElement>(null);
  const matRef = useRef<HTMLInputElement>(null);

  const videoId = extractYouTubeId(youtubeUrl);

  async function loadItems() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("library_items")
      .select("*, materials:library_materials(*)")
      .order("created_at", { ascending: false });
    setItems((data as LibraryItem[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { loadItems(); }, []);

  function addMaterialFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map(f => ({ file: f, title: f.name.replace(/\.[^.]+$/, "") }));
    setMaterials(prev => [...prev, ...next]);
    if (matRef.current) matRef.current.value = "";
  }

  function resetForm() {
    setTitle(""); setDescription(""); setCategory(CATEGORIES[0]);
    setYoutubeUrl(""); setAudioFile(null); setMaterials([]); setPublish(true);
    if (audioRef.current) audioRef.current.value = "";
    if (matRef.current) matRef.current.value = "";
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Enter a title."); return; }
    if (youtubeUrl && !videoId) { toast.error("That YouTube URL doesn't look valid."); return; }
    if (!videoId && !audioFile && materials.length === 0) {
      toast.error("Add a video, audio, or at least one material."); return;
    }
    setSaving(true); setProgress(0);
    try {
      const supabase = createClient();
      let audioUrl: string | undefined;
      const uploadedMaterials: { title: string; fileUrl: string; fileName: string }[] = [];

      if (audioFile) {
        setStatusMsg(`Uploading audio (${(audioFile.size / 1024 / 1024).toFixed(1)}MB)...`);
        setProgress(0);
        const { url } = await uploadToStorage(supabase, audioFile, "library", setProgress);
        audioUrl = url;
      }

      for (let i = 0; i < materials.length; i++) {
        const m = materials[i];
        setStatusMsg(`Uploading material ${i + 1} of ${materials.length}...`);
        setProgress(0);
        const { url } = await uploadToStorage(supabase, m.file, "library", setProgress);
        uploadedMaterials.push({ title: m.title.trim() || m.file.name, fileUrl: url, fileName: m.file.name });
      }

      setStatusMsg("Saving...");
      const res = await fetch("/api/admin/upload-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, category,
          youtubeId: videoId || null,
          audioUrl: audioUrl || null,
          isPublished: publish,
          orderIndex: 0,
          materials: uploadedMaterials,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      toast.success(publish ? "Added to the Library!" : "Saved as hidden.");
      resetForm();
      loadItems();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false); setProgress(0); setStatusMsg("");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" from the Library? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/upload-library?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Removed.");
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Could not delete.");
    }
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-[#D4A85C]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Georgia', serif" }}>Library</h1>
            <p className="text-white/40 text-sm font-sans">Permanent archive of recordings students can access anytime — video, audio, and reading materials.</p>
          </div>
        </div>

        {/* ── Add form ──────────────────────────────────────── */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hermeneutics — Day 2" className={inp} />
            </div>
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={sel}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Short summary students will see under the title." className={inp} />
          </div>

          {/* Video */}
          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans flex items-center gap-1.5 mb-2">
              <Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube URL
            </label>
            <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/... or paste full URL" className={inp} />
            {youtubeUrl && videoId && (
              <div className="mt-3 aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/10">
                <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} className="w-full h-full" allowFullScreen />
              </div>
            )}
            {youtubeUrl && !videoId && (
              <p className="text-red-400/80 text-xs font-sans mt-1">Couldn&apos;t read a video ID from that link.</p>
            )}
          </div>

          {/* Audio */}
          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans flex items-center gap-1.5 mb-2">
              <Music className="w-3.5 h-3.5 text-purple-400" /> Audio (optional)
            </label>
            {audioFile ? (
              <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-white/70 text-sm font-sans truncate">{audioFile.name}</span>
                <button onClick={() => { setAudioFile(null); if (audioRef.current) audioRef.current.value = ""; }}
                  className="text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <input ref={audioRef} type="file" accept="audio/*"
                onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                className="text-white/50 text-sm font-sans file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#D4A85C]/10 file:text-[#D4A85C] file:text-xs" />
            )}
          </div>

          {/* Materials */}
          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Reading materials (PDFs, notes — add as many as you like)
            </label>
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <input value={m.title}
                    onChange={e => setMaterials(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                    className="flex-1 bg-transparent text-white/80 text-sm font-sans focus:outline-none" />
                  <span className="text-white/30 text-xs font-sans truncate max-w-[120px]">{m.file.name}</span>
                  <button onClick={() => setMaterials(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <input ref={matRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" multiple
                onChange={e => addMaterialFiles(e.target.files)}
                className="text-white/50 text-sm font-sans file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-500/10 file:text-blue-300 file:text-xs" />
            </div>
          </div>

          {/* Publish + save */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
            <label className="flex items-center gap-2 text-white/60 text-sm font-sans cursor-pointer">
              <input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)}
                className="accent-[#D4A85C] w-4 h-4" />
              Visible to students now
            </label>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-50 text-[#0D1320] text-sm font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Uploading..." : "Add to Library"}
            </button>
          </div>
          {saving && statusMsg && (
            <div className="space-y-1.5">
              <p className="text-white/50 text-xs font-sans flex items-center gap-1.5"><Upload className="w-3 h-3" /> {statusMsg}</p>
              {progress > 0 && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4A85C] transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Existing items ────────────────────────────────── */}
        <div>
          <h2 className="text-white/50 text-xs tracking-[0.15em] uppercase font-sans mb-3">In the Library ({items.length})</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-white/40 text-sm font-sans py-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
          ) : items.length === 0 ? (
            <p className="text-white/30 text-sm font-sans py-6 text-center">Nothing here yet. Add your first recording above.</p>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="bg-[#0D1320] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                    {item.youtube_video_id ? <Youtube className="w-4 h-4 text-red-400" />
                      : item.audio_url ? <Music className="w-4 h-4 text-purple-400" />
                      : <FileText className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/90 text-sm font-semibold font-sans truncate" style={{ fontFamily: "'Georgia', serif" }}>{item.title}</span>
                      <span className="text-[10px] bg-[#D4A85C]/10 text-[#D4A85C] px-1.5 py-0.5 rounded font-sans">{item.category}</span>
                      {item.is_published
                        ? <span className="text-[10px] text-green-400/80 flex items-center gap-0.5 font-sans"><Eye className="w-3 h-3" /> Live</span>
                        : <span className="text-[10px] text-white/30 flex items-center gap-0.5 font-sans"><EyeOff className="w-3 h-3" /> Hidden</span>}
                    </div>
                    {item.description && <p className="text-white/40 text-xs font-sans mt-0.5 line-clamp-1">{item.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-sans text-white/30">
                      {item.youtube_video_id && <span className="flex items-center gap-0.5"><Youtube className="w-3 h-3" /> Video</span>}
                      {item.audio_url && <span className="flex items-center gap-0.5"><Music className="w-3 h-3" /> Audio</span>}
                      {(item.materials?.length ?? 0) > 0 && <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" /> {item.materials!.length} material{item.materials!.length !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id, item.title)}
                    className="text-white/30 hover:text-red-400 flex-shrink-0 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
