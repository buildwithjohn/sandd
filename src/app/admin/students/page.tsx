"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, ChevronDown, Mail, Users } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  church?: string;
  city?: string;
  enrollment_status: string;
  current_year: number;
  role: string;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/students");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStudents(data.students ?? []);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load students: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      (s.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.church ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.enrollment_status === filter;
    return matchSearch && matchFilter;
  });

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "active" ? "suspended" : "active";
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id, enrollment_status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStudents(prev => prev.map(s => s.id === id ? { ...s, enrollment_status: newStatus } : s));
      toast.success(`Student ${newStatus === "active" ? "reactivated" : "suspended"}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  }

  const activeCount = students.filter(s => s.enrollment_status === "active").length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">Students</h1>
          <p className="text-white/40 text-sm mt-1 font-sans">
            {loading ? "Loading..." : `${activeCount} active · ${students.length} total registered`}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, church, or email..."
              className="w-full bg-[#0D1320] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/40 font-sans" />
          </div>
          <div className="flex gap-1 bg-[#0D1320] border border-white/[0.08] rounded-xl p-1">
            {["all","active","suspended"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all font-sans ${
                  filter === f ? "bg-[#D4A85C] text-[#080C14]" : "text-white/40 hover:text-white"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-12 text-center">
            <p className="text-white/30 text-sm font-sans">Loading students...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-red-400 text-sm font-sans">{error}</p>
            <p className="text-red-400/60 text-xs font-sans mt-2">Make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-12 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm font-sans">
              {students.length === 0 ? "No students registered yet." : "No students match your search."}
            </p>
          </div>
        ) : (
          <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl overflow-hidden">
            {filtered.map((s, i) => (
              <div key={s.id}>
                <div className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors
                  ${i < filtered.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 text-sm font-sans font-medium flex-shrink-0">
                    {(s.full_name ?? s.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/85 text-sm font-medium font-sans">{s.full_name || "—"}</div>
                    <div className="text-white/30 text-xs mt-0.5 font-sans">{s.email} · {s.church || "No church"}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 font-sans ${
                    s.enrollment_status === "active"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {s.enrollment_status || "unknown"}
                  </span>
                  <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="text-white/25 hover:text-white transition-colors">
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === s.id ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {expanded === s.id && (
                  <div className="bg-white/[0.02] px-5 py-4 border-b border-white/[0.05]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Year",    value: `Year ${s.current_year || 1}` },
                        { label: "City",    value: s.city || "—"                 },
                        { label: "Phone",   value: s.phone || "—"                },
                        { label: "Joined",  value: new Date(s.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
                      ].map(d => (
                        <div key={d.label} className="bg-[#080C14] rounded-xl p-3 text-center">
                          <div className="text-white/70 text-sm font-medium font-sans">{d.value}</div>
                          <div className="text-white/25 text-xs mt-0.5 font-sans">{d.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <a href={`mailto:${s.email}`}
                        className="flex items-center gap-1.5 text-xs text-[#D4A85C]/70 hover:text-[#D4A85C] font-medium border border-[#D4A85C]/20 px-3 py-1.5 rounded-lg hover:bg-[#D4A85C]/5 transition-colors font-sans">
                        <Mail className="w-3.5 h-3.5" /> Email Student
                      </a>
                      <button onClick={() => toggleStatus(s.id, s.enrollment_status || "active")} disabled={updating === s.id}
                        className={`flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors font-sans ${
                          s.enrollment_status === "active"
                            ? "border-red-500/20 text-red-400 hover:bg-red-500/8"
                            : "border-green-500/20 text-green-400 hover:bg-green-500/8"
                        }`}>
                        {s.enrollment_status === "active"
                          ? <><XCircle className="w-3.5 h-3.5" /> {updating === s.id ? "..." : "Suspend"}</>
                          : <><CheckCircle className="w-3.5 h-3.5" /> {updating === s.id ? "..." : "Reactivate"}</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
