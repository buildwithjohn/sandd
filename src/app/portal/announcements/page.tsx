"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Pin, Clock, Megaphone } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data } = await supabase.from("announcements").select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      setAnnouncements(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Announcements
          </h1>
          <p className="text-[#9B9B9B] text-sm font-sans">{announcements.length} message{announcements.length !== 1 ? "s" : ""} from the school</p>
        </motion.div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center">
            <p className="text-[#9B9B9B] text-sm font-sans">Loading...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <Megaphone className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
            <p className="text-[#9B9B9B] text-sm font-sans">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <motion.div key={a.id} variants={rise(i * 0.07)} initial="hidden" animate="visible">
                <div className={`bg-white rounded-2xl border p-6 ${
                  a.is_pinned ? "border-[#D4A85C]/30" : "border-[#E8E2D9]"
                }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  {a.is_pinned && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Pin className="w-3 h-3 text-[#D4A85C]" />
                      <span className="text-[#D4A85C] text-[10px] font-sans uppercase tracking-widest">Pinned</span>
                    </div>
                  )}
                  <h2 className="text-[#1A1A2E] text-base font-semibold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                    {a.title}
                  </h2>
                  <p className="text-[#6B6B6B] text-sm font-sans leading-relaxed mb-4 whitespace-pre-wrap">{a.body}</p>
                  <div className="flex items-center gap-1.5 text-[#C4BDB2] text-xs font-sans">
                    <Clock className="w-3 h-3" />
                    {new Date(a.published_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
