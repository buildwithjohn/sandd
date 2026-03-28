"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Users, Video, FileText, BookOpen, Upload, ClipboardList, Award, Megaphone, LogOut, CheckCircle, Clock, XCircle } from "lucide-react";

const quickActions = [
  { icon: Upload,        label: "Upload Video Lesson",  href: "/admin/upload",             bg: "bg-brand-700 hover:bg-brand-800"   },
  { icon: FileText,      label: "Review Applications",  href: "/admin/applications",        bg: "bg-amber-600 hover:bg-amber-700"   },
  { icon: ClipboardList, label: "Grade Assignments",     href: "/admin/assignments",         bg: "bg-green-600 hover:bg-green-700"   },
  { icon: Users,         label: "Manage Students",       href: "/admin/students",            bg: "bg-purple-600 hover:bg-purple-700" },
  { icon: Award,         label: "Certificates",          href: "/admin/certificates",        bg: "bg-rose-600 hover:bg-rose-700"     },
  { icon: Megaphone,     label: "Post Announcement",     href: "/admin/announcements/new",   bg: "bg-teal-600 hover:bg-teal-700"     },
];

const recentApplications = [
  { initials: "OA", name: "Oluwaseun Adeyemi", church: "CCC Lagos",         date: "3 days ago", status: "pending"  },
  { initials: "CF", name: "Chiamaka Festus",   church: "CCC Ibadan",        date: "5 days ago", status: "accepted" },
  { initials: "BI", name: "Babatunde Ige",     church: "CCC Abuja",         date: "1 week ago", status: "accepted" },
  { initials: "EM", name: "Esther Madu",       church: "CCC Port Harcourt", date: "Today",      status: "pending"  },
];

const statusMap: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  pending:  { label: "Pending",  icon: Clock,       cls: "bg-amber-900/40 text-amber-300 border border-amber-700" },
  accepted: { label: "Accepted", icon: CheckCircle, cls: "bg-green-900/40 text-green-300 border border-green-700" },
  rejected: { label: "Rejected", icon: XCircle,     cls: "bg-red-900/40 text-red-300 border border-red-700"       },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState({ students: 0, videos: 0, applications: 0, cohorts: 1 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
      if (profile?.role !== "admin") { router.push("/portal/dashboard"); return; }
      setAdminName(profile.full_name?.split(" ")[0] ?? "Admin");
      const [{ count: students }, { count: videos }, { count: applications }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("lessons").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({ students: students ?? 0, videos: videos ?? 0, applications: applications ?? 0, cohorts: 1 });
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* NAV */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-white text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
                {adminName.slice(0,2).toUpperCase()}
              </div>
              <span className="text-gray-300 text-xs font-medium">{adminName}</span>
              <span className="text-[10px] bg-brand-900 text-brand-300 px-1.5 py-0.5 rounded-full border border-brand-800">Admin</span>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-950 border border-gray-700 hover:border-red-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* SIDEBAR */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <nav className="bg-gray-900 border border-gray-800 rounded-2xl p-3 sticky top-24">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
            {[
              { href: "/admin/dashboard",         icon: "🏠", label: "Dashboard"    },
              { href: "/admin/applications",      icon: "📋", label: "Applications" },
              { href: "/admin/students",          icon: "👥", label: "Students"     },
              { href: "/admin/upload",            icon: "🎬", label: "Upload Video" },
              { href: "/admin/assignments",       icon: "📝", label: "Assignments"  },
              { href: "/admin/certificates",      icon: "🏅", label: "Certificates" },
              { href: "/admin/announcements/new", icon: "📢", label: "Announce"     },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
            <div className="border-t border-gray-800 mt-2 pt-2">
              <button onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-red-400 hover:bg-red-950 w-full transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 space-y-6">
          <div>
            <h1 className="font-display text-2xl text-white font-medium">Welcome, Prophet {adminName} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening at S&D Prophetic School.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Students",            value: stats.students,     icon: Users,    color: "text-brand-400"  },
              { label: "Videos Published",    value: stats.videos,       icon: Video,    color: "text-green-400"  },
              { label: "Pending Applicants",  value: stats.applications, icon: FileText, color: "text-amber-400"  },
              { label: "Active Cohorts",      value: stats.cohorts,      icon: BookOpen, color: "text-purple-400" },
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
                  <span className="text-white text-sm font-medium leading-snug">{a.label}</span>
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {recentApplications.map((a, i) => {
                const s = statusMap[a.status];
                const StatusIcon = s.icon;
                return (
                  <div key={a.name} className={`flex items-center gap-4 px-5 py-4 ${i < recentApplications.length - 1 ? "border-b border-gray-800" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-brand-900 border border-brand-800 flex items-center justify-center font-display font-semibold text-brand-300 text-sm flex-shrink-0">
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{a.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{a.church} · {a.date}</div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
