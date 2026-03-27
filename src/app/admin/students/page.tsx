"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Search, CheckCircle, XCircle, Clock, ChevronDown, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

const students = [
  { id: "s1", name: "Chiamaka Festus",  initials: "CF", email: "chiamaka.f@yahoo.com",   phone: "+234 803 456 7890", church: "CCC Ibadan",        city: "Ibadan",       year: 1, status: "active",    enrolled: "March 1, 2025",  progress: 72, lessons_done: 14, quiz_avg: 88 },
  { id: "s2", name: "Babatunde Ige",    initials: "BI", email: "btige@email.com",          phone: "+234 806 789 0123", church: "CCC Abuja",         city: "Abuja",        year: 1, status: "active",    enrolled: "March 1, 2025",  progress: 65, lessons_done: 12, quiz_avg: 79 },
  { id: "s3", name: "Adeyemi Ogunlade", initials: "AO", email: "a.ogunlade@gmail.com",     phone: "+234 801 234 5678", church: "CCC Lagos",         city: "Lagos",        year: 1, status: "active",    enrolled: "March 1, 2025",  progress: 48, lessons_done: 9,  quiz_avg: 82 },
  { id: "s4", name: "Esther Madu",      initials: "EM", email: "esther.madu@gmail.com",    phone: "+234 809 012 3456", church: "CCC Port Harcourt", city: "Port Harcourt",year: 1, status: "active",    enrolled: "March 5, 2025",  progress: 30, lessons_done: 6,  quiz_avg: 75 },
  { id: "s5", name: "Funmi Adeleke",    initials: "FA", email: "funmi.adeleke@outlook.com",phone: "+234 802 345 6789", church: "CCC Kano",          city: "Kano",         year: 1, status: "suspended", enrolled: "March 1, 2025",  progress: 10, lessons_done: 2,  quiz_avg: 60 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-green-50 text-green-600 border-green-200" },
  suspended: { label: "Suspended", className: "bg-red-50 text-red-500 border-red-200" },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-600 border-amber-200" },
  graduated: { label: "Graduated", className: "bg-blue-50 text-brand-600 border-brand-200" },
};

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard",     icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications",  icon: "📋", label: "Applications" },
    { href: "/admin/students",      icon: "👥", label: "Students" },
    { href: "/admin/upload",        icon: "🎬", label: "Upload Video" },
    { href: "/admin/assignments",   icon: "📝", label: "Assignments" },
    { href: "/admin/certificates",  icon: "🏅", label: "Certificates" },
    { href: "/admin/announcements", icon: "📢", label: "Announcements" },
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

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.church.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  async function toggleStatus(studentId: string, current: string) {
    const newStatus = current === "active" ? "suspended" : "active";
    setUpdating(studentId);
    try {
      const supabase = createClient();
      await supabase.from("profiles")
        .update({ enrollment_status: newStatus })
        .eq("id", studentId);
      toast.success(`Student ${newStatus === "active" ? "reactivated" : "suspended"}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
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
        <AdminSidebar active="Students" />

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-brand-900 text-2xl font-medium">Students</h1>
              <p className="text-slate-400 text-sm mt-0.5">{students.filter(s => s.status === "active").length} active students</p>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, church, or email..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex gap-1 bg-white rounded-xl border border-blue-100 p-1">
              {["all", "active", "suspended"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f ? "bg-brand-700 text-white" : "text-slate-400 hover:text-slate-600"
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Church</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const st = statusConfig[s.status];
                    return (
                      <>
                        <tr key={s.id} className="border-b border-blue-50 last:border-0 hover:bg-brand-50/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-display font-semibold text-brand-700 text-xs flex-shrink-0">
                                {s.initials}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-brand-900">{s.name}</div>
                                <div className="text-xs text-slate-400">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <div className="text-sm text-slate-600">{s.church}</div>
                            <div className="text-xs text-slate-400">{s.city}</div>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.progress}%` }} />
                              </div>
                              <span className="text-xs text-slate-400">{s.progress}%</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{s.lessons_done} lessons · {s.quiz_avg}% quiz avg</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.className}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                              className="text-slate-400 hover:text-brand-600 transition-colors">
                              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === s.id ? "rotate-180" : ""}`} />
                            </button>
                          </td>
                        </tr>
                        {expanded === s.id && (
                          <tr key={`${s.id}-expand`} className="bg-brand-50/40 border-b border-blue-50">
                            <td colSpan={5} className="px-5 py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white rounded-xl border border-blue-100 p-3 text-center">
                                  <div className="font-display text-brand-900 text-xl font-semibold">{s.progress}%</div>
                                  <div className="text-xs text-slate-400">Overall Progress</div>
                                </div>
                                <div className="bg-white rounded-xl border border-blue-100 p-3 text-center">
                                  <div className="font-display text-brand-900 text-xl font-semibold">{s.lessons_done}</div>
                                  <div className="text-xs text-slate-400">Lessons Done</div>
                                </div>
                                <div className="bg-white rounded-xl border border-blue-100 p-3 text-center">
                                  <div className="font-display text-brand-900 text-xl font-semibold">{s.quiz_avg}%</div>
                                  <div className="text-xs text-slate-400">Quiz Average</div>
                                </div>
                                <div className="bg-white rounded-xl border border-blue-100 p-3 text-center">
                                  <div className="font-display text-brand-900 text-xl font-semibold">Year {s.year}</div>
                                  <div className="text-xs text-slate-400">Current Year</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <a href={`mailto:${s.email}`}
                                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium">
                                  <Mail className="w-3.5 h-3.5" /> Email Student
                                </a>
                                <button
                                  onClick={() => toggleStatus(s.id, s.status)}
                                  disabled={updating === s.id}
                                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                    s.status === "active"
                                      ? "border-red-200 text-red-500 hover:bg-red-50"
                                      : "border-green-200 text-green-600 hover:bg-green-50"
                                  }`}>
                                  {s.status === "active"
                                    ? <><XCircle className="w-3.5 h-3.5" /> {updating === s.id ? "Suspending..." : "Suspend"}</>
                                    : <><CheckCircle className="w-3.5 h-3.5" /> {updating === s.id ? "Reactivating..." : "Reactivate"}</>
                                  }
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
