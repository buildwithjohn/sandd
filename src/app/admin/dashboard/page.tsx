"use client";
import Link from "next/link";
import { BookOpen, Users, Video, FileText, Bell, Upload, CheckCircle, Clock, XCircle } from "lucide-react";

const stats = [
  { label: "Students Enrolled", value: "34", icon: Users, color: "bg-brand-50 text-brand-600 border-brand-100" },
  { label: "Videos Uploaded", value: "12", icon: Video, color: "bg-green-50 text-green-600 border-green-100" },
  { label: "Pending Applications", value: "4", icon: FileText, color: "bg-amber-50 text-amber-600 border-amber-100" },
  { label: "Active Cohorts", value: "1", icon: BookOpen, color: "bg-purple-50 text-purple-600 border-purple-100" },
];

const applications = [
  { initials: "OA", name: "Oluwaseun Adeyemi", church: "CCC Lagos", date: "3 days ago", status: "pending" },
  { initials: "CF", name: "Chiamaka Festus", church: "CCC Ibadan", date: "5 days ago", status: "accepted" },
  { initials: "BI", name: "Babatunde Ige", church: "CCC Abuja", date: "1 week ago", status: "accepted" },
  { initials: "EM", name: "Esther Madu", church: "CCC Port Harcourt", date: "Today", status: "pending" },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-50 text-amber-600" },
  accepted: { label: "Accepted", icon: CheckCircle, className: "bg-green-50 text-green-600" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-50 text-red-500" },
};

const quickActions = [
  { icon: "📢", label: "Post Announcement", href: "/admin/announcements/new" },
  { icon: "📋", label: "Review Assignments", href: "/admin/assignments" },
  { icon: "🏅", label: "Generate Certificates", href: "/admin/certificates" },
  { icon: "👥", label: "Manage Students", href: "/admin/students" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Admin Nav */}
      <nav className="bg-brand-950 border-b border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-100 text-sm font-semibold">S&D Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border border-brand-700 flex items-center justify-center text-brand-300 hover:text-white">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white font-medium text-xs">AS</div>
              <span className="text-brand-300 text-xs hidden sm:block">Prophet Abiodun Sule</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-brand-900 text-2xl font-medium">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sons & Daughters Prophetic School · Management Console</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-blue-100 shadow-card p-4">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="font-display text-brand-900 text-2xl font-semibold">{s.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upload Video */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
            <h2 className="text-brand-900 font-medium text-sm mb-4 pb-3 border-b border-blue-50">
              Upload Video Lesson
            </h2>
            <label className="border-2 border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-400 bg-brand-50/30 mb-4 transition-colors">
              <Upload className="w-6 h-6 text-brand-400" />
              <span className="text-brand-600 text-sm font-medium">Drop video file here</span>
              <span className="text-slate-400 text-xs">MP4 · Max 2GB · Hosted on Bunny.net</span>
              <input type="file" className="hidden" accept=".mp4,.mov,.avi" />
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Course</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400">
                  <option>Introduction to NT Prophecy</option>
                  <option>The Person & Work of the Holy Spirit</option>
                  <option>Biblical Hermeneutics</option>
                  <option>Spirituality vs. Spiritism</option>
                  <option>Prayer & Intimacy with God</option>
                  <option>Character & Ethics</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. What is NT Prophecy?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400"
                />
              </div>
              <button className="w-full bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors">
                Upload & Publish
              </button>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-50">
              <h2 className="text-brand-900 font-medium text-sm">Recent Applications</h2>
              <Link href="/admin/applications" className="text-brand-500 text-xs hover:text-brand-700">
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {applications.map((a) => {
                const s = statusConfig[a.status];
                const StatusIcon = s.icon;
                return (
                  <div key={a.name} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-medium text-xs flex-shrink-0">
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-brand-900 font-medium">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.church} · {a.date}</div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${s.className}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
          <h2 className="text-brand-900 font-medium text-sm mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-center"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-medium text-slate-600">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
