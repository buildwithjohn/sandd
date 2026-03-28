"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { Plus, Pin, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      setAnnouncements(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function deleteAnnouncement(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success("Announcement deleted");
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white font-medium">Announcements</h1>
            <p className="text-gray-500 text-sm mt-1">{announcements.length} total announcements</p>
          </div>
          <Link href="/admin/announcements/new"
            className="flex items-center gap-2 bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Announcement
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No announcements yet.</p>
            <Link href="/admin/announcements/new"
              className="inline-flex items-center gap-2 mt-4 text-brand-400 hover:text-brand-300 text-sm font-medium">
              <Plus className="w-4 h-4" /> Post your first announcement
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.is_pinned && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-900/40 border border-amber-700 px-2 py-0.5 rounded-full">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-white text-lg font-medium">{a.title}</h2>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed line-clamp-2">{a.body}</p>
                    <div className="flex items-center gap-1 text-gray-600 text-xs mt-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.published_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
                    </div>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
