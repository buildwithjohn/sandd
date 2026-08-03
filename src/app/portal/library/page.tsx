"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { PlayCircle, FileDown, Music, Loader2, Youtube } from "lucide-react";

interface Material { id: string; title: string; file_url: string; file_name?: string; }
interface LibraryItem {
  id: string; title: string; description?: string; category: string;
  youtube_video_id?: string; audio_url?: string; created_at: string;
  materials?: Material[];
}

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("library_items")
      .select("*, materials:library_materials(*)")
      .eq("is_published", true)
      .order("category")
      .order("order_index")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as LibraryItem[]) ?? [];
        setItems(list);
        if (list.length > 0) setActive(list[0].id);
        setLoading(false);
      });
  }, []);

  // Group by category, preserving first-seen order
  const groups: { category: string; items: LibraryItem[] }[] = [];
  for (const item of items) {
    let g = groups.find(x => x.category === item.category);
    if (!g) { g = { category: item.category, items: [] }; groups.push(g); }
    g.items.push(item);
  }

  return (
    <PortalShell>
      <div className="space-y-5">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold theme-text mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Library
          </h1>
          <p className="theme-text-muted text-sm font-sans">Recordings and teachings you can revisit anytime — watch, listen, and download the notes.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center gap-2 theme-text-muted text-sm font-sans py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading the library...
          </div>
        ) : items.length === 0 ? (
          <div className="theme-bg-elevated rounded-2xl border theme-border p-10 text-center">
            <PlayCircle className="w-8 h-8 theme-text-muted mx-auto mb-3 opacity-40" />
            <p className="theme-text-muted text-sm font-sans">Nothing has been added to the library yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group, gi) => (
              <div key={group.category} className="space-y-3">
                <h2 className="theme-accent text-xs tracking-[0.15em] uppercase font-sans font-semibold">{group.category}</h2>
                <div className="space-y-3">
                  {group.items.map((item, i) => {
                    const isOpen = active === item.id;
                    return (
                      <motion.div key={item.id} variants={rise((gi + i) * 0.05)} initial="hidden" animate="visible">
                        <div className="theme-bg-elevated rounded-2xl border theme-border overflow-hidden"
                          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                          {/* Header */}
                          <button onClick={() => setActive(isOpen ? null : item.id)}
                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#D4A85C]/[0.03] transition-all">
                            <div className="w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-[#D4A85C]/10 border-[#D4A85C]/20">
                              {item.youtube_video_id ? <PlayCircle className="w-5 h-5 theme-accent" />
                                : item.audio_url ? <Music className="w-5 h-5 theme-accent" />
                                : <FileDown className="w-5 h-5 theme-accent" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="theme-text text-sm font-semibold mb-0.5" style={{ fontFamily: "'Georgia', serif" }}>{item.title}</div>
                              {item.description && <p className="theme-text-muted text-xs font-sans leading-relaxed line-clamp-2">{item.description}</p>}
                            </div>
                            <span className="theme-text-muted text-xs font-sans flex-shrink-0">{isOpen ? "Hide" : "Open"}</span>
                          </button>

                          {/* Body */}
                          {isOpen && (
                            <div className="px-5 pb-5 space-y-4">
                              {item.youtube_video_id && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border theme-border">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${item.youtube_video_id}?rel=0&modestbranding=1`}
                                    className="w-full h-full" allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                                </div>
                              )}

                              {item.audio_url && (
                                <div className="rounded-xl border theme-border p-3 bg-black/[0.02]">
                                  <div className="flex items-center gap-2 mb-2 theme-text-muted text-xs font-sans">
                                    <Music className="w-3.5 h-3.5" /> Audio
                                  </div>
                                  <audio controls src={item.audio_url} className="w-full" />
                                </div>
                              )}

                              {(item.materials?.length ?? 0) > 0 && (
                                <div className="space-y-2">
                                  <div className="theme-text-muted text-xs tracking-[0.1em] uppercase font-sans">Reading materials</div>
                                  {item.materials!.map(m => (
                                    <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" download
                                      className="flex items-center gap-3 rounded-xl border theme-border p-3 hover:border-[#D4A85C]/40 transition-all">
                                      <FileDown className="w-4 h-4 theme-accent flex-shrink-0" />
                                      <span className="flex-1 theme-text text-sm font-sans truncate">{m.title}</span>
                                      <span className="theme-text-muted text-xs font-sans">Download</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
