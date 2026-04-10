"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Users, Video, FileText, BookOpen, Upload, ClipboardList, Award, Megaphone, CheckCircle, Clock, XCircle } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

const quickActions = [
  { icon: Upload,        label: "Upload Video",       href: "/admin/upload",         gold: true  },
  { icon: ClipboardList, label: "Applications",       href: "/admin/applications",   gold: false },
  { icon: FileText,      label: "Grade Assignments",  href: "/admin/assignments",    gold: false },
  { icon: Users,         label: "Manage Students",    href: "/admin/students",       gold: false },
  { icon: Award,         label: "Certificates",       href: "/admin/certificates",   gold: false },
  { icon: Megaphone,     label: "Announce",           href: "/admin/announcements",  gold: false },
];

const statusConfig: Record<string, { label: string; icon: any; cls: string }> = {
  pending:  { label: "Pending",  icon: Clock,       cls: "bg-[#D4A85C]/10 text-[#D4A85C] border border-[#D4A85C]/20"   },
  accepted: { label: "Accepted", icon: CheckCircle, cls: "bg-green-500/10 text-green-400 border border-green-500/20"    },
  rejected: { label: "Rejected", icon: XCircle,     cls: "bg-red-500/10 text-red-400 border border-red-500/20"         },
};

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats]         = useState({ students: 0, videos: 0, applications: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setAdminName(profile?.full_name?.split(" ")[0] ?? "Admin");
      const [{ count: students }, { count: videos }, { count: applications }, { data: apps }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("*").order("applied_at", { ascending: false }).limit(5),
      ]);
      setStats({ students: students ?? 0, videos: videos ?? 0, applications: applications ?? 0 });
      setRecentApps(apps ?? []);
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Greeting */}
        <motion.div variants={rise(0)} initial="hidden" animate="visible">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-8 bg-[#D4A85C]/40" />
            <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">{greeting}</span>
          </div>
          <h1 className="text-3xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
            {adminName}
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users,    label: "Students",           value: stats.students,     gold: false },
            { icon: Video,    label: "Videos Published",   value: stats.videos,       gold: false },
            { icon: FileText, label: "Pending Applicants", value: stats.applications, gold: true  },
            { icon: BookOpen, label: "Active Cohorts",     value: 1,                  gold: false },
          ].map((s, i) => (
            <motion.div key={s.label} variants={rise(i * 0.08)} initial="hidden" animate="visible">
              <div className={`rounded-2xl border p-5 ${
                s.gold ? "bg-[#D4A85C]/5 border-[#D4A85C]/20" : "bg-[#0D1320] border-white/[0.07]"
              }`}>
                <s.icon className={`w-4 h-4 mb-3 ${s.gold ? "text-[#D4A85C]" : "text-white/30"}`} />
                <div className={`text-3xl font-semibold mb-1 ${s.gold ? "text-[#D4A85C]" : "text-white"}`}
                  style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
                <div className="text-white/30 text-xs font-sans">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div variants={rise(0.2)} initial="hidden" animate="visible">
          <div className="text-white/25 text-xs tracking-[0.2em] uppercase font-sans mb-3">Quick Actions</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map(a => (
              <Link key={a.label} href={a.href}
                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  a.gold
                    ? "bg-[#D4A85C] border-[#D4A85C] hover:bg-[#C49848] hover:border-[#C49848]"
                    : "bg-[#0D1320] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
                }`}>
                <a.icon className={`w-4 h-4 flex-shrink-0 ${a.gold ? "text-[#1A1A2E]" : "text-white/40 group-hover:text-white"}`} />
                <span className={`text-sm font-medium ${a.gold ? "text-[#1A1A2E]" : "text-white/60 group-hover:text-white"}`}>
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent applications */}
        <motion.div variants={rise(0.3)} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white/25 text-xs tracking-[0.2em] uppercase font-sans">Recent Applications</div>
            <Link href="/admin/applications" className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-xs font-sans transition-colors">
              View all →
            </Link>
          </div>
          <div className="bg-[#0D1320] rounded-2xl border border-white/[0.07] overflow-hidden">
            {recentApps.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-white/25 text-sm font-sans">No applications yet.</p>
              </div>
            ) : (
              recentApps.map((a, i) => {
                const s = statusConfig[a.status] ?? statusConfig.pending;
                const StatusIcon = s.icon;
                return (
                  <div key={a.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors
                    ${i < recentApps.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-sans text-xs text-white/50 flex-shrink-0">
                      {a.full_name.split(" ").map((n: string) => n[0]).slice(0,2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-medium truncate">{a.full_name}</div>
                      <div className="text-white/30 text-xs font-sans mt-0.5">
                        {a.church} · {new Date(a.applied_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 font-sans ${s.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AdminShell>
  );
}
