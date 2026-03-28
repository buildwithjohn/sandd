"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Award, Search } from "lucide-react";
import Certificate from "@/components/certificates/Certificate";

const eligibleStudents = [
  { id: "s1", name: "Chiamaka Festus",    church: "Treasures in Clay Ibadan",        year: 1 as const, completed: "March 30, 2026", cert_no: "SANDP-2026-001" },
  { id: "s2", name: "Babatunde Ige",      church: "Treasures in Clay Abuja",         year: 1 as const, completed: "March 30, 2026", cert_no: "SANDP-2026-002" },
  { id: "s3", name: "Adeyemi Ogunlade",   church: "Treasures in Clay Lagos",         year: 1 as const, completed: "April 5, 2026",  cert_no: "SANDP-2026-003" },
];

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard",     icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications",  icon: "📋", label: "Applications" },
    { href: "/admin/students",      icon: "👥", label: "Students" },
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

export default function CertificatesPage() {
  const [selected, setSelected] = useState<typeof eligibleStudents[0] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = eligibleStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.church.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-brand-950 border-b border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-display text-brand-100 text-sm font-semibold">S&D Admin Panel</span>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-medium">AS</div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar active="Certificates" />

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-brand-900 text-2xl font-medium">Certificates</h1>
            <p className="text-slate-400 text-sm mt-0.5">Generate and print certificates for students who have completed their year.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student list */}
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
                />
              </div>

              <div className="space-y-3">
                {filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`w-full text-left bg-white rounded-xl border shadow-card p-4 transition-all hover:shadow-card-hover ${
                      selected?.id === s.id
                        ? "border-brand-400 bg-brand-50"
                        : "border-blue-100 hover:border-brand-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-display font-semibold text-brand-700 flex-shrink-0">
                        {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-brand-900 text-sm">{s.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{s.church}</div>
                      </div>
                      <div className="text-right">
                        <div className="bg-green-50 text-green-600 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
                          Year {s.year} Complete
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{s.completed}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No eligible students found</div>
              )}
            </div>

            {/* Certificate preview */}
            <div>
              {selected ? (
                <div>
                  <h2 className="text-brand-900 font-medium text-sm mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-500" />
                    Certificate Preview — {selected.name}
                  </h2>
                  <Certificate
                    studentName={selected.name}
                    certificateType={selected.year === 1 ? "year1" : "year2"}
                    completionDate={selected.completed}
                    certificateNumber={selected.cert_no}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-brand-300" />
                  </div>
                  <p className="text-slate-400 text-sm">Select a student from the list to preview their certificate</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
