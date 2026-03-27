"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCoursesWithProgress } from "@/lib/db";
import type { Course } from "@/types";
import { BookOpen, Bell, Lock, ChevronRight } from "lucide-react";

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
          <Link key={l.href} href={l.href}
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
      </div>
    </aside>
  );
}

export default function CoursesPortalPage() {
  // Mock data — replace with: getCoursesWithProgress(studentId)
  const year1Courses: Course[] = [
    { id: "1", slug: "intro-nt-prophecy", title: "Introduction to NT Prophecy", year: 1, credits: 3, scripture_reference: "1 Cor. 14:3", icon: "📖", order_index: 1, is_published: true, created_at: "", progress: 60, lesson_count: 8, completed_lessons: 5 },
    { id: "2", slug: "person-holy-spirit", title: "The Person & Work of the Holy Spirit", year: 1, credits: 3, scripture_reference: "John 14–16", icon: "🕊️", order_index: 2, is_published: true, created_at: "", progress: 30, lesson_count: 6, completed_lessons: 2 },
    { id: "3", slug: "biblical-hermeneutics", title: "Biblical Hermeneutics", year: 1, credits: 3, scripture_reference: "2 Tim. 2:15", icon: "📜", order_index: 3, is_published: true, created_at: "", progress: 10, lesson_count: 5, completed_lessons: 1 },
    { id: "4", slug: "spirituality-vs-spiritism", title: "Spirituality vs. Spiritism", year: 1, credits: 2, scripture_reference: "1 John 4:1–6", icon: "⚠️", order_index: 4, is_published: true, created_at: "", progress: 0, lesson_count: 4, completed_lessons: 0 },
    { id: "5", slug: "prayer-intimacy", title: "Prayer & Intimacy with God", year: 1, credits: 2, scripture_reference: "Ps. 27:4", icon: "🙏", order_index: 5, is_published: true, created_at: "", progress: 0, lesson_count: 4, completed_lessons: 0 },
    { id: "6", slug: "character-ethics", title: "Character & Ethics", year: 1, credits: 2, scripture_reference: "1 Tim. 3:1–7", icon: "⚖️", order_index: 6, is_published: true, created_at: "", progress: 0, lesson_count: 5, completed_lessons: 0 },
  ];

  const year2Courses = [
    { icon: "🔥", title: "Advanced Prophetic Ministry", credits: 3 },
    { icon: "🛡️", title: "Discernment & Deliverance", credits: 3 },
    { icon: "✝️", title: "Theology of the New Covenant", credits: 3 },
    { icon: "👑", title: "Leadership in Prophetic Ministry", credits: 2 },
    { icon: "🌍", title: "Prophetic Evangelism", credits: 2 },
  ];

  const getProgressColor = (p: number) =>
    p === 100 ? "bg-green-500" : p > 0 ? "bg-brand-600" : "bg-slate-200";

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
        <PortalSidebar active="My Courses" />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">My Courses</h1>
            <p className="text-slate-400 text-sm mt-0.5">Year 1 — Certificate in Prophetic Ministry</p>
          </div>

          {/* Year 1 courses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {year1Courses.map((course) => (
              <Link
                key={course.id}
                href={`/portal/courses/${course.slug}`}
                className="bg-white rounded-xl border border-blue-100 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-2xl">
                    {course.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{course.completed_lessons}/{course.lesson_count} lessons</div>
                    <div className={`text-xs font-medium mt-0.5 ${
                      (course.progress ?? 0) === 100 ? "text-green-600" :
                      (course.progress ?? 0) > 0 ? "text-brand-600" : "text-slate-400"
                    }`}>
                      {(course.progress ?? 0) === 100 ? "Complete ✓" : `${course.progress ?? 0}%`}
                    </div>
                  </div>
                </div>
                <h3 className="text-brand-900 font-medium text-sm mb-1 group-hover:text-brand-700 transition-colors">
                  {course.title}
                </h3>
                {course.scripture_reference && (
                  <p className="text-slate-400 text-xs mb-3">{course.scripture_reference}</p>
                )}
                {/* Progress bar */}
                <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(course.progress ?? 0)}`}
                    style={{ width: `${course.progress ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-brand-50 text-brand-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    {course.credits} credits
                  </span>
                  <span className="text-brand-500 text-xs group-hover:text-brand-700 flex items-center gap-0.5">
                    Continue <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Year 2 - locked */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-slate-400" />
              <h2 className="text-slate-500 font-medium text-sm">Year 2 — Locked until Year 1 is complete</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {year2Courses.map((c) => (
                <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg grayscale">{c.icon}</div>
                    <div>
                      <div className="text-slate-500 text-sm font-medium">{c.title}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{c.credits} credits</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
