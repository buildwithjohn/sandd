"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { Search, Award } from "lucide-react";
import Certificate from "@/components/certificates/Certificate";

interface EligibleStudent {
  id: string;
  full_name: string;
  church?: string;
  created_at: string;
  cert_no: string;
}

export default function CertificatesPage() {
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [selected, setSelected] = useState<EligibleStudent | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      // Students who have completed Year 1 (current_year = 2 means they advanced)
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, church, created_at")
        .eq("role", "student")
        .eq("current_year", 2)
        .eq("enrollment_status", "active");
      const enriched = (data ?? []).map((s: any, i: number) => ({
        ...s,
        cert_no: `SANDP-2026-${String(i + 1).padStart(3, "0")}`,
      }));
      setStudents(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter(s =>
    !search ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.church ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">Certificates</h1>
          <p className="text-gray-500 text-sm mt-1">Generate certificates for Year 1 graduates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student list */}
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
            </div>

            {loading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <Award className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No Year 1 graduates yet.</p>
                <p className="text-gray-600 text-xs mt-1">Students appear here after completing all Year 1 courses.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className={`w-full text-left bg-gray-900 rounded-xl border p-4 transition-all ${
                      selected?.id === s.id ? "border-brand-600 bg-brand-950/20" : "border-gray-800 hover:border-gray-700"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-900/40 border border-green-800 flex items-center justify-center text-green-300 font-display font-semibold flex-shrink-0">
                        {s.full_name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{s.full_name}</div>
                        <div className="text-gray-500 text-xs">{s.church ?? "—"}</div>
                      </div>
                      <span className="text-xs bg-green-900/40 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">Year 1 ✓</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Certificate preview */}
          <div>
            {selected ? (
              <div>
                <h2 className="text-gray-400 text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-400" /> Preview — {selected.full_name}
                </h2>
                <Certificate
                  studentName={selected.full_name}
                  certificateType="year1"
                  completionDate={new Date().toLocaleDateString("en-NG", { dateStyle: "long" })}
                  certificateNumber={selected.cert_no}
                />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                <Award className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a student to preview their certificate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
