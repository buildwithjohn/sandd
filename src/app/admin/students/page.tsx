"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, ChevronDown, Mail } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  church?: string;
  city?: string;
  enrollment_status: string;
  current_year: number;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .not("role", "in", '("admin","super_admin")')
        .order("created_at", { ascending: false });
      setStudents(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.church ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.enrollment_status === filter;
    return matchSearch && matchFilter;
  });

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "active" ? "suspended" : "active";
    setUpdating(id);
    try {
      const supabase = createClient();
      await supabase.from("profiles").update({ enrollment_status: newStatus }).eq("id", id);
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
          <p className="text-gray-500 text-sm mt-1">{activeCount} active students</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, church, or email..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
          </div>
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {["all","active","suspended"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f ? "bg-brand-700 text-white" : "text-gray-400 hover:text-white"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No students found.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {filtered.map((s, i) => (
              <div key={s.id}>
                <div className={`flex items-center gap-4 px-5 py-4 ${i < filtered.length - 1 ? "border-b border-gray-800" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-brand-900 border border-brand-800 flex items-center justify-center font-display font-semibold text-brand-300 text-sm flex-shrink-0">
                    {s.full_name.split(" ").map(n => n[0]).slice(0,2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{s.full_name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{s.email} · {s.church ?? "No church"}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    s.enrollment_status === "active"
                      ? "bg-green-900/40 text-green-300 border border-green-800"
                      : "bg-red-900/40 text-red-300 border border-red-800"
                  }`}>
                    {s.enrollment_status === "active" ? "Active" : "Suspended"}
                  </span>
                  <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="text-gray-500 hover:text-white transition-colors">
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === s.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {expanded === s.id && (
                  <div className="bg-gray-800/50 px-5 py-4 border-b border-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "Year",    value: `Year ${s.current_year}` },
                        { label: "City",    value: s.city ?? "—"             },
                        { label: "Phone",   value: s.phone ?? "—"            },
                        { label: "Joined",  value: new Date(s.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
                      ].map(d => (
                        <div key={d.label} className="bg-gray-900 rounded-xl p-3 text-center">
                          <div className="text-white text-sm font-medium">{d.value}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{d.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <a href={`mailto:${s.email}`}
                        className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium border border-brand-800 px-3 py-1.5 rounded-lg hover:bg-brand-950 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> Email Student
                      </a>
                      <button onClick={() => toggleStatus(s.id, s.enrollment_status)} disabled={updating === s.id}
                        className={`flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors ${
                          s.enrollment_status === "active"
                            ? "border-red-800 text-red-400 hover:bg-red-950"
                            : "border-green-800 text-green-400 hover:bg-green-950"
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
