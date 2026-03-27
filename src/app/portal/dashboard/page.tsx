"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { BookOpen, CheckCircle, TrendingUp, Award, Play, Bell } from "lucide-react";

// Sidebar component inline for portal
function PortalSidebar({ active }: { active: string }) {
  const links = [
    { href: "/portal/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/portal/courses", icon: "📚", label: "My Courses" },
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
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <div className="mt-4 pt-3 border-t border-blue-50">
          <button className="flex items-center gap-2 px-2 py-2 text-sm text-slate-400 hover:text-slate-600 w-full">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardPage() {
  // Mock data — in production these come from Supabase
  const student = { name: "Adeyemi Ogunlade", year: 1, church: "CCC Lagos", enrolled_since: "March 2025" };
  const stats = [
    { icon: BookOpen, label: "Active Courses", value: "6" },
    { icon: CheckCircle, label: "Lessons Done", value: "7" },
    { icon: TrendingUp, label: "Quiz Average", value: "82%" },
    { icon: Award, label: "Total Credits", value: "15" },
  ];
  const recentLessons = [
    { icon: "📖", title: "What is New Testament Prophecy?", course: "Intro to NT Prophecy", status: "completed" },
    { icon: "🕊️", title: "The Holy Spirit and the Prophetic Voice", course: "Person & Work of the HS", status: "in_progress" },
    { icon: "📜", title: "How to Study the Bible Prophetically", course: "Biblical Hermeneutics", status: "not_started" },
  ];
  const statusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: "Complete", className: "bg-green-50 text-green-600" },
    in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-600" },
    not_started: { label: "Not Started", className: "bg-blue-50 text-blue-500" },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Portal Nav */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-900 text-sm font-semibold">S&D Student Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-slate-400 hover:text-brand-600">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-medium text-xs">
              AO
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <PortalSidebar active="Dashboard" />

        <main className="flex-1 min-w-0">
          {/* Welcome header */}
          <div className="bg-brand-950 rounded-2xl p-6 mb-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-700 flex items-center justify-center font-display text-xl text-white font-bold flex-shrink-0">
              AO
            </div>
            <div>
              <p className="text-brand-400 text-xs mb-0.5">Welcome back</p>
              <h1 className="font-display text-white text-xl font-medium">{student.name}</h1>
              <p className="text-brand-400 text-xs mt-0.5">Year 1 Student · {student.church} · Enrolled {student.enrolled_since}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-blue-100 shadow-card p-4 text-center">
                <div className="font-display text-brand-900 text-2xl font-semibold">{s.value}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Welcome Module */}
          <div className="bg-brand-700 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-brand-200 text-xs font-medium uppercase tracking-wider mb-1">Start Here</div>
              <h3 className="font-display text-white text-lg font-medium">
                Welcome to S&D Prophetic School
              </h3>
              <p className="text-brand-200 text-sm mt-1">
                Prophet Abiodun Sule introduces the heart and vision of this school.
              </p>
            </div>
            <button className="bg-white text-brand-700 font-medium text-sm px-4 py-2.5 rounded-xl flex-shrink-0 flex items-center gap-2 hover:bg-brand-50 transition-colors">
              <Play className="w-4 h-4" fill="currentColor" /> Watch Now
            </button>
          </div>

          {/* Recent Lessons */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-brand-900 font-medium text-sm">Recent Lessons</h2>
              <Link href="/portal/courses" className="text-brand-500 text-xs hover:text-brand-700">
                View all courses →
              </Link>
            </div>
            <div className="space-y-1">
              {recentLessons.map((l) => {
                const s = statusConfig[l.status];
                return (
                  <div key={l.title} className="flex items-center gap-3 py-3 border-b border-blue-50 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-lg flex-shrink-0">
                      {l.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-brand-900 font-medium truncate">{l.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.course}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.className}`}>
                      {s.label}
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
