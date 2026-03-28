"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { Users, Video, FileText, BookOpen, Upload, ClipboardList, Award, Megaphone, CheckCircle, Clock, XCircle } from "lucide-react";

const quickActions = [
  { icon: Upload,        label: "Upload Video",        href: "/admin/upload",          bg: "bg-brand-700 hover:bg-brand-600"   },
  { icon: FileText,      label: "Applications",        href: "/admin/applications",    bg: "bg-amber-700 hover:bg-amber-600"   },
  { icon: ClipboardList, label: "Grade Assignments",   href: "/admin/assignments",     bg: "bg-green-700 hover:bg-green-600"   },
  { icon: Users,         label: "Manage Students",     href: "/admin/students",        bg: "bg-purple-700 hover:bg-purple-600" },
  { icon: Award,         label: "Certificates",        href: "/admin/certificates",    bg: "bg-rose-700 hover:bg-rose-600"     },
  { icon: Megaphone,     label: "Announce",            href: "/admin/announcements",   bg: "bg-teal-700 hover:bg-teal-600"     },
];

const statusMap: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  pending:  { label: "Pending",  icon: Clock,       cls: "bg-amber-900/40 text-amber-300 border border-amber-700" },
  accepted: { label: "Accepted", icon: CheckCircle, cls: "bg-green-900/40 text-green-300 border border-green-700" },
  rejected: { label: "Rejected", icon: XCircle,     cls: "bg-red-900/40 text-red-300 border border-red-700"       },
};

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState({ students: 0, videos: 0, applications: 0 });
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
        supabase.from("applications").select("*").order("applied_at", { ascending: false }).limit(4),
      ]);
      setStats({ students: students ?? 0, videos: videos ?? 0, applications: applications ?? 0 });
      setRecentApps(apps ?? []);
    }
    load();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">Welcome, {adminName} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening at S&D Prophetic School.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Students",           value: stats.students,     icon: Users,    color: "text-brand-400"  },
            { label: "Videos Published",   value: stats.videos,       icon: Video,    color: "text-green-400"  },
            { label: "Pending Applicants", value: stats.applications, icon: FileText, color: "text-amber-400"  },
            { label: "Active Cohorts",     value: 1,                  icon: BookOpen, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
              <div className="font-display text-3xl text-white font-semibold">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map(a => (
              <Link key={a.label} href={a.href}
                className={`${a.bg} rounded-2xl p-4 flex items-center gap-3 transition-all`}>
                <a.icon className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white text-sm font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-500 text-xs uppercase tracking-widest">Recent Applications</h2>
            <Link href="/admin/applications" className="text-brand-400 text-xs hover:text-brand-300">View all →</Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-gray-500 text-sm">No applications yet.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {recentApps.map((a, i) => {
                const s = statusMap[a.status] ?? statusMap.pending;
                const StatusIcon = s.icon;
                return (
                  <div key={a.id} className={`flex items-center gap-4 px-5 py-4 ${i < recentApps.length - 1 ? "border-b border-gray-800" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-brand-900 border border-brand-800 flex items-center justify-center font-display font-semibold text-brand-300 text-sm flex-shrink-0">
                      {a.full_name.split(" ").map((n: string) => n[0]).slice(0,2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{a.full_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{a.church} · {new Date(a.applied_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
