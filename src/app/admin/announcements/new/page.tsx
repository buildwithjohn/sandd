"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Pin, Send, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard",       icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications",    icon: "📋", label: "Applications" },
    { href: "/admin/students",        icon: "👥", label: "Students" },
    { href: "/admin/upload",          icon: "🎬", label: "Upload Video" },
    { href: "/admin/assignments",     icon: "📝", label: "Assignments" },
    { href: "/admin/certificates",    icon: "🏅", label: "Certificates" },
    { href: "/admin/announcements",   icon: "📢", label: "Announcements" },
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

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [title, setTitle]     = useState("");
  const [body, setBody]       = useState("");
  const [pinned, setPinned]   = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function publish() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcements").insert({
        title: title.trim(),
        body:  body.trim(),
        is_pinned: pinned,
        author_id: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Announcement published to all students.");
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-brand-950 border-b border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-display text-brand-100 text-sm font-semibold">S&D Admin Panel</span>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-medium">AS</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar active="Announcements" />

        <main className="flex-1 min-w-0 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-brand-900 text-2xl font-medium">New Announcement</h1>
              <p className="text-slate-400 text-sm mt-0.5">This will be visible to all enrolled students immediately.</p>
            </div>
            <button onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-medium border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
              <Eye className="w-4 h-4" />
              {preview ? "Edit" : "Preview"}
            </button>
          </div>

          {preview ? (
            /* Preview */
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 mb-5">
              <div className="flex items-start gap-2 mb-2">
                <h2 className="font-display text-brand-900 text-xl font-medium flex-1">{title || "Untitled announcement"}</h2>
                {pinned && (
                  <span className="bg-brand-100 text-brand-600 text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{body || "No content yet."}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-brand-600">Prophet Abiodun Sule</span>
                <span>·</span>
                <span>{new Date().toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
              </div>
            </div>
          ) : (
            /* Editor */
            <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 mb-5 space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. New Lessons Uploaded — Biblical Hermeneutics"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Body *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your announcement here..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors resize-none leading-relaxed"
                />
                <div className="text-xs text-slate-400 mt-1 text-right">
                  {body.trim().split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
              {/* Pin toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-100">
                <button
                  onClick={() => setPinned(!pinned)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${pinned ? "bg-brand-600" : "bg-slate-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${pinned ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <div>
                  <div className="text-sm font-medium text-brand-900 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5" /> Pin this announcement
                  </div>
                  <div className="text-xs text-slate-400">Pinned notices appear at the top of the announcements page</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/admin/dashboard"
              className="flex-1 border border-slate-200 text-slate-600 font-medium text-sm py-3 rounded-xl text-center hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button onClick={publish} disabled={saving}
              className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {saving ? "Publishing..." : "Publish to All Students"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
