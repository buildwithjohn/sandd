"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, Eye, Pin } from "lucide-react";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [title, setTitle]     = useState("");
  const [body, setBody]       = useState("");
  const [pinned, setPinned]   = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function publish() {
    if (!title.trim() || !body.trim()) { toast.error("Title and body are required."); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcements").insert({
        title: title.trim(), body: body.trim(),
        is_pinned: pinned, author_id: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Announcement published to all students.");
      router.push("/admin/announcements");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white font-medium">New Announcement</h1>
            <p className="text-gray-500 text-sm mt-1">Visible to all enrolled students immediately.</p>
          </div>
          <button onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            <Eye className="w-4 h-4" /> {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="bg-gray-900 border border-brand-800/50 rounded-2xl p-6">
            <div className="flex items-start gap-2 mb-2">
              <h2 className="font-display text-white text-xl font-medium flex-1">{title || "Untitled"}</h2>
              {pinned && <span className="text-[10px] text-amber-300 bg-amber-900/40 border border-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{body || "No content yet."}</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New Lessons Uploaded"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Body *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                placeholder="Write your announcement here..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700">
              <button onClick={() => setPinned(!pinned)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${pinned ? "bg-brand-600" : "bg-gray-600"}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${pinned ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <div>
                <div className="text-sm text-white flex items-center gap-1"><Pin className="w-3.5 h-3.5" /> Pin this announcement</div>
                <div className="text-xs text-gray-500">Pinned notices appear at the top</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push("/admin/announcements")}
            className="flex-1 border border-gray-700 text-gray-300 font-medium text-sm py-3 rounded-xl hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={publish} disabled={saving}
            className="flex-1 bg-brand-700 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {saving ? "Publishing..." : "Publish to All Students"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
