"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Bell, CheckCircle, XCircle, Clock, Eye, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

const applications = [
  { id: "ap1", full_name: "Oluwaseun Adeyemi", email: "o.adeyemi@gmail.com", church: "CCC Lagos Mainland", city: "Lagos", phone: "+234 801 234 5678", applied_at: "March 24, 2025", status: "pending", testimony: "From a young age, I have had a deep sensitivity to the things of the Spirit. At age 14, I had my first open vision during a morning prayer meeting at our parish. I saw a field of wheat being harvested, and the Lord spoke clearly to me saying 'I have set you apart to speak to my people.' Since then, I have ministered prophetically under the covering of our shepherd in several parish events, and the words have been confirmed by leadership on multiple occasions. I am applying to this school because I believe that gifting without training is dangerous, and I want to be rooted in the Word before I go further in this ministry..." },
  { id: "ap2", full_name: "Chiamaka Festus", email: "chiamaka.f@yahoo.com", church: "CCC Ibadan Central", city: "Ibadan", phone: "+234 803 456 7890", applied_at: "March 22, 2025", status: "accepted", testimony: "I have been prophetically active in my local parish for 3 years. My shepherd has consistently confirmed the prophetic words I have shared, and I have seen several of them come to pass accurately. I feel a strong call to deepen my understanding of New Testament prophecy, particularly after realising that much of what is practiced in our church tradition still carries Old Testament flavour without New Testament grounding..." },
  { id: "ap3", full_name: "Babatunde Ige", email: "btige@email.com", church: "CCC Abuja", city: "Abuja", phone: "+234 806 789 0123", applied_at: "March 20, 2025", status: "accepted", testimony: "The Lord has placed a burning desire in my heart to minister prophetically with accuracy and integrity. I have read extensively on New Testament prophecy and attended several prophetic training seminars, but I believe formal grounding is still needed. My pastor has confirmed my calling and is fully supportive of this application..." },
  { id: "ap4", full_name: "Esther Madu", email: "esther.madu@gmail.com", church: "CCC Port Harcourt", city: "Port Harcourt", phone: "+234 809 012 3456", applied_at: "March 26, 2025", status: "pending", testimony: "I surrendered to the prophetic calling after a powerful encounter during a fasting period in 2022. Since then I have been ministering under close supervision of my shepherd and two senior prophets in our diocese. Each word I have shared publicly has been submitted for review before delivery. I believe in accountability and am eager to be trained formally..." },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-amber-50 text-amber-600 border-amber-200" },
  accepted: { label: "Accepted", className: "bg-green-50 text-green-600 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-500 border-red-200" },
  reviewing:{ label: "Reviewing",className: "bg-blue-50 text-brand-600 border-brand-200" },
};

function AdminSidebar({ active }: { active: string }) {
  const links = [
    { href: "/admin/dashboard", icon: "🏠", label: "Dashboard" },
    { href: "/admin/applications", icon: "📋", label: "Applications" },
    { href: "/admin/students", icon: "👥", label: "Students" },
    { href: "/admin/assignments", icon: "📝", label: "Assignments" },
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
              active === l.label
                ? "bg-brand-800 text-brand-100 font-medium"
                : "text-brand-400 hover:bg-brand-900 hover:text-brand-200"
            }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function ApplicationsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const app = applications.find(a => a.id === selected);
  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      if (status === "accepted") {
        // Full accept flow: create account, enroll, send welcome email
        const res = await fetch("/api/admin/accept-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`${data.message} — welcome email sent.`);
      } else {
        // Reject — just update status
        const supabase = createClient();
        await supabase.from("applications").update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        }).eq("id", id);
        toast.success("Application rejected.");
      }
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
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
        <AdminSidebar active="Applications" />

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-brand-900 text-2xl font-medium">Applications</h1>
              <p className="text-slate-400 text-sm mt-0.5">{applications.filter(a => a.status === "pending").length} pending review</p>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-blue-100 p-1">
              {["all", "pending", "accepted", "rejected"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f ? "bg-brand-700 text-white" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map(a => {
              const s = statusConfig[a.status];
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-blue-100 shadow-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-display font-semibold text-brand-700 flex-shrink-0">
                      {a.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-brand-900 text-sm">{a.full_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.church} · {a.city} · Applied {a.applied_at}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${s.className}`}>
                      {s.label}
                    </span>
                    <button
                      onClick={() => setSelected(selected === a.id ? null : a.id)}
                      className="flex items-center gap-1 text-brand-600 text-xs font-medium hover:text-brand-800 flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>

                  {/* Expanded view */}
                  {selected === a.id && (
                    <div className="mt-4 pt-4 border-t border-blue-50">
                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div><span className="text-slate-400">Email: </span><span className="text-brand-900">{a.email}</span></div>
                        <div><span className="text-slate-400">Phone: </span><span className="text-brand-900">{a.phone}</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Testimony</div>
                        <div className="bg-brand-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                          {a.testimony}
                        </div>
                      </div>
                      {a.status === "pending" && (
                        <div className="mb-4">
                          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Admin Notes (optional)</label>
                          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Add internal notes..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none" />
                        </div>
                      )}
                      {a.status === "pending" && (
                        <div className="flex gap-3">
                          <button onClick={() => updateStatus(a.id, "rejected")} disabled={updating}
                            className="flex-1 border border-red-200 text-red-500 font-medium text-sm py-2.5 rounded-xl hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button onClick={() => updateStatus(a.id, "accepted")} disabled={updating}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                            <CheckCircle className="w-4 h-4" /> {updating ? "Saving..." : "Accept"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
