"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { BookOpen, CheckCircle, TrendingUp, Award, Play, Bell, LogOut, ChevronRight } from "lucide-react";

function Sidebar({ name, initials, onSignOut }: { name: string; initials: string; onSignOut: () => void }) {
  const links = [
    { href: "/portal/dashboard",     icon: "🏠", label: "Dashboard"     },
    { href: "/portal/courses",       icon: "📚", label: "My Courses"    },
    { href: "/portal/assignments",   icon: "📝", label: "Assignments"   },
    { href: "/portal/announcements", icon: "📢", label: "Announcements" },
    { href: "/portal/profile",       icon: "👤", label: "Profile"       },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-card sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-blue-50">
          <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center text-white font-display font-bold text-sm">
            {initials}
          </div>
          <div>
            <div className="text-brand-900 text-xs font-semibold">{name}</div>
            <div className="text-[10px] text-slate-400">Year 1 Student</div>
          </div>
        </div>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition-colors">
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
        <div className="border-t border-blue-50 mt-3 pt-3">
          <button onClick={onSignOut}
            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState({ name: "Student", church: "", enrolled: "" });
  const [initials, setInitials] = useState("ST");
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quiz_avg: 0, credits: 0 });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!profile) return;
      if (profile.role === "admin") { router.push("/admin/dashboard"); return; }

      const name = profile.full_name ?? "Student";
      const ini = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
      setStudent({ name, church: profile.church ?? "", enrolled: new Date(profile.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" }) });
      setInitials(ini);

      const { count: courses } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("student_id", user.id);
      const { data: progress } = await supabase.from("lesson_progress").select("status").eq("student_id", user.id);
      const completed = progress?.filter(p => p.status === "completed").length ?? 0;
      const { data: attempts } = await supabase.from("quiz_attempts").select("score").eq("student_id", user.id);
      const avg = attempts?.length ? Math.round(attempts.reduce((a: number, b: { score: number }) => a + b.score, 0) / attempts.length) : 0;

      setStats({ courses: courses ?? 0, lessons: completed, quiz_avg: avg, credits: (courses ?? 0) * 2 });
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const recentLessons = [
    { icon: "📖", title: "What is New Testament Prophecy?",      course: "Intro to NT Prophecy", status: "completed"  },
    { icon: "🕊️", title: "The Holy Spirit and the Prophetic Voice", course: "Person & Work of the HS", status: "in_progress" },
    { icon: "📜", title: "How to Study the Bible Prophetically",  course: "Biblical Hermeneutics",  status: "not_started" },
  ];
  const statusMap: Record<string, { label: string; cls: string }> = {
    completed:   { label: "Complete",     cls: "bg-green-50 text-green-600 border border-green-200" },
    in_progress: { label: "In Progress",  cls: "bg-amber-50 text-amber-600 border border-amber-200" },
    not_started: { label: "Not Started",  cls: "bg-blue-50 text-brand-600 border border-blue-200"   },
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      {/* NAV — light blue, student-feel */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display text-brand-900 text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-[10px] text-brand-400 uppercase tracking-wide">Student Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-slate-400 hover:text-brand-600">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <Sidebar name={student.name} initials={initials} onSignOut={handleSignOut} />

        <main className="flex-1 min-w-0 space-y-5">
          {/* Welcome banner */}
          <div className="bg-brand-700 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 border-2 border-brand-500 flex items-center justify-center font-display text-2xl text-white font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-brand-300 text-xs uppercase tracking-wide mb-0.5">Welcome back</p>
              <h1 className="font-display text-white text-xl font-medium">{student.name}</h1>
              <p className="text-brand-300 text-xs mt-0.5">Year 1 · {student.church} · Enrolled {student.enrolled}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BookOpen,    label: "Courses",      value: stats.courses   },
              { icon: CheckCircle, label: "Done",         value: stats.lessons   },
              { icon: TrendingUp,  label: "Quiz Avg",     value: `${stats.quiz_avg}%` },
              { icon: Award,       label: "Credits",      value: stats.credits   },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-blue-100 shadow-card p-4 text-center">
                <s.icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                <div className="font-display text-brand-900 text-2xl font-semibold">{s.value}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Welcome Module CTA */}
          <div className="bg-brand-950 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-brand-400 text-xs uppercase tracking-wide mb-1">Start Here</div>
              <h3 className="font-display text-white text-lg font-medium">Welcome from Prophet Abiodun Sule</h3>
              <p className="text-brand-400 text-sm mt-0.5">Watch this before starting any course.</p>
            </div>
            <Link href="/portal/lessons/welcome"
              className="bg-brand-500 hover:bg-brand-400 text-white font-medium text-sm px-4 py-2.5 rounded-xl flex-shrink-0 flex items-center gap-2 transition-colors">
              <Play className="w-4 h-4" fill="currentColor" /> Watch
            </Link>
          </div>

          {/* Recent Lessons */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-brand-900 font-semibold text-sm">Continue Learning</h2>
              <Link href="/portal/courses" className="text-brand-500 text-xs hover:text-brand-700 flex items-center gap-0.5">
                All courses <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {recentLessons.map(l => {
                const s = statusMap[l.status];
                return (
                  <div key={l.title} className="flex items-center gap-3 py-3 border-b border-blue-50 last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-lg flex-shrink-0">
                      {l.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-brand-900 font-medium truncate">{l.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.course}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
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
