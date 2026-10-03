"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Users, Video, FileText, BookOpen, Upload, ClipboardList, Award, Megaphone, CheckCircle, Clock, XCircle, Mail } from "lucide-react";
import LineField from "@/components/LineField";

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
  pending:  { label: "Pending",  icon: Clock,       cls: "bg-[#E0A64E]/10 text-[#E0A64E] border border-[#E0A64E]/20"   },
  accepted: { label: "Accepted", icon: CheckCircle, cls: "bg-green-500/10 text-green-400 border border-green-500/20"    },
  rejected: { label: "Rejected", icon: XCircle,     cls: "bg-red-500/10 text-red-400 border border-red-500/20"         },
};

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats]         = useState({ students: 0, videos: 0, applications: 0, cohorts: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [regOpen, setRegOpen]     = useState(false);
  const [waitlist, setWaitlist]   = useState<any[]>([]);
  const [togglingReg, setTogglingReg] = useState(false);
  const [enrollingAll, setEnrollingAll] = useState(false);
  const [enrollResult, setEnrollResult] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setAdminName(profile?.full_name?.split(" ")[0] ?? "Admin");
      // Figures via the service role (correct regardless of RLS).
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok) {
        setStats({
          students: data.students ?? 0, videos: data.videos ?? 0,
          applications: data.pendingApplications ?? 0, cohorts: data.activeCohorts ?? 0,
        });
        setRecentApps(data.recentApps ?? []);
        setRegOpen(!!data.registrationOpen);
        setWaitlist(data.waitlist ?? []);
      }
    }
    load();
  }, []);

  async function toggleRegistration() {
    setTogglingReg(true);
    try {
      const supabase = createClient();
      const newVal = (!regOpen).toString();
      await supabase.from("school_settings")
        .upsert({ key: "registration_open", value: newVal, updated_at: new Date().toISOString() }, { onConflict: "key" });
      setRegOpen(!regOpen);
    } catch (err) { console.error(err); }
    finally { setTogglingReg(false); }
  }

  async function enrollAllWaitlist() {
    if (!confirm(`Enroll all ${waitlist.length} waitlist members? Each person's login details will be emailed to them automatically.`)) return;
    setEnrollingAll(true);
    try {
      const res = await fetch("/api/admin/enroll-waitlist", { method: "POST" });
      const data = await res.json();
      setEnrollResult(data);
      setWaitlist([]);
      const sent = data.emailsSent ?? 0;
      toast.success(`${data.total} enrolled · ${sent} welcome email${sent !== 1 ? "s" : ""} sent automatically.`);
    } catch (err: any) {
      toast.error("Enrollment failed: " + err.message);
    } finally {
      setEnrollingAll(false);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AdminShell>
      <div className="space-y-6">

        {/* Greeting — kinetic hero */}
        <motion.div variants={rise(0)} initial="hidden" animate="visible"
          className="relative rounded-[24px] p-7 sm:p-9 overflow-hidden grad-hero"
          style={{ boxShadow: "0 20px 50px -20px rgba(45,27,94,0.5)" }}>
          <div className="absolute inset-0 line-drift opacity-80"><LineField stroke="#ffffff" /></div>
          <div className="absolute inset-0 line-drift2 opacity-40"><LineField stroke="#E0A64E" count={14} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-white/50" />
              <span className="text-white/80 text-xs tracking-[0.2em] uppercase font-sans">{greeting}</span>
            </div>
            <h1 className="kinetic-display text-4xl sm:text-5xl text-white leading-[0.9]">
              {adminName}
            </h1>
            <p className="text-white/70 text-sm font-sans mt-3">Here&apos;s what&apos;s happening across the school today.</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users,    label: "Students",           value: stats.students,     gold: false },
            { icon: Video,    label: "Videos Published",   value: stats.videos,       gold: false },
            { icon: FileText, label: "Pending Applicants", value: stats.applications, gold: true  },
            { icon: BookOpen, label: "Active Cohorts",     value: stats.cohorts,      gold: false },
          ].map((s, i) => (
            <motion.div key={s.label} variants={rise(i * 0.08)} initial="hidden" animate="visible">
              <div className="kcard-d p-5">
                <s.icon className={`w-4 h-4 mb-3 ${s.gold ? "text-[#E0A64E]" : "text-white/40"}`} />
                <div className="grad-text kinetic-display text-4xl mb-1">{s.value}</div>
                <div className="text-white/50 text-xs font-sans">{s.label}</div>
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
                    ? "grad-btn border-transparent"
                    : "glass-dark border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
                }`}>
                <a.icon className={`w-4 h-4 flex-shrink-0 ${a.gold ? "text-white" : "text-white/40 group-hover:text-white"}`} />
                <span className={`text-sm font-medium ${a.gold ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Registration Toggle */}
        <motion.div variants={rise(0.25)} initial="hidden" animate="visible">
          <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
            regOpen
              ? "bg-green-500/5 border-green-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}>
            <div className="flex items-center gap-3">
              {regOpen
                ? <span className="text-green-400 text-lg">●</span>
                : <span className="text-red-400 text-lg">○</span>
              }
              <div>
                <div className={`text-sm font-semibold font-sans ${regOpen ? "text-green-400" : "text-red-400"}`}>
                  Registration is {regOpen ? "OPEN" : "CLOSED"}
                </div>
                <div className="text-white/30 text-xs font-sans mt-0.5">
                  {regOpen ? "Students can currently register on the apply page" : "Apply page shows waitlist form only"}
                </div>
              </div>
            </div>
            <button onClick={toggleRegistration} disabled={togglingReg}
              className={`text-xs font-semibold font-sans px-5 py-2.5 rounded-full transition-all disabled:opacity-50 ${
                regOpen
                  ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  : "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
              }`}>
              {togglingReg ? "Saving..." : regOpen ? "Close Registration" : "Open Registration"}
            </button>
          </div>
        </motion.div>

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <motion.div variants={rise(0.28)} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/25 text-xs tracking-[0.2em] uppercase font-sans flex items-center gap-2">
                Waitlist ({waitlist.length})
              </div>
              <button onClick={enrollAllWaitlist} disabled={enrollingAll || waitlist.length === 0}
                className="grad-btn text-white disabled:opacity-40 text-[#080C14] text-xs font-bold font-sans px-4 py-2 rounded-full transition-all flex items-center gap-1.5">
                {enrollingAll ? "Enrolling..." : `Enroll All ${waitlist.length}`}
              </button>
            </div>
            <div className="ksurface-d border border-white/[0.07] overflow-hidden">
              {waitlist.map((w, i) => (
                <div key={w.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors
                  ${i < waitlist.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                  <div className="w-7 h-7 rounded-full bg-[#E0A64E]/10 border border-[#E0A64E]/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#E0A64E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-xs font-sans truncate">{w.full_name || "—"}</div>
                    <div className="text-white/30 text-[10px] font-sans mt-0.5">{w.email}</div>
                  </div>
                  <div className="text-white/20 text-[10px] font-sans flex-shrink-0">
                    {new Date(w.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enrollment results */}
        {enrollResult && enrollResult.enrolled && enrollResult.enrolled.length > 0 && (
          <motion.div variants={rise(0.3)} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <div className="text-green-400 text-xs tracking-[0.2em] uppercase font-sans flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> {enrollResult.enrolled.length} Enrolled · {enrollResult.emailsSent ?? 0} emailed automatically
              </div>
              <button onClick={() => setEnrollResult(null)}
                className="text-white/30 hover:text-white/60 text-xs font-sans transition-colors">
                Dismiss
              </button>
            </div>
            <div className="ksurface-d border border-green-500/20 overflow-hidden">
              {enrollResult.enrolled.map((s: any, i: number) => (
                <div key={s.email} className={`px-5 py-4 ${i < enrollResult.enrolled.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/80 text-sm font-medium font-sans">{s.name || "—"}</div>
                      <div className="text-white/40 text-xs font-sans mt-0.5">{s.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[#E0A64E] text-xs font-mono">{s.studentNumber}</div>
                      <div className="text-white/50 text-xs font-mono mt-1 bg-white/[0.05] px-2 py-0.5 rounded">{s.password}</div>
                      <div className={`text-[10px] font-sans mt-1 ${s.emailed ? "text-green-400" : "text-amber-400"}`}>
                        {s.emailed ? "✓ Email sent" : "⚠ Email failed — send manually"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 border-t border-white/[0.05] bg-[#E0A64E]/[0.05]">
                <p className="text-[#E0A64E]/70 text-xs font-sans">
                  Welcome emails with login details were sent automatically from sandd@abiodunsule.uk. Credentials are shown here as a backup only — resend manually to anyone marked &ldquo;Email failed&rdquo;.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent applications */}
        <motion.div variants={rise(0.3)} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white/25 text-xs tracking-[0.2em] uppercase font-sans">Recent Applications</div>
            <Link href="/admin/applications" className="text-[#E0A64E]/60 hover:text-[#E0A64E] text-xs font-sans transition-colors">
              View all →
            </Link>
          </div>
          <div className="ksurface-d border border-white/[0.07] overflow-hidden">
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
