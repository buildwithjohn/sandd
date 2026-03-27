"use client";
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { BookOpen, Bell, Pin, Calendar } from "lucide-react";

const announcements = [
  {
    id: "1",
    title: "Welcome to the S&D 2025 Cohort!",
    body: "Beloved sons and daughters, welcome to the Sons and Daughters of Prophets Prophetic Training School. We are delighted to have you on this journey. Please begin with the Welcome Module in your dashboard before accessing any course material. Let us approach this training with prayer, humility, and a hunger for God's Word.",
    author: "Prophet Abiodun Sule",
    date: "March 1, 2025",
    is_pinned: true,
  },
  {
    id: "2",
    title: "First Practical Session — Saturday, March 15",
    body: "Our first monthly prophetic activation session will hold on Saturday, March 15, 2025 via Zoom. All Year 1 students are expected to attend. The Zoom link has been shared on the Telegram group. Please come prepared with your notes from Lessons 1–3 of Introduction to NT Prophecy.",
    author: "Admin",
    date: "March 8, 2025",
    is_pinned: true,
  },
  {
    id: "3",
    title: "New Lessons Uploaded — Biblical Hermeneutics",
    body: "Lessons 1 through 4 of Biblical Hermeneutics have been published. Students enrolled in Year 1 can now access them from their course dashboard. Lesson notes (PDF) are available for download within each lesson.",
    author: "Admin",
    date: "March 12, 2025",
    is_pinned: false,
  },
  {
    id: "4",
    title: "Assignment 1 Due — Introduction to NT Prophecy",
    body: "The first written assignment for Introduction to NT Prophecy is now available in your Assignments tab. The topic is: 'How does 1 Corinthians 14:3 shape your understanding of the prophetic ministry in your local church?' Minimum 800 words. Submission deadline: March 28, 2025.",
    author: "Admin",
    date: "March 14, 2025",
    is_pinned: false,
  },
];

function PortalSidebar({ active }: { active: string }) {
  const links = [
    { href: "/portal/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/portal/courses", icon: "📚", label: "My Courses" },
    { href: "/portal/assignments", icon: "📝", label: "Assignments" },
    { href: "/portal/announcements", icon: "📢", label: "Announcements" },
    { href: "/portal/profile", icon: "👤", label: "Profile" },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-blue-50">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-brand-900 text-sm font-medium">S&D School</span>
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function AnnouncementsPage() {
  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-900 text-sm font-semibold">S&D Student Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-slate-400">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-medium text-xs">AO</div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <PortalSidebar active="Announcements" />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">Announcements</h1>
            <p className="text-slate-400 text-sm mt-0.5">School-wide notices from Prophet Abiodun Sule and the admin team.</p>
          </div>

          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-medium text-brand-500 uppercase tracking-wider">Pinned</span>
              </div>
              <div className="space-y-3">
                {pinned.map(a => (
                  <div key={a.id} className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="font-display text-brand-900 text-lg font-medium leading-snug">{a.title}</h2>
                      <span className="bg-brand-100 text-brand-600 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{a.body}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium text-brand-600">{a.author}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          <div className="space-y-3">
            {regular.map(a => (
              <div key={a.id} className="bg-white border border-blue-100 rounded-2xl p-5 shadow-card">
                <h2 className="font-display text-brand-900 text-lg font-medium mb-2 leading-snug">{a.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">{a.body}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{a.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
